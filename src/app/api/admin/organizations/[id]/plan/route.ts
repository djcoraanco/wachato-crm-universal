import { z } from "zod";
import { withAuth, parseBody, apiError } from "@/lib/api";
import { updateOrganizationPlanAdmin } from "@/server/admin/service";

export const dynamic = "force-dynamic";

const planChangeSchema = z.object({
  planSlug: z.string().trim().min(1),
  billingInterval: z.enum(["monthly", "yearly"]).optional().default("monthly"),
});

export const POST = withAuth(async (session, req: Request, context: unknown) => {
  if (session.role !== "owner" && session.role !== "admin" && session.role !== "superadmin") {
    return apiError(403, "forbidden", "Acceso restringido a administradores");
  }

  const { params } = context as { params: Promise<{ id: string }> };
  const { id: organizationId } = await params;

  if (!organizationId) {
    return apiError(400, "missing_org_id", "ID de organización requerido");
  }

  const parsed = await parseBody(req, planChangeSchema);
  if (!parsed.ok) return parsed.response;

  try {
    await updateOrganizationPlanAdmin({
      organizationId,
      planSlug: parsed.data.planSlug,
      billingInterval: parsed.data.billingInterval,
    });

    return Response.json({
      success: true,
      message: `Plan actualizado correctamente a ${parsed.data.planSlug}`,
    });
  } catch (err) {
    console.error("[admin-plan-change] Error actualizando plan:", err);
    return apiError(
      400,
      "plan_update_failed",
      err instanceof Error ? err.message : "Error al actualizar plan"
    );
  }
});
