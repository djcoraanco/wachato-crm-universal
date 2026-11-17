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

  // 1. Verificar si ya existe algún usuario con platformRole "superadmin"
  const existingSuperAdmin = await db
    .select({ id: schema.user.id, email: schema.user.email })
    .from(schema.user)
    .where(eq(schema.user.platformRole, "superadmin"))
    .limit(1);

  if (existingSuperAdmin[0]) {
    return {
      created: false,
      email: existingSuperAdmin[0].email,
      message: "Ya existe un usuario con rol SuperAdmin en el sistema",
    };
  }

  // 2. Parámetros del SuperAdmin
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

  // 3. Verificar si el usuario ya existe por email (ej. creado anteriormente como user regular)
  const existingUser = await db
    .select({ id: schema.user.id, email: schema.user.email })
    .from(schema.user)
    .where(eq(schema.user.email, email))
    .limit(1);

  if (existingUser[0]) {
    // Promover el usuario existente a superadmin
    await db
      .update(schema.user)
      .set({ platformRole: "superadmin", updatedAt: new Date() })
      .where(eq(schema.user.id, existingUser[0].id));

    console.log(`[superadmin] Usuario existente ${email} promovido a SuperAdmin.`);
    return {
      created: true,
      email,
      message: `Usuario existente ${email} promovido a SuperAdmin`,
    };
  }

  // 4. Crear nuevo usuario SuperAdmin desde cero
  const userId = newId("user");
  const hashedPassword = await hashPassword(password);

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
