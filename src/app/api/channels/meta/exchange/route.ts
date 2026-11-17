import { z } from "zod";
import { withAuth, parseBody, apiError } from "@/lib/api";
import {
  exchangeMetaCode,
  discoverMetaResources,
  autoConnectMetaResources,
} from "@/server/meta/oauth";

export const dynamic = "force-dynamic";

const exchangeSchema = z.object({
  code: z.string().trim().min(1),
  channelFilter: z.enum(["all", "whatsapp", "instagram", "messenger"]).optional().default("all"),
  redirectUri: z.string().url().optional(),
});

export const POST = withAuth(async (session, req: Request) => {
  const parsed = await parseBody(req, exchangeSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const { userToken } = await exchangeMetaCode(parsed.data.code, parsed.data.redirectUri);
    const resources = await discoverMetaResources(userToken);

    const summary = await autoConnectMetaResources({
      organizationId: session.organizationId,
      userToken,
      wabas: resources.wabas,
      pages: resources.pages,
      channelFilter: parsed.data.channelFilter,
    });

    return Response.json({
      success: true,
      summary,
    });
  } catch (err) {
    console.error("[meta-exchange] Error intercambiando código:", err);
    return apiError(
      400,
      "meta_connect_failed",
      err instanceof Error ? err.message : "Error al conectar con Meta"
    );
  }
});
