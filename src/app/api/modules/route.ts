import { z } from "zod";
import { apiError, parseBody, withAuth } from "@/lib/api";
import { getInstalledModules, toggleModuleInstallation } from "@/lib/modules/registry";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  moduleId: z.string().min(1),
  status: z.enum(["active", "disabled"]),
});

export const GET = withAuth(async (session) => {
  const modules = await getInstalledModules(session.organizationId);
  return Response.json({ modules });
});

export const PATCH = withAuth(async (session, req: Request) => {
  const body = await parseBody(req, patchSchema);
  if (!body.ok) return body.response;

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
