import { apiError, withAuth } from "@/lib/api";
import { getOrganizationQuotaSummary } from "@/server/billing/gating";

export const dynamic = "force-dynamic";

/**
 * GET /api/billing/usage: Devuelve las métricas de uso y límites actuales de la organización.
 */
export const GET = withAuth(async (session) => {
  try {
    const summary = await getOrganizationQuotaSummary(session.organizationId);
    return Response.json({ ok: true, summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al obtener las cuotas de uso";
    return apiError(500, "internal_error", message);
  }
});
