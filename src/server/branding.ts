import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import {
  DEFAULT_BRANDING,
  normalizeBranding,
  type Branding,
} from "@/lib/branding";

/** Marca guardada en organization.metadata (JSON de Better Auth). */

function parseMetadata(metadata: string | null): Record<string, unknown> {
  if (!metadata) return {};
  try {
    const parsed = JSON.parse(metadata) as unknown;
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

/**
 * Marca + a qué organización pertenece.
 *
 * El icono se guarda como archivo en `MEDIA_DIR/{organizationId}/favicon`, así
 * que servirlo necesita el id — y la ruta que lo sirve es pública (el login
 * también tiene pestaña), donde no hay sesión de la que sacarlo.
 */
export async function getBrandingContext(
  organizationId?: string | null
): Promise<{ organizationId: string | null; branding: Branding }> {
  const db = getDb();
  const rows = organizationId
    ? await db
        .select({
          id: schema.organization.id,
          metadata: schema.organization.metadata,
          agencyId: schema.organization.agencyId,
        })
        .from(schema.organization)
        .where(eq(schema.organization.id, organizationId))
        .limit(1)
    : // Sin sesión (login, layout raíz): la primera organización de la instancia.
      await db
        .select({
          id: schema.organization.id,
          metadata: schema.organization.metadata,
          agencyId: schema.organization.agencyId,
        })
        .from(schema.organization)
        .limit(1);
  if (!rows[0]) return { organizationId: null, branding: { ...DEFAULT_BRANDING, name: "CRM" } };

  const meta = parseMetadata(rows[0].metadata);
  const rawBranding = meta.branding as Partial<Branding> | undefined;
  const baseBranding = normalizeBranding(rawBranding ?? null);
  if (!rawBranding?.name || baseBranding.name === "Vocero") {
    baseBranding.name = "CRM";
  }

  // Si la organización pertenece a una agencia y no tiene nombre personalizado, heredar de la agencia
  if (rows[0].agencyId) {
    const agencyRows = await db
      .select({ branding: schema.agency.branding, name: schema.agency.name })
      .from(schema.agency)
      .where(eq(schema.agency.id, rows[0].agencyId))
      .limit(1);

    const agency = agencyRows[0];
    if (agency?.branding) {
      return {
        organizationId: rows[0].id,
        branding: {
          ...baseBranding,
          name: meta.branding ? baseBranding.name : (agency.branding.brandName || agency.name),
          accent: agency.branding.primaryColor || baseBranding.accent,
        },
      };
    }
  }

  return {
    organizationId: rows[0].id,
    branding: baseBranding,
  };
}

export async function getBranding(
  organizationId?: string | null
): Promise<Branding> {
  return (await getBrandingContext(organizationId)).branding;
}

export async function saveBranding(
  organizationId: string,
  branding: Branding
): Promise<void> {
  const db = getDb();
  const rows = await db
    .select({ metadata: schema.organization.metadata })
    .from(schema.organization)
    .where(eq(schema.organization.id, organizationId))
    .limit(1);
  const meta = parseMetadata(rows[0]?.metadata ?? null);
  meta.branding = normalizeBranding(branding);
  await db
    .update(schema.organization)
    .set({ metadata: JSON.stringify(meta) })
    .where(eq(schema.organization.id, organizationId));
}
