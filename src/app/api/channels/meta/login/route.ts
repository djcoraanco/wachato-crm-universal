import { NextRequest } from "next/server";
import { withAuth, apiError } from "@/lib/api";
import {
  isMetaAppConfigured,
  signMetaOAuthState,
  getMetaOAuthDialogUrl,
} from "@/server/meta/oauth";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (session, req: NextRequest) => {
  if (!isMetaAppConfigured()) {
    return apiError(
      400,
      "meta_app_not_configured",
      "La aplicación de Meta (META_APP_ID) no está configurada en el servidor"
    );
  }

  const url = new URL(req.url);
  const returnTo = url.searchParams.get("returnTo") ?? "/settings/whatsapp";
  const popup = url.searchParams.get("popup") === "true";
  const channelFilter = (url.searchParams.get("channelFilter") ?? "all") as
    | "all"
    | "whatsapp"
    | "instagram"
    | "messenger";
  const format = url.searchParams.get("format");

  const state = signMetaOAuthState({
    organizationId: session.organizationId,
    userId: session.userId,
    returnTo,
    popup,
    channelFilter,
  });

  const oauthUrl = getMetaOAuthDialogUrl({ state, channelFilter });

  if (format === "json") {
    return Response.json({ url: oauthUrl });
  }

  return Response.redirect(oauthUrl);
});
