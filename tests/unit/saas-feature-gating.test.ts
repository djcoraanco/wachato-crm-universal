import { describe, expect, it } from "vitest";
import { DEFAULT_PLANS } from "@/lib/billing/plans";
import {
  FeatureNotAllowedError,
  QuotaExceededError,
} from "@/server/billing/gating";

describe("SaaS Fase 4: Feature Gating Estricto y Cuotas en Tiempo Real", () => {
  it("QuotaExceededError construye mensajes detallados y propiedades exactas", () => {
    const err = new QuotaExceededError("contacts", 1000, 1000);
    expect(err.metric).toBe("contacts");
    expect(err.current).toBe(1000);
    expect(err.limit).toBe(1000);
    expect(err.message).toContain("Límite alcanzado para 'contacts': 1000/1000");
  });

  it("FeatureNotAllowedError requiere el tier adecuado", () => {
    const err = new FeatureNotAllowedError("allowWhitelabel", "agency");
    expect(err.feature).toBe("allowWhitelabel");
    expect(err.requiredTier).toBe("agency");
    expect(err.message).toContain("Requiere el plan AGENCY o superior");
  });

  it("Plan Starter restringe estrictamente contactos, canales y módulos", () => {
    const starter = DEFAULT_PLANS.find((p) => p.slug === "starter")!;
    expect(starter).toBeDefined();

    // Límites estrictos
    expect(starter.limits.maxContacts).toBe(1000);
    expect(starter.limits.maxChannels).toBe(1);
    expect(starter.limits.maxTeamMembers).toBe(2);
    expect(starter.limits.maxMonthlyAiTokens).toBe(150000);

    // Módulos: solo servicios
    expect(starter.limits.includedModules).toEqual(["services"]);
    expect(starter.limits.allowWhitelabel).toBe(false);
    expect(starter.limits.allowCustomDomain).toBe(false);
    expect(starter.limits.allowVoiceNotesTranscription).toBe(false);
  });

  it("Plan Pro desbloquea omnicanal, transcripción Whisper y los 8 módulos", () => {
    const pro = DEFAULT_PLANS.find((p) => p.slug === "pro")!;
    expect(pro).toBeDefined();

    expect(pro.limits.maxContacts).toBe(10000);
    expect(pro.limits.maxChannels).toBe(4);
    expect(pro.limits.maxTeamMembers).toBe(10);
    expect(pro.limits.maxMonthlyAiTokens).toBe(800000);
    expect(pro.limits.allowVoiceNotesTranscription).toBe(true);
    expect(pro.limits.includedModules.length).toBeGreaterThanOrEqual(8);
  });

  it("Plan Business y Agency ofrecen miembros ilimitados y marca blanca", () => {
    const business = DEFAULT_PLANS.find((p) => p.slug === "business")!;
    const agency = DEFAULT_PLANS.find((p) => p.slug === "agency-scale")!;

    expect(business.limits.maxTeamMembers).toBe(-1); // ilimitado
    expect(agency.limits.maxTeamMembers).toBe(-1); // ilimitado
    expect(agency.limits.allowWhitelabel).toBe(true);
    expect(agency.limits.allowCustomDomain).toBe(true);
    expect(agency.limits.maxContacts).toBe(-1);
  });
});
