import { withAuth, apiError } from "@/lib/api";
import { getSaaSSummaryMetrics } from "@/server/admin/service";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (session) => {
  // Solo administradores de la plataforma o dueños
  if (session.role !== "owner" && session.role !== "admin" && session.role !== "superadmin") {
    return apiError(403, "forbidden", "Acceso restringido a administradores");
  }

  try {
    const metrics = await getSaaSSummaryMetrics();
    return Response.json({ metrics });
  } catch (err) {
    console.error("[admin-metrics] Error obteniendo métricas:", err);
    return apiError(500, "metrics_error", "Error calculando métricas del SaaS");
  }
});
