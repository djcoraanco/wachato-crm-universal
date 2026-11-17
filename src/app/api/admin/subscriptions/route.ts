import { withAuth, apiError } from "@/lib/api";
import { getAdminRecentSubscriptions } from "@/server/admin/service";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (session) => {
  if (session.role !== "owner" && session.role !== "admin" && session.role !== "superadmin") {
    return apiError(403, "forbidden", "Acceso restringido a administradores");
  }

  try {
    const subscriptions = await getAdminRecentSubscriptions(50);
    return Response.json({ subscriptions });
  } catch (err) {
    console.error("[admin-subscriptions] Error listando suscripciones:", err);
    return apiError(500, "subscriptions_error", "Error consultando suscripciones");
  }
});
