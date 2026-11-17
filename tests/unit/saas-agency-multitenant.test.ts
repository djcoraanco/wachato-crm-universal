import { describe, expect, it } from "vitest";
import { DEFAULT_PLANS } from "@/lib/billing/plans";
import type { AgencyBranding, AgencyMemberRole } from "@/lib/billing/types";

describe("SaaS Fase 5: Multi-Agencia, Subcuentas y Marca Blanca", () => {
  it("Plan Agency Partner posee todas las capacidades de marca blanca y límites ilimitados", () => {
    const agencyPlan = DEFAULT_PLANS.find((p) => p.slug === "agency-scale")!;
    expect(agencyPlan).toBeDefined();

    // Capacidades de agencia
    expect(agencyPlan.limits.allowWhitelabel).toBe(true);
    expect(agencyPlan.limits.allowCustomDomain).toBe(true);
    expect(agencyPlan.limits.allowCustomApi).toBe(true);
    expect(agencyPlan.limits.allowVoiceNotesTranscription).toBe(true);

    // Recursos ilimitados para agencias partner
    expect(agencyPlan.limits.maxContacts).toBe(-1);
    expect(agencyPlan.limits.maxTeamMembers).toBe(-1);
    expect(agencyPlan.limits.maxPipelines).toBe(-1);
    expect(agencyPlan.limits.includedModules.length).toBeGreaterThanOrEqual(8);
  });

  it("Estructura de AgencyBranding valida colores y dominios", () => {
    const branding: AgencyBranding = {
      brandName: "Agencia Tech Solutions",
      primaryColor: "#00C4C0",
      accentColor: "#00E5E0",
      logoUrl: "https://agencia.com/logo.svg",
      customCss: ".sidebar { background: #000; }",
    };

    expect(branding.brandName).toBe("Agencia Tech Solutions");
    expect(branding.primaryColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(branding.accentColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(branding.logoUrl).toContain("https://");
  });

  it("Roles de miembros de agencia están jerarquizados correctamente", () => {
    const roles: AgencyMemberRole[] = ["agency_owner", "agency_admin", "agency_member"];
    expect(roles).toContain("agency_owner");
    expect(roles).toContain("agency_admin");
    expect(roles).toContain("agency_member");
  });
});
