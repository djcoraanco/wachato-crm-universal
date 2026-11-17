import fs from "node:fs";
import path from "node:path";
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
 * Lee una variable de entorno de process.env o como fallback directamente
 * de los archivos .env en el disco (/app/.env, ./.env, /data/.env).
 */
function getEnvConfig(key: string): string | undefined {
  const runtimeVal = process.env[key];
  if (runtimeVal && runtimeVal.trim().length > 0) {
    return runtimeVal.trim();
  }

  const candidatePaths = [
    path.resolve(process.cwd(), ".env"),
    "/app/.env",
    "/data/.env",
  ];

  for (const envPath of candidatePaths) {
    try {
      if (fs.existsSync(envPath)) {
        const raw = fs.readFileSync(envPath, "utf-8");
        for (const line of raw.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
          const [k, ...v] = trimmed.split("=");
          if (k?.trim() === key) {
            const val = v.join("=").trim().replace(/^["']|["']$/g, "");
            if (val.length > 0) return val;
          }
        }
      }
    } catch {
      // Ignorar errores de acceso al archivo
    }
  }

  return undefined;
}

/**
 * Asegura la existencia de al menos un usuario SuperAdmin en el sistema.
 * Idempotente: Si ya existe un superadmin, sincroniza sus credenciales.
 * Si no existe, lo crea con credenciales seguras definidas en .env o por defecto.
 */
export async function ensureDefaultSuperAdmin(opts?: {
  email?: string;
  password?: string;
  name?: string;
}): Promise<SuperAdminSeedResult> {
  const db = getDb();

  // 1. Parámetros del SuperAdmin (prioridad: opts -> env -> default neutral)
  const email = (
    opts?.email ||
    getEnvConfig("SUPERADMIN_EMAIL") ||
    "admin@crm.com"
  ).trim().toLowerCase();

  const password =
    opts?.password || getEnvConfig("SUPERADMIN_PASSWORD") || "Admin123456!";

  const name = (opts?.name || getEnvConfig("SUPERADMIN_NAME") || "Super Admin").trim();

  if (password.length < 8) {
    throw new Error("La contraseña del SuperAdmin debe tener al menos 8 caracteres");
  }

  const hashedPassword = await hashPassword(password);

  function logBanner(mode: "verificado" | "migrado" | "creado") {
    console.log("\n========================================================================");
    console.log(`[superadmin] 🔑 ACCESO SUPERADMIN (${mode.toUpperCase()}):`);
    console.log(`[superadmin] 📧 Correo:     ${email}`);
    console.log(`[superadmin] 🔒 Contraseña: ${password}`);
    console.log(`[superadmin] 🌐 Rol:        SuperAdmin (Acceso Total y Configuración)`);
    console.log("========================================================================\n");
  }

  // 2. Verificar si el usuario ya existe por email
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

    logBanner("verificado");
    return {
      created: false,
      email,
      message: `SuperAdmin ${email} verificado y sincronizado`,
    };
  }

  // 3. Si existe el usuario de instalaciones previas "admin@wachato.com", migrarlo al nuevo correo
  const oldWachatoUser = await db
    .select({ id: schema.user.id, email: schema.user.email })
    .from(schema.user)
    .where(eq(schema.user.email, "admin@wachato.com"))
    .limit(1);

  if (oldWachatoUser[0] && email !== "admin@wachato.com") {
    const p = oldWachatoUser[0];
    await db
      .update(schema.user)
      .set({ email, name, platformRole: "superadmin", updatedAt: new Date() })
      .where(eq(schema.user.id, p.id));

    await db
      .update(schema.account)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(schema.account.userId, p.id));

    logBanner("migrado");
    return {
      created: true,
      email,
      message: `SuperAdmin migrado de admin@wachato.com a ${email}`,
    };
  }

  // 4. Si ya existe cualquier usuario en la base de datos (por ejemplo, creado en /register inicial),
  // promover al primer usuario a SuperAdmin y sincronizarle contraseña para que nunca quede bloqueado
  const anyFirstUser = await db
    .select({ id: schema.user.id, email: schema.user.email, platformRole: schema.user.platformRole })
    .from(schema.user)
    .limit(1);

  if (anyFirstUser[0] && !getEnvConfig("SUPERADMIN_EMAIL")) {
    const u = anyFirstUser[0];
    await db
      .update(schema.user)
      .set({ platformRole: "superadmin", updatedAt: new Date() })
      .where(eq(schema.user.id, u.id));

    console.log(`[superadmin] 🛡️ Usuario existente promovido a SuperAdmin: ${u.email}`);
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
      name: "Plataforma Central",
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
        organizationId: userId,
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

  logBanner("creado");

  return {
    created: true,
    email,
    message: `SuperAdmin creado exitosamente con email ${email}`,
  };
}
