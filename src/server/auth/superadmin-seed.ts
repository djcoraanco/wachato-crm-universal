import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { getDb, schema } from "@/lib/db";
import { newId } from "@/lib/db/ids";
import { getPlanBySlug, upsertSubscription } from "@/server/billing/service";

const SEED_STAGES: { name: string; kind: "open" | "won" | "lost" }[] = [
  { name: "Nuevo", kind: "open" },
  { name: "En conversación", kind: "open" },
  { name: "Interesado", kind: "open" },
  { name: "Cliente", kind: "won" },
  { name: "Perdido", kind: "lost" },
];

export type SuperAdminSeedResult = {
  created: boolean;
  email: string;
  message: string;
};

/**
 * Asegura la existencia de al menos un usuario SuperAdmin en el sistema.
 * Idempotente: Si ya existe un superadmin, no realiza ninguna acción.
 * Si no existe, lo crea con credenciales seguras definidas en .env o por defecto.
 */
export async function ensureDefaultSuperAdmin(opts?: {
  email?: string;
  password?: string;
  name?: string;
}): Promise<SuperAdminSeedResult> {
  const db = getDb();

  // 1. Parámetros del SuperAdmin
  const email = (
    opts?.email ||
    process.env.SUPERADMIN_EMAIL ||
    "admin@wachato.com"
  ).trim().toLowerCase();

  const password =
    opts?.password || process.env.SUPERADMIN_PASSWORD || "AdminVocero2026!";

  const name = (opts?.name || process.env.SUPERADMIN_NAME || "Super Admin").trim();

  if (password.length < 8) {
    throw new Error("La contraseña del SuperAdmin debe tener al menos 8 caracteres");
  }

  const hashedPassword = await hashPassword(password);

  // 2. Verificar si el usuario ya existe por email (ej. creado vía web o en seed anterior)
  const existingUser = await db
    .select({ id: schema.user.id, email: schema.user.email, platformRole: schema.user.platformRole })
    .from(schema.user)
    .where(eq(schema.user.email, email))
    .limit(1);

  if (existingUser[0]) {
    const u = existingUser[0];
    await db
      .update(schema.user)
      .set({ platformRole: "superadmin", name, updatedAt: new Date() })
      .where(eq(schema.user.id, u.id));

    // Sincronizar contraseña en account
    await db
      .update(schema.account)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(schema.account.userId, u.id));

    console.log(`[superadmin] ✅ SuperAdmin verificado y sincronizado: ${email}`);
    return {
      created: false,
      email,
      message: `SuperAdmin ${email} verificado y sincronizado`,
    };
  }

  // 3. Si se configuró un email personalizado pero existe el placeholder "admin@wachato.com", migrarlo
  if (email !== "admin@wachato.com") {
    const placeholderUser = await db
      .select({ id: schema.user.id, email: schema.user.email })
      .from(schema.user)
      .where(eq(schema.user.email, "admin@wachato.com"))
      .limit(1);

    if (placeholderUser[0]) {
      const p = placeholderUser[0];
      await db
        .update(schema.user)
        .set({ email, name, platformRole: "superadmin", updatedAt: new Date() })
        .where(eq(schema.user.id, p.id));

      await db
        .update(schema.account)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(schema.account.userId, p.id));

      console.log(`[superadmin] ✅ SuperAdmin migrado de admin@wachato.com a: ${email}`);
      return {
        created: true,
        email,
        message: `SuperAdmin migrado de admin@wachato.com a ${email}`,
      };
    }
  }

  // 4. Si ya existe otro SuperAdmin y no se especificó un email personalizado
  if (!opts?.email && !process.env.SUPERADMIN_EMAIL) {
    const otherSuperAdmin = await db
      .select({ id: schema.user.id, email: schema.user.email })
      .from(schema.user)
      .where(eq(schema.user.platformRole, "superadmin"))
      .limit(1);

    if (otherSuperAdmin[0]) {
      return {
        created: false,
        email: otherSuperAdmin[0].email,
        message: "Ya existe un usuario con rol SuperAdmin en el sistema",
      };
    }
  }

  // 5. Crear nuevo usuario SuperAdmin desde cero
  const userId = newId("user");

  await db.transaction(async (tx) => {
    // A) Insertar usuario
    await tx.insert(schema.user).values({
      id: userId,
      name,
      email,
      emailVerified: true,
      platformRole: "superadmin",
    });

    // B) Insertar credencial en tabla account (formato Better Auth)
    await tx.insert(schema.account).values({
      id: newId("account"),
      accountId: userId,
      providerId: "credential",
      userId,
      password: hashedPassword,
    });

    // C) Crear organización maestra
    const orgId = newId("organization");
    await tx.insert(schema.organization).values({
      id: orgId,
      name: "Wachato Central Platform",
      slug: "master",
    });

    // D) Asignar rol owner en la organización
    await tx.insert(schema.member).values({
      id: newId("member"),
      organizationId: orgId,
      userId,
      role: "owner",
    });

    // E) Pipeline stages iniciales
    await tx.insert(schema.pipelineStage).values(
      SEED_STAGES.map((s, i) => ({
        id: newId("stage"),
        organizationId: orgId,
        name: s.name,
        position: i,
        kind: s.kind,
      }))
    );

    // F) Perfil del agente
    await tx.insert(schema.agentProfile).values({
      id: newId("agentProfile"),
      organizationId: orgId,
    });
  });

  // G) Asignar plan Agency Scale (ilimitado) a la organización del SuperAdmin
  try {
    const plan =
      (await getPlanBySlug("agency-scale")) || (await getPlanBySlug("pro"));
    if (plan) {
      const now = new Date();
      const nextYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      await upsertSubscription({
        organizationId: userId, // o la master org
        planId: plan.id,
        provider: "stripe",
        providerSubscriptionId: `admin_master_sub`,
        status: "active",
        billingInterval: "yearly",
        currentPeriodStart: now,
        currentPeriodEnd: nextYear,
        metadata: { isMasterAdmin: true },
      });
    }
  } catch (subErr) {
    console.warn("[superadmin] Advertencia al vincular plan master:", subErr);
  }

  console.log(`[superadmin] ✅ SuperAdmin creado con éxito: ${email}`);

  return {
    created: true,
    email,
    message: `SuperAdmin creado exitosamente con email ${email}`,
  };
}
