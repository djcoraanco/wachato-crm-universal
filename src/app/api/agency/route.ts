import { z } from "zod";
import { apiError, parseBody, withAuth } from "@/lib/api";
import {
  createAgency,
  getAgencyById,
  getUserAgency,
  listAgencyMembers,
  listAgencyOrganizations,
  updateAgencyBranding,
} from "@/server/agency/service";
import { getEffectivePlan } from "@/server/billing/service";
import { isSuperAdmin } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

/**
 * GET /api/agency: Devuelve la agencia a la que pertenece el usuario con sus clientes y branding.
 */
export const GET = withAuth(async (session) => {
  const userAgency = await getUserAgency(session.userId);
  if (!userAgency) {
    // Si no tiene agencia propia, verificar si su plan actual le permite crear una
    const { limits, plan } = await getEffectivePlan(session.organizationId);
    return Response.json({
      ok: true,
      agency: null,
      canCreateAgency: limits.allowWhitelabel || isSuperAdmin(session.role),
      plan: plan?.slug ?? "starter",
    });
  }

  const [clients, members] = await Promise.all([
    listAgencyOrganizations(userAgency.id),
    listAgencyMembers(userAgency.id),
  ]);

  return Response.json({
    ok: true,
    agency: userAgency,
    clients,
    members,
    canCreateAgency: false,
  });
});

const createAgencySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(50).regex(/^[a-z0-9-]+$/, "Slug en minúsculas y guiones"),
  subdomain: z.string().trim().min(2).max(50).regex(/^[a-z0-9-]+$/).optional(),
  customDomain: z.string().trim().max(100).optional(),
});

/**
 * POST /api/agency: Crea la agencia para el usuario si su plan lo permite.
 */
export const POST = withAuth(async (session, req: Request) => {
  const { limits } = await getEffectivePlan(session.organizationId);
  const allowed = limits.allowWhitelabel || isSuperAdmin(session.role);

  if (!allowed) {
    return apiError(
      402,
      "whitelabel_required",
      "La creación de agencia y marca blanca requiere el Plan Agency Partner. Actualiza tu plan en Ajustes → Facturación."
    );
  }

  const body = await parseBody(req, createAgencySchema);
  if (!body.ok) return body.response;

  try {
    const agency = await createAgency({
      name: body.data.name,
      slug: body.data.slug,
      ownerUserId: session.userId,
      subdomain: body.data.subdomain,
      customDomain: body.data.customDomain,
      branding: {
        brandName: body.data.name,
        primaryColor: "#00C4C0",
        accentColor: "#00E5E0",
      },
    });

    return Response.json({ ok: true, agency });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear la agencia";
    return apiError(400, "agency_create_error", message);
  }
});

const updateBrandingSchema = z.object({
  agencyId: z.string().min(1),
  brandName: z.string().trim().min(1).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  faviconUrl: z.string().url().optional().or(z.literal("")),
  customDomain: z.string().trim().optional(),
});

/**
 * PUT /api/agency: Actualiza la marca blanca y dominio de la agencia.
 */
export const PUT = withAuth(async (session, req: Request) => {
  const body = await parseBody(req, updateBrandingSchema);
  if (!body.ok) return body.response;

  const agency = await getAgencyById(body.data.agencyId);
  if (!agency) {
    return apiError(404, "not_found", "Agencia no encontrada");
  }

  // Verificar que el usuario sea el dueño o miembro con permisos
  const userAgency = await getUserAgency(session.userId);
  if (userAgency?.id !== agency.id && !isSuperAdmin(session.role)) {
    return apiError(403, "forbidden", "No tienes permisos para modificar esta agencia");
  }

  const updated = await updateAgencyBranding(agency.id, {
    brandName: body.data.brandName ?? agency.branding?.brandName ?? agency.name,
    primaryColor: body.data.primaryColor ?? agency.branding?.primaryColor ?? "#00C4C0",
    accentColor: body.data.accentColor ?? agency.branding?.accentColor ?? "#00E5E0",
    logoUrl: body.data.logoUrl ?? agency.branding?.logoUrl,
    faviconUrl: body.data.faviconUrl ?? agency.branding?.faviconUrl,
  });

  return Response.json({ ok: true, agency: updated });
});
