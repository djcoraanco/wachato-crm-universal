import { NextRequest, NextResponse } from "next/server";
import {
  verifyMetaOAuthState,
  exchangeMetaCode,
  discoverMetaResources,
  autoConnectMetaResources,
  type MetaConnectionSummary,
} from "@/server/meta/oauth";

export const dynamic = "force-dynamic";

function renderPopupHtml(opts: {
  success: boolean;
  message: string;
  summary?: MetaConnectionSummary;
  error?: string;
}): Response {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${opts.success ? "Conexión Exitosa" : "Error de Conexión"} - Meta</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #1e293b; border-radius: 12px; padding: 32px; max-width: 420px; text-align: center; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    h2 { margin-top: 0; color: ${opts.success ? "#22c55e" : "#ef4444"}; font-size: 20px; }
    p { color: #94a3b8; font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
    .spinner { border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #3b82f6; border-radius: 50%; width: 28px; height: 28px; animation: spin 1s linear infinite; margin: 0 auto; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <h2>${opts.success ? "✅ ¡Meta Conectado con Éxito!" : "❌ Error al Conectar con Meta"}</h2>
    <p>${opts.message}</p>
    <div class="spinner"></div>
  </div>
  <script>
    try {
      if (window.opener) {
        window.opener.postMessage({
          type: "${opts.success ? "META_CONNECT_SUCCESS" : "META_CONNECT_ERROR"}",
          summary: ${JSON.stringify(opts.summary ?? null)},
          error: ${JSON.stringify(opts.error ?? null)}
        }, window.location.origin);
      }
    } catch (e) {
      console.error(e);
    }
    setTimeout(function() {
      window.close();
    }, 1500);
  </script>
</body>
</html>`;

  return new Response(html, {
    status: opts.success ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateStr = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");
  const errorDesc = url.searchParams.get("error_description");

  // Verificar state
  const state = stateStr ? verifyMetaOAuthState(stateStr) : null;
  const isPopup = state?.popup ?? false;
  const returnTo = state?.returnTo ?? "/settings/whatsapp";

  if (errorParam || !code) {
    const errorMsg = errorDesc || errorParam || "Autorización cancelada o denegada por el usuario en Meta.";
    if (isPopup) {
      return renderPopupHtml({
        success: false,
        message: errorMsg,
        error: errorMsg,
      });
    }
    const redirectUrl = new URL(returnTo, url.origin);
    redirectUrl.searchParams.set("meta_error", errorMsg);
    return NextResponse.redirect(redirectUrl);
  }

  if (!state) {
    const errorMsg = "La sesión de autorización de Meta expiró o es inválida.";
    if (isPopup) {
      return renderPopupHtml({
        success: false,
        message: errorMsg,
        error: "invalid_state",
      });
    }
    const redirectUrl = new URL(returnTo, url.origin);
    redirectUrl.searchParams.set("meta_error", "invalid_state");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    // 1. Intercambiar código por token de usuario de larga duración
    const { userToken } = await exchangeMetaCode(code);

    // 2. Descubrir recursos vinculados (WhatsApp, Instagram, Páginas de Facebook)
    const resources = await discoverMetaResources(userToken);

    // 3. Conectar en 1 clic los recursos encontrados
    const summary = await autoConnectMetaResources({
      organizationId: state.organizationId,
      userToken,
      wabas: resources.wabas,
      pages: resources.pages,
      channelFilter: state.channelFilter,
    });

    if (isPopup) {
      return renderPopupHtml({
        success: true,
        message: "Tus canales seleccionados han sido vinculados correctamente a tu CRM.",
        summary,
      });
    }

    const redirectUrl = new URL(returnTo, url.origin);
    redirectUrl.searchParams.set("meta_connected", "true");
    if (summary.whatsapp?.connected) redirectUrl.searchParams.set("wa_connected", "1");
    if (summary.instagram?.connected) redirectUrl.searchParams.set("ig_connected", "1");
    if (summary.messenger?.connected) redirectUrl.searchParams.set("fb_connected", "1");

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("[meta-oauth-callback] Error procesando autorización:", err);
    const errorMsg = err instanceof Error ? err.message : "Error inesperado al conectar los canales de Meta.";

    if (isPopup) {
      return renderPopupHtml({
        success: false,
        message: errorMsg,
        error: errorMsg,
      });
    }

    const redirectUrl = new URL(returnTo, url.origin);
    redirectUrl.searchParams.set("meta_error", errorMsg);
    return NextResponse.redirect(redirectUrl);
  }
}
