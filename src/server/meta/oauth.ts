import crypto from "node:crypto";
import { getEnv } from "@/lib/env";
import { graphRequest } from "@/lib/meta/client";
import { saveCredentials } from "@/server/whatsapp/credentials";
import { registerWebhookForNumber } from "@/server/whatsapp/connect";
import { webhookUrl, webhookVerifyToken } from "@/server/whatsapp/webhook-url";
import { saveInstagramCredentials } from "@/server/instagram/credentials";
import { saveMessengerCredentials } from "@/server/messenger/credentials";
import { assertCanAddChannel } from "@/server/billing/gating";

export type MetaOAuthState = {
  organizationId: string;
  userId: string;
  returnTo?: string;
  popup?: boolean;
  channelFilter?: "all" | "whatsapp" | "instagram" | "messenger";
  timestamp: number;
};

export type MetaPhoneNumber = {
  id: string;
  displayPhoneNumber: string;
  verifiedName: string | null;
};

export type MetaWaba = {
  id: string;
  name?: string;
  phoneNumbers: MetaPhoneNumber[];
};

export type MetaPage = {
  id: string;
  name: string;
  accessToken: string;
  instagram?: {
    id: string;
    username?: string;
  };
};

export type MetaDiscoveredResources = {
  wabas: MetaWaba[];
  pages: MetaPage[];
};

export type MetaConnectionSummary = {
  whatsapp?: {
    connected: boolean;
    phoneNumberId?: string;
    displayPhoneNumber?: string;
    error?: string;
  };
  messenger?: {
    connected: boolean;
    pageId?: string;
    pageName?: string;
    error?: string;
  };
  instagram?: {
    connected: boolean;
    igUserId?: string;
    username?: string;
    error?: string;
  };
};

/**
 * Comprueba si la plataforma tiene configuradas las credenciales de la app de Meta
 * para habilitar la conexión en 1 clic (OAuth / Embedded Signup).
 */
export function isMetaAppConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.META_APP_ID && env.META_APP_ID.trim().length > 0);
}

/**
 * Obtiene la URL de redirección canónica registrada en Meta App Settings.
 */
export function getMetaRedirectUri(): string {
  const base = getEnv().APP_BASE_URL.replace(/\/$/, "");
  return `${base}/api/channels/meta/callback`;
}

/**
 * Firma un estado OAuth para evitar CSRF y manipulación de parámetros.
 */
export function signMetaOAuthState(payload: Omit<MetaOAuthState, "timestamp">): string {
  const env = getEnv();
  const fullPayload: MetaOAuthState = {
    ...payload,
    timestamp: Date.now(),
  };
  const jsonStr = JSON.stringify(fullPayload);
  const base64Data = Buffer.from(jsonStr).toString("base64url");
  const hmac = crypto
    .createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(base64Data)
    .digest("base64url");

  return `${base64Data}.${hmac}`;
}

/**
 * Valida la firma y vigencia del parámetro state de Meta (expira en 20 minutos).
 */
export function verifyMetaOAuthState(stateStr: string): MetaOAuthState | null {
  const env = getEnv();
  const parts = stateStr.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

  const [base64Data, providedHmac] = parts;
  const expectedHmac = crypto
    .createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(base64Data)
    .digest("base64url");

  if (!crypto.timingSafeEqual(Buffer.from(providedHmac), Buffer.from(expectedHmac))) {
    return null;
  }

  try {
    const raw = Buffer.from(base64Data, "base64url").toString("utf-8");
    const payload = JSON.parse(raw) as MetaOAuthState;
    // Expiración a los 20 minutos
    if (Date.now() - payload.timestamp > 20 * 60 * 1000) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Genera la URL para iniciar el flujo de autorización OAuth con Meta.
 */
export function getMetaOAuthDialogUrl(opts: {
  state: string;
  channelFilter?: "all" | "whatsapp" | "instagram" | "messenger";
}): string {
  const env = getEnv();
  const appId = env.META_APP_ID;
  if (!appId) {
    throw new Error("META_APP_ID no está configurado en las variables de entorno");
  }

  const redirectUri = encodeURIComponent(getMetaRedirectUri());
  const filter = opts.channelFilter ?? "all";

  let scopes: string[] = [];
  if (filter === "whatsapp") {
    scopes = ["whatsapp_business_management", "whatsapp_business_messaging"];
  } else if (filter === "instagram") {
    scopes = ["instagram_basic", "instagram_manage_messages", "pages_show_list"];
  } else if (filter === "messenger") {
    scopes = ["pages_show_list", "pages_messaging", "pages_read_engagement", "pages_manage_metadata"];
  } else {
    // Todos los canales unificados
    scopes = [
      "whatsapp_business_management",
      "whatsapp_business_messaging",
      "pages_show_list",
      "pages_messaging",
      "pages_read_engagement",
      "pages_manage_metadata",
      "instagram_basic",
      "instagram_manage_messages",
    ];
  }

  const scopeParam = encodeURIComponent(scopes.join(","));
  let url = `https://www.facebook.com/${env.META_GRAPH_API_VERSION}/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&state=${encodeURIComponent(opts.state)}&scope=${scopeParam}&response_type=code`;

  if (env.META_CONFIG_ID) {
    url += `&config_id=${encodeURIComponent(env.META_CONFIG_ID)}`;
  }

  if (filter === "whatsapp") {
    // Configuración para el diálogo de WhatsApp Embedded Signup
    url += `&extras=${encodeURIComponent(JSON.stringify({ setup: { channel: "WHATSAPP" } }))}`;
  }

  return url;
}

/**
 * Intercambia el código de autorización temporal por un token de usuario de larga duración.
 */
export async function exchangeMetaCode(
  code: string,
  customRedirectUri?: string
): Promise<{ userToken: string; expiresIn?: number }> {
  const env = getEnv();
  const appId = env.META_APP_ID;
  const appSecret = env.META_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error("META_APP_ID y META_APP_SECRET son obligatorios para intercambiar el código");
  }

  const redirectUri = customRedirectUri ?? getMetaRedirectUri();

  // 1. Obtener access token inicial
  const tokenRes = await graphRequest<{
    access_token: string;
    token_type: string;
    expires_in?: number;
  }>(
    `oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&code=${encodeURIComponent(code)}`,
    { method: "GET" }
  );

  const shortLivedToken = tokenRes.access_token;
  if (!shortLivedToken) {
    throw new Error("Meta no devolvió un access token válido al canjear el código");
  }

  // 2. Intercambiar por Long-Lived Token (60 días)
  try {
    const longLivedRes = await graphRequest<{
      access_token: string;
      token_type: string;
      expires_in?: number;
    }>(
      `oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${encodeURIComponent(
        shortLivedToken
      )}`,
      { method: "GET" }
    );

    return {
      userToken: longLivedRes.access_token || shortLivedToken,
      expiresIn: longLivedRes.expires_in ?? tokenRes.expires_in,
    };
  } catch (err) {
    console.warn("[meta-oauth] Advertencia: no se pudo obtener token de larga duración, usando token corto", err);
    return {
      userToken: shortLivedToken,
      expiresIn: tokenRes.expires_in,
    };
  }
}

/**
 * Descubre cuentas de WhatsApp (WABAs y teléfonos), Páginas de Facebook e Instagram vinculados
 * accesibles con el token de usuario de Meta.
 */
export async function discoverMetaResources(userToken: string): Promise<MetaDiscoveredResources> {
  const env = getEnv();
  const wabasMap = new Map<string, MetaWaba>();
  const pages: MetaPage[] = [];

  // 1. Descubrir Facebook Pages y cuentas de Instagram vinculadas
  try {
    const pagesRes = await graphRequest<{
      data?: Array<{
        id: string;
        name: string;
        access_token: string;
        instagram_business_account?: { id: string; username?: string };
      }>;
    }>("me/accounts?fields=id,name,access_token,instagram_business_account{id,username}", {
      token: userToken,
    });

    if (pagesRes?.data && Array.isArray(pagesRes.data)) {
      for (const p of pagesRes.data) {
        pages.push({
          id: p.id,
          name: p.name,
          accessToken: p.access_token,
          instagram: p.instagram_business_account
            ? {
                id: p.instagram_business_account.id,
                username: p.instagram_business_account.username,
              }
            : undefined,
        });
      }
    }
  } catch (err) {
    console.warn("[meta-oauth] No se pudieron consultar las páginas de Facebook:", err);
  }

  // 2. Descubrir WhatsApp Business Accounts (WABA)
  // Intento A: Debug token para granular scopes (WhatsApp Embedded Signup)
  if (env.META_APP_ID && env.META_APP_SECRET) {
    try {
      const debugRes = await graphRequest<{
        data?: {
          granular_scopes?: Array<{
            scope: string;
            target_ids?: string[];
          }>;
        };
      }>(
        `debug_token?input_token=${encodeURIComponent(userToken)}&access_token=${encodeURIComponent(
          `${env.META_APP_ID}|${env.META_APP_SECRET}`
        )}`,
        { method: "GET" }
      );

      const granular = debugRes?.data?.granular_scopes ?? [];
      const waScope = granular.find((g) => g.scope.includes("whatsapp_business"));
      if (waScope?.target_ids) {
        for (const wabaId of waScope.target_ids) {
          if (!wabasMap.has(wabaId)) {
            wabasMap.set(wabaId, { id: wabaId, phoneNumbers: [] });
          }
        }
      }
    } catch (err) {
      console.warn("[meta-oauth] debug_token para WABAs omitido:", err);
    }
  }

  // Intento B: me?fields=whatsapp_business_accounts
  try {
    const waRes = await graphRequest<{
      whatsapp_business_accounts?: {
        data?: Array<{
          id: string;
          name?: string;
          phone_numbers?: {
            data?: Array<{
              id: string;
              display_phone_number?: string;
              verified_name?: string;
            }>;
          };
        }>;
      };
    }>("me?fields=whatsapp_business_accounts{id,name,phone_numbers{id,display_phone_number,verified_name}}", {
      token: userToken,
    });

    const accounts = waRes?.whatsapp_business_accounts?.data ?? [];
    for (const acc of accounts) {
      const phoneList: MetaPhoneNumber[] = [];
      const rawPhones = acc.phone_numbers?.data ?? [];
      for (const ph of rawPhones) {
        if (ph.id && ph.display_phone_number) {
          phoneList.push({
            id: ph.id,
            displayPhoneNumber: ph.display_phone_number,
            verifiedName: ph.verified_name ?? null,
          });
        }
      }

      wabasMap.set(acc.id, {
        id: acc.id,
        name: acc.name,
        phoneNumbers: phoneList,
      });
    }
  } catch (err) {
    console.warn("[meta-oauth] me?fields=whatsapp_business_accounts omitido:", err);
  }

  // 3. Completar números para WABAs encontradas que aún no tengan lista de teléfonos
  for (const [wabaId, waba] of wabasMap.entries()) {
    if (waba.phoneNumbers.length === 0) {
      try {
        const phRes = await graphRequest<{
          data?: Array<{
            id: string;
            display_phone_number?: string;
            verified_name?: string;
          }>;
        }>(`${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name`, {
          token: userToken,
        });

        if (phRes?.data) {
          waba.phoneNumbers = phRes.data
            .filter((p) => Boolean(p.id && p.display_phone_number))
            .map((p) => ({
              id: p.id,
              displayPhoneNumber: p.display_phone_number!,
              verifiedName: p.verified_name ?? null,
            }));
        }
      } catch (err) {
        console.warn(`[meta-oauth] No se pudieron leer números para WABA ${wabaId}:`, err);
      }
    }
  }

  return {
    wabas: Array.from(wabasMap.values()),
    pages,
  };
}

/**
 * Conecta automáticamente los recursos de Meta (WhatsApp, Instagram, Messenger)
 * a la organización del usuario en 1 clic.
 */
export async function autoConnectMetaResources(opts: {
  organizationId: string;
  userToken: string;
  wabas?: MetaWaba[];
  pages?: MetaPage[];
  selectedWabaId?: string;
  selectedPhoneNumberId?: string;
  selectedPageId?: string;
  selectedIgUserId?: string;
  channelFilter?: "all" | "whatsapp" | "instagram" | "messenger";
}): Promise<MetaConnectionSummary> {
  const summary: MetaConnectionSummary = {};
  const filter = opts.channelFilter ?? "all";

  // 1. Conexión de WhatsApp
  if (filter === "all" || filter === "whatsapp") {
    try {
      const wabas = opts.wabas ?? [];
      let targetWaba: MetaWaba | undefined;
      let targetPhone: MetaPhoneNumber | undefined;

      if (opts.selectedPhoneNumberId) {
        for (const w of wabas) {
          const found = w.phoneNumbers.find((p) => p.id === opts.selectedPhoneNumberId);
          if (found) {
            targetWaba = w;
            targetPhone = found;
            break;
          }
        }
      }

      if (!targetPhone && wabas.length > 0) {
        targetWaba = wabas.find((w) => w.phoneNumbers.length > 0) ?? wabas[0];
        targetPhone = targetWaba?.phoneNumbers[0];
      }

      if (targetWaba && targetPhone) {
        // Suscribir la WABA al webhook de la aplicación
        try {
          await registerWebhookForNumber({
            wabaId: targetWaba.id,
            phoneNumberId: targetPhone.id,
            token: opts.userToken,
            webhookUrl: webhookUrl("wa"),
            verifyToken: webhookVerifyToken(),
            forzar: true,
          });
        } catch (subErr) {
          console.warn("[meta-oauth] Advertencia al registrar webhook de WhatsApp:", subErr);
        }

        // Guardar credenciales cifradas
        await saveCredentials({
          organizationId: opts.organizationId,
          wabaId: targetWaba.id,
          phoneNumberId: targetPhone.id,
          token: opts.userToken,
          displayPhoneNumber: targetPhone.displayPhoneNumber,
          verifiedName: targetPhone.verifiedName,
        });

        summary.whatsapp = {
          connected: true,
          phoneNumberId: targetPhone.id,
          displayPhoneNumber: targetPhone.displayPhoneNumber,
        };
      }
    } catch (err) {
      console.error("[meta-oauth] Error conectando WhatsApp:", err);
      summary.whatsapp = {
        connected: false,
        error: err instanceof Error ? err.message : "Error desconocido al conectar WhatsApp",
      };
    }
  }

  // 2. Conexión de Facebook Messenger
  if (filter === "all" || filter === "messenger") {
    try {
      // Verificar cuota / gating del plan para canales
      await assertCanAddChannel(opts.organizationId, "messenger");

      const pages = opts.pages ?? [];
      const targetPage = opts.selectedPageId
        ? pages.find((p) => p.id === opts.selectedPageId)
        : pages[0];

      if (targetPage) {
        // Suscribir la página al webhook de Messenger
        try {
          await graphRequest(`${targetPage.id}/subscribed_apps?subscribed_fields=messages,messaging_postbacks`, {
            method: "POST",
            token: targetPage.accessToken,
          });
        } catch (subErr) {
          console.warn(`[meta-oauth] Advertencia suscribiendo página ${targetPage.id} a Messenger:`, subErr);
        }

        // Guardar credenciales cifradas
        await saveMessengerCredentials({
          organizationId: opts.organizationId,
          source: "meta",
          pageId: targetPage.id,
          pageName: targetPage.name,
          accountRef: null,
          token: targetPage.accessToken,
          webhookSecret: null,
        });

        summary.messenger = {
          connected: true,
          pageId: targetPage.id,
          pageName: targetPage.name,
        };
      }
    } catch (err) {
      console.warn("[meta-oauth] Messenger no conectado:", err);
      summary.messenger = {
        connected: false,
        error: err instanceof Error ? err.message : "Plan no permite canal Messenger o error al conectar",
      };
    }
  }

  // 3. Conexión de Instagram
  if (filter === "all" || filter === "instagram") {
    try {
      // Verificar cuota / gating del plan para canales
      await assertCanAddChannel(opts.organizationId, "instagram");

      const pages = opts.pages ?? [];
      let targetPage: MetaPage | undefined;
      const targetIg = opts.selectedIgUserId;

      if (targetIg) {
        targetPage = pages.find((p) => p.instagram?.id === targetIg);
      } else {
        targetPage = pages.find((p) => Boolean(p.instagram?.id));
      }

      if (targetPage && targetPage.instagram) {
        // Suscribir la página a eventos de Instagram
        try {
          await graphRequest(
            `${targetPage.id}/subscribed_apps?subscribed_fields=messages,messaging_postbacks,messaging_seen`,
            {
              method: "POST",
              token: targetPage.accessToken,
            }
          );
        } catch (subErr) {
          console.warn(`[meta-oauth] Advertencia suscribiendo IG en página ${targetPage.id}:`, subErr);
        }

        // Guardar credenciales de Instagram cifradas
        await saveInstagramCredentials({
          organizationId: opts.organizationId,
          source: "meta",
          igUserId: targetPage.instagram.id,
          accountRef: null,
          username: targetPage.instagram.username ?? null,
          token: targetPage.accessToken,
          webhookSecret: null,
        });

        summary.instagram = {
          connected: true,
          igUserId: targetPage.instagram.id,
          username: targetPage.instagram.username,
        };
      }
    } catch (err) {
      console.warn("[meta-oauth] Instagram no conectado:", err);
      summary.instagram = {
        connected: false,
        error: err instanceof Error ? err.message : "Plan no permite canal Instagram o error al conectar",
      };
    }
  }

  return summary;
}
