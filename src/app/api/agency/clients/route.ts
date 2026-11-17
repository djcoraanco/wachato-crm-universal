import { z } from "zod";
import { apiError, parseBody, withAuth } from "@/lib/api";
import {
  createAgencyClientOrganization,
  getUserAgency,
  listAgencyOrganizations,
} from "@/server/agency/service";
import { getEffectivePlan } from "@/server/billing/service";
import { isSuperAdmin } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

/**
 * GET /api/agency/clients: Lista las subcuentas clientes de la agencia.
 */
export const GET = withAuth(async (session) => {
  const agency = await getUserAgency(session.userId);
  if (!agency && !isSuperAdmin(session.role)) {
    return apiError(403, "not_an_agency", "El usuario no pertenece a ninguna agencia");
  }

  const agencyId = agency?.id;
  if (!agencyId) {
    return Response.json({ ok: true, clients: [] });
  }

  const clients = await listAgencyOrganizations(agencyId);
  return Response.json({ ok: true, clients });
});

const createClientSchema = z.object({
  name: z.string().trim().min(2, "El nombre del cliente debe tener al menos 2 caracteres").max(100),
  slug: z.string().trim().min(2).max(50).regex(/^[a-z0-9-]+$/).optional(),
  customDomain: z.string().trim().max(100).optional(),
});

/**
 * POST /api/agency/clients: Crea una nueva subcuenta cliente para la agencia.
 */
export const POST = withAuth(async (session, req: Request) => {
  const agency = await getUserAgency(session.userId);
  if (!agency && !isSuperAdmin(session.role)) {
    return apiError(403, "not_an_agency", "Solo miembros de agencias pueden crear subcuentas cliente");
  }

  const agencyId = agency!.id;
  const { limits } = await getEffectivePlan(session.organizationId);

  // Validar si el plan permite marca blanca o subcuentas
  if (!limits.allowWhitelabel && !isSuperAdmin(session.role)) {
    return apiError(
      402,
      "whitelabel_required",
      "Tu plan actual no incluye subcuentas de clientes ilimitadas. Actualiza al Plan Agency Partner."
    );
  }

  const body = await parseBody(req, createClientSchema);
  if (!body.ok) return body.response;

  try {
    const created = await createAgencyClientOrganization({
      agencyId,
      name: body.data.name,
      slug: body.data.slug,
      ownerUserId: session.userId,
      customDomain: body.data.customDomain,
    });

    return Response.json({ ok: true, client: created });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear la subcuenta cliente";
    return apiError(400, "client_create_error", message);
  }
});
