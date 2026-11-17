import { describe, expect, it, vi, beforeAll, beforeEach } from "vitest";

// Mocks para servicios dependientes de base de datos y Graph API
vi.mock("@/server/whatsapp/credentials", () => ({
  saveCredentials: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/server/whatsapp/connect", () => ({
  registerWebhookForNumber: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/server/messenger/credentials", () => ({
  saveMessengerCredentials: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/server/instagram/credentials", () => ({
  saveInstagramCredentials: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/server/billing/gating", () => ({
  assertCanAddChannel: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/meta/client", () => ({
  graphRequest: vi.fn().mockResolvedValue({ success: true }),
}));

import {
  signMetaOAuthState,
  verifyMetaOAuthState,
  getMetaOAuthDialogUrl,
  isMetaAppConfigured,
  getMetaRedirectUri,
  autoConnectMetaResources,
} from "@/server/meta/oauth";

describe("SaaS Fase 6 - Meta 1-Click Connect & Embedded Signup", () => {
  beforeAll(() => {
    process.env.APP_BASE_URL = "https://crm.ejemplo.com";
    process.env.DATABASE_URL = "postgresql://t:t@localhost:5432/t";
    process.env.BETTER_AUTH_SECRET = "super-secret-key-16-bytes-min";
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
    process.env.META_APP_ID = "123456789012345";
    process.env.META_APP_SECRET = "abcde12345secret";
    process.env.META_WEBHOOK_VERIFY_TOKEN = "verify-token-secure-32";
    process.env.META_GRAPH_API_VERSION = "v25.0";
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Estado seguro OAuth (CSRF & Tamper protection)", () => {
    it("firma y verifica un estado válido correctamente", () => {
      const state = signMetaOAuthState({
        organizationId: "org_test_123",
        userId: "usr_admin_456",
        returnTo: "/settings/whatsapp",
        popup: true,
        channelFilter: "all",
      });

      expect(typeof state).toBe("string");
      expect(state).toContain(".");

      const verified = verifyMetaOAuthState(state);
      expect(verified).not.toBeNull();
      expect(verified?.organizationId).toBe("org_test_123");
      expect(verified?.userId).toBe("usr_admin_456");
      expect(verified?.popup).toBe(true);
      expect(verified?.channelFilter).toBe("all");
    });

    it("rechaza un estado alterado (tampering)", () => {
      const state = signMetaOAuthState({
        organizationId: "org_test_123",
        userId: "usr_admin_456",
      });

      const parts = state.split(".");
      const tampered = `eyJyYW5kb20iOiJ0cnVlIn0.${parts[1]}`;
      expect(verifyMetaOAuthState(tampered)).toBeNull();
    });

    it("rechaza un estado expirado (> 20 minutos)", () => {
      const state = signMetaOAuthState({
        organizationId: "org_test_123",
        userId: "usr_admin_456",
      });

      vi.useFakeTimers();
      vi.advanceTimersByTime(25 * 60 * 1000);

      expect(verifyMetaOAuthState(state)).toBeNull();
      vi.useRealTimers();
    });
  });

  describe("Generación de URLs de diálogo y configuración", () => {
    it("detecta si la app de Meta está configurada", () => {
      expect(isMetaAppConfigured()).toBe(true);
    });

    it("construye la URL de callback canónica", () => {
      expect(getMetaRedirectUri()).toBe("https://crm.ejemplo.com/api/channels/meta/callback");
    });

    it("construye el diálogo unificado con todos los permisos (WhatsApp + Facebook + Instagram)", () => {
      const state = "test_state_123.sig";
      const url = getMetaOAuthDialogUrl({ state, channelFilter: "all" });

      expect(url).toContain("https://www.facebook.com/v25.0/dialog/oauth");
      expect(url).toContain("client_id=123456789012345");
      expect(url).toContain("redirect_uri=https%3A%2F%2Fcrm.ejemplo.com%2Fapi%2Fchannels%2Fmeta%2Fcallback");
      expect(url).toContain("whatsapp_business_management");
      expect(url).toContain("pages_messaging");
      expect(url).toContain("instagram_manage_messages");
    });

    it("agrega el parámetro extras para WhatsApp Embedded Signup", () => {
      const state = "wa_state_456.sig";
      const url = getMetaOAuthDialogUrl({ state, channelFilter: "whatsapp" });

      expect(url).toContain("whatsapp_business_messaging");
      expect(url).toContain("setup");
      expect(url).toContain("WHATSAPP");
    });
  });

  describe("autoConnectMetaResources", () => {
    it("conecta WhatsApp, Facebook Messenger e Instagram con los recursos provistos", async () => {
      const mockWabas = [
        {
          id: "waba_999",
          name: "Mi Negocio WABA",
          phoneNumbers: [
            {
              id: "phone_888",
              displayPhoneNumber: "+52 55 1234 5678",
              verifiedName: "Mi Negocio Oficial",
            },
          ],
        },
      ];

      const mockPages = [
        {
          id: "page_777",
          name: "Página Oficial de Facebook",
          accessToken: "EAAB_page_token_mock",
          instagram: {
            id: "ig_666",
            username: "minegocio_oficial",
          },
        },
      ];

      const summary = await autoConnectMetaResources({
        organizationId: "org_demo_1",
        userToken: "EAAB_user_token_mock",
        wabas: mockWabas,
        pages: mockPages,
        channelFilter: "all",
      });

      expect(summary.whatsapp?.connected).toBe(true);
      expect(summary.whatsapp?.phoneNumberId).toBe("phone_888");
      expect(summary.whatsapp?.displayPhoneNumber).toBe("+52 55 1234 5678");

      expect(summary.messenger?.connected).toBe(true);
      expect(summary.messenger?.pageId).toBe("page_777");

      expect(summary.instagram?.connected).toBe(true);
      expect(summary.instagram?.username).toBe("minegocio_oficial");
    });
  });
});
