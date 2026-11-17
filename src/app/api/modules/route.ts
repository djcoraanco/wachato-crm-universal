import { z } from "zod";
import { apiError, parseBody, withAuth } from "@/lib/api";
import { getInstalledModules, toggleModuleInstallation } from "@/lib/modules/registry";
import { assertModuleAllowed, FeatureNotAllowedError } from "@/server/billing/gating";
import { getEffectivePlan } from "@/server/billing/service";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  moduleId: z.string().min(1),
  status: z.enum(["active", "disabled"]),
});

export const GET = withAuth(async (session) => {
  const modules = await getInstalledModules(session.organizationId);
  const { limits, plan } = await getEffectivePlan(session.organizationId);

  const enriched = modules.map((m) => {
    const isIncluded =
      limits.includedModules.includes(m.category) ||
      limits.includedModules.includes(m.id) ||
      limits.includedModules.includes("all");
    return {
      ...m,
      isAllowedByPlan: isIncluded,
      requiredTier: isIncluded ? plan?.tier ?? "starter" : "pro",
    };
  });

  return Response.json({ modules: enriched });
});

export const PATCH = withAuth(async (session, req: Request) => {
  const body = await parseBody(req, patchSchema);
  if (!body.ok) return body.response;

  // Si se desea activar un módulo, validar que el plan lo incluya
  if (body.data.status === "active") {
    try {
      await assertModuleAllowed(session.organizationId, body.data.moduleId);
    } catch (err) {
      if (err instanceof FeatureNotAllowedError) {
        return apiError(402, "plan_upgrade_required", err.message);
      }
      throw err;
    }
  }

  try {
    const updated = await toggleModuleInstallation(
      session.organizationId,
      body.data.moduleId,
      body.data.status
    );
    return Response.json({ ok: true, module: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return apiError(400, "module_error", message);
  }
});
