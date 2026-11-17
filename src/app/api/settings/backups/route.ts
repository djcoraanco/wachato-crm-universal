import { apiError, withAuth } from "@/lib/api";
import { assertPermission } from "@/lib/auth/rbac";
import { createOrganizationBackup } from "@/server/backups/backup-service";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (session) => {
  try {
    assertPermission(session.role, "backups:download");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Permiso denegado";
    return apiError(403, "forbidden", msg);
  }

  const { filename, buffer, summary } = await createOrganizationBackup(
    session.organizationId
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/gzip",
      "content-disposition": `attachment; filename="${filename}"`,
      "x-backup-counts": JSON.stringify(summary.counts),
    },
  });
});

export const POST = withAuth(async (session) => {
  try {
    assertPermission(session.role, "backups:create");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Permiso denegado";
    return apiError(403, "forbidden", msg);
  }

  const { filename, summary } = await createOrganizationBackup(
    session.organizationId
  );

  return Response.json({
    ok: true,
    filename,
    summary,
    downloadUrl: "/api/settings/backups",
  });
});
