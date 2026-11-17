import { getDb, schema } from "@/lib/db";
import { newId } from "@/lib/db/ids";
import type { AgencyBranding, AgencyMemberRole, AgencyStatus } from "@/lib/billing/types";
import { eq } from "drizzle-orm";

export type AgencyRecord = typeof schema.agency.$inferSelect;
export type AgencyMemberRecord = typeof schema.agencyMember.$inferSelect;

/**
 * Crea una nueva agencia / partner de marca blanca.
 */
export async function createAgency(params: {
  name: string;
  slug: string;
  ownerUserId: string;
  subdomain?: string;
  customDomain?: string;
  branding?: AgencyBranding;
  status?: AgencyStatus;
  metadata?: Record<string, unknown>;
}): Promise<AgencyRecord> {
  const db = getDb();
  const agencyId = newId("agency");

  const [created] = await db
    .insert(schema.agency)
    .values({
      id: agencyId,
      name: params.name,
      slug: params.slug.toLowerCase().trim(),
      subdomain: params.subdomain ? params.subdomain.toLowerCase().trim() : null,
      customDomain: params.customDomain ? params.customDomain.toLowerCase().trim() : null,
      ownerUserId: params.ownerUserId,
      branding: params.branding ?? {
        brandName: params.name,
        primaryColor: "#00C4C0",
        accentColor: "#00E5E0",
      },
      status: params.status ?? "active",
      metadata: params.metadata,
    })
    .returning();

  // Asociar automáticamente al propietario como agency_owner
  await db.insert(schema.agencyMember).values({
    id: newId("agencyMember"),
    agencyId,
    userId: params.ownerUserId,
    role: "agency_owner",
  });

  return created!;
}

export async function getAgencyById(id: string): Promise<AgencyRecord | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.agency)
    .where(eq(schema.agency.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getAgencyBySlug(slug: string): Promise<AgencyRecord | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.agency)
    .where(eq(schema.agency.slug, slug.toLowerCase().trim()))
    .limit(1);
  return rows[0] ?? null;
}

export async function getAgencyBySubdomain(subdomain: string): Promise<AgencyRecord | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.agency)
    .where(eq(schema.agency.subdomain, subdomain.toLowerCase().trim()))
    .limit(1);
  return rows[0] ?? null;
}

export async function getAgencyByCustomDomain(customDomain: string): Promise<AgencyRecord | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.agency)
    .where(eq(schema.agency.customDomain, customDomain.toLowerCase().trim()))
    .limit(1);
  return rows[0] ?? null;
}

export async function updateAgencyBranding(
  agencyId: string,
  branding: Partial<AgencyBranding>
): Promise<AgencyRecord | null> {
  const db = getDb();
  const existing = await getAgencyById(agencyId);
  if (!existing) return null;

  const currentBranding = existing.branding ?? {
    brandName: existing.name,
    primaryColor: "#00C4C0",
    accentColor: "#00E5E0",
  };

  const updatedBranding: AgencyBranding = {
    ...currentBranding,
    ...branding,
  };

  const [updated] = await db
    .update(schema.agency)
    .set({
      branding: updatedBranding,
      updatedAt: new Date(),
    })
    .where(eq(schema.agency.id, agencyId))
    .returning();

  return updated ?? null;
}

/**
 * Lista todos los clientes (organizaciones) vinculados a una agencia.
 */
export async function listAgencyOrganizations(agencyId: string) {
  const db = getDb();
  return db
    .select({
      id: schema.organization.id,
      name: schema.organization.name,
      slug: schema.organization.slug,
      logo: schema.organization.logo,
      isAgencyClient: schema.organization.isAgencyClient,
      createdAt: schema.organization.createdAt,
    })
    .from(schema.organization)
    .where(eq(schema.organization.agencyId, agencyId));
}

/**
 * Vincula una organización de cliente a una agencia.
 */
export async function linkOrganizationToAgency(
  organizationId: string,
  agencyId: string
): Promise<void> {
  const db = getDb();
  await db
    .update(schema.organization)
    .set({
      agencyId,
      isAgencyClient: true,
    })
    .where(eq(schema.organization.id, organizationId));
}

/**
 * Añade un miembro a la agencia con un rol específico.
 */
export async function addAgencyMember(
  agencyId: string,
  userId: string,
  role: AgencyMemberRole = "agency_member"
): Promise<AgencyMemberRecord> {
  const db = getDb();
  const [created] = await db
    .insert(schema.agencyMember)
    .values({
      id: newId("agencyMember"),
      agencyId,
      userId,
      role,
    })
    .returning();
  return created!;
}

/**
 * Lista los miembros del equipo de una agencia.
 */
export async function listAgencyMembers(agencyId: string) {
  const db = getDb();
  return db
    .select({
      id: schema.agencyMember.id,
      role: schema.agencyMember.role,
      createdAt: schema.agencyMember.createdAt,
      user: {
        id: schema.user.id,
        name: schema.user.name,
        email: schema.user.email,
        image: schema.user.image,
      },
    })
    .from(schema.agencyMember)
    .innerJoin(schema.user, eq(schema.agencyMember.userId, schema.user.id))
    .where(eq(schema.agencyMember.agencyId, agencyId));
}
