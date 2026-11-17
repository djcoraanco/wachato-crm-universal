import { NextRequest } from "next/server";
import { withAuth, apiError } from "@/lib/api";
import { getAdminOrganizationsList } from "@/server/admin/service";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (session, req: NextRequest) => {
  if (session.role !== "owner" && session.role !== "admin" && session.role !== "superadmin") {
    return apiError(403, "forbidden", "Acceso restringido a administradores");
  }

  const url = new URL(req.url);
  const search = url.searchParams.get("search") ?? undefined;
  const limit = url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!, 10) : 50;
  const offset = url.searchParams.get("offset") ? parseInt(url.searchParams.get("offset")!, 10) : 0;

  try {
    const data = await getAdminOrganizationsList({ search, limit, offset });
    return Response.json(data);
  } catch (err) {
    console.error("[admin-organizations] Error listando organizaciones:", err);
    return apiError(500, "organizations_error", "Error listando organizaciones");
  }
});
