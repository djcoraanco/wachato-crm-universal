import { and, count, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { newId } from "@/lib/db/ids";

/** Etapas sembradas del pipeline (US2). */
const SEED_STAGES: { name: string; kind: "open" | "won" | "lost" }[] = [
  { name: "Nuevo", kind: "open" },
  { name: "En conversación", kind: "open" },
  { name: "Interesado", kind: "open" },
  { name: "Cliente", kind: "won" },
  { name: "Perdido", kind: "lost" },
];

/**
 * Primer registro de la instancia: crea la organización, deja al usuario como
 * propietario y siembra pipeline + perfil del agente.
 *
 * Solo actúa si NO existe ninguna organización (las cuentas de equipo las crea
 * el propietario y reciben su membresía explícita). Un advisory lock evita que
 * dos registros simultáneos en instancia vacía creen dos organizaciones.
 */
export async function onUserCreated(userId: string, userName: string) {
  const db = getDb();
  await db.transaction(async (tx) => {
    // Lock transaccional de "primer arranque" (clave arbitraria fija):
    // dos registros simultáneos en instancia vacía → solo uno crea la org.
    await tx.execute(sql`select pg_advisory_xact_lock(874201)`);
    const [orgs] = await tx
      .select({ n: count() })
      .from(schema.organization);
    if ((orgs?.n ?? 0) > 0) return;

    const orgId = newId("organization");
    await tx.insert(schema.organization).values({
      id: orgId,
      name: userName ? `Negocio de ${userName}` : "Mi negocio",
      slug: "principal",
    });

    // El primer usuario de la instancia recibe automáticamente platformRole superadmin
    await tx
      .update(schema.user)
      .set({ platformRole: "superadmin" })
      .where(eq(schema.user.id, userId));

    await tx.insert(schema.member).values({
      id: newId("member"),
      organizationId: orgId,
      userId,
      role: "owner",
    });
    await tx.insert(schema.pipelineStage).values(
      SEED_STAGES.map((s, i) => ({
        id: newId("stage"),
        organizationId: orgId,
        name: s.name,
        position: i,
        kind: s.kind,
      }))
    );
    await tx.insert(schema.agentProfile).values({
      id: newId("agentProfile"),
      organizationId: orgId,
    });
  });
}

/** Organización activa de un usuario (su primera membresía). */
export async function resolveActiveOrganizationId(
  userId: string
): Promise<string | null> {
  return (await resolveMembership(userId))?.organizationId ?? null;
}

export async function resolveMembership(
  userId: string,
  preferredOrgId?: string | null
): Promise<{ organizationId: string; role: string } | null> {
  const db = getDb();

  // Si se solicita una organización preferida (switch de contexto de agencia)
  if (preferredOrgId) {
    // 1. Membresía directa en esa organización
    const direct = await db
      .select({
        organizationId: schema.member.organizationId,
        role: schema.member.role,
      })
      .from(schema.member)
      .where(
        and(
          eq(schema.member.userId, userId),
          eq(schema.member.organizationId, preferredOrgId)
        )
      )
      .limit(1);

    if (direct[0]) return direct[0];

    // 2. O si es cliente de una agencia donde el usuario es miembro
    const agencyMember = await db
      .select({ role: schema.agencyMember.role })
      .from(schema.agencyMember)
      .innerJoin(
        schema.organization,
        eq(schema.organization.agencyId, schema.agencyMember.agencyId)
      )
      .where(
        and(
          eq(schema.agencyMember.userId, userId),
          eq(schema.organization.id, preferredOrgId)
        )
      )
      .limit(1);

    if (agencyMember[0]) {
      return { organizationId: preferredOrgId, role: "owner" };
    }
  }

  // Fallback: primera membresía del usuario
  const rows = await db
    .select({
      organizationId: schema.member.organizationId,
      role: schema.member.role,
    })
    .from(schema.member)
    .where(eq(schema.member.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}
