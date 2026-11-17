import { z } from "zod";
import { apiError, parseBody, withAuth } from "@/lib/api";
import { resolveMembership } from "@/server/auth/on-signup";

export const dynamic = "force-dynamic";

const switchSchema = z.object({
  organizationId: z.string().min(1, "El ID de la organización es requerido"),
});

/**
 * POST /api/agency/switch: Cambia la organización activa para el usuario.
 * Establece la cookie 'active_org_id'.
 */
export const POST = withAuth(async (session, req: Request) => {
  const body = await parseBody(req, switchSchema);
  if (!body.ok) return body.response;

  const targetOrgId = body.data.organizationId;

  // Validar si el usuario tiene permiso sobre esta organización
  const membership = await resolveMembership(session.userId, targetOrgId);
  if (!membership || membership.organizationId !== targetOrgId) {
    return apiError(403, "forbidden", "No tienes acceso a esta subcuenta");
  }

  const response = Response.json({
    ok: true,
    activeOrganizationId: targetOrgId,
    role: membership.role,
  });

  // Establecer cookie con 30 días de vigencia
  response.headers.set(
    "Set-Cookie",
    `active_org_id=${targetOrgId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`
  );

  return response;
});
