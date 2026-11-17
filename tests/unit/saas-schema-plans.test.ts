import { describe, expect, it } from "vitest";
import { newId } from "@/lib/db/ids";
import { DEFAULT_PLANS } from "@/server/billing/seed-plans";
import { getCurrentPeriodMonth } from "@/server/billing/service";
import {
  canManageAgency,
  canManageBilling,
  hasPermission,
  isSuperAdmin,
} from "@/lib/auth/rbac";
import type { PlanLimits } from "@/lib/billing/types";

describe("SaaS Phase 1 — IDs de Entidades SaaS", () => {
  it("genera IDs válidos con los prefijos correspondientes", () => {
    const agencyId = newId("agency");
    const planId = newId("plan");
    const subId = newId("subscription");
    const quotaId = newId("usageQuota");
    const landingId = newId("landingContent");

    expect(agencyId).toMatch(/^ag_[0-9a-z]{20}$/);
    expect(planId).toMatch(/^plan_[0-9a-z]{20}$/);
    expect(subId).toMatch(/^sub_[0-9a-z]{20}$/);
    expect(quotaId).toMatch(/^quota_[0-9a-z]{20}$/);
    expect(landingId).toMatch(/^land_[0-9a-z]{20}$/);
  });
});

describe("SaaS Phase 1 — Catálogo de Planes Oficiales", () => {
  it("contiene los 4 planes base oficiales con precios y límites consistentes", () => {
    expect(DEFAULT_PLANS).toHaveLength(4);

    const slugs = DEFAULT_PLANS.map((p) => p.slug);
    expect(slugs).toEqual(["starter", "pro", "business", "agency-scale"]);

    const starter = DEFAULT_PLANS.find((p) => p.slug === "starter")!;
    const pro = DEFAULT_PLANS.find((p) => p.slug === "pro")!;
    const business = DEFAULT_PLANS.find((p) => p.slug === "business")!;
    const agency = DEFAULT_PLANS.find((p) => p.slug === "agency-scale")!;

    // Precios crecientes
    expect(starter.priceMonthlyUsd).toBe(2900);
    expect(pro.priceMonthlyUsd).toBe(7900);
    expect(business.priceMonthlyUsd).toBe(14900);
    expect(agency.priceMonthlyUsd).toBe(29900);

    // Descuento anual (aproximadamente 2 meses gratis: 10x precio mensual)
    expect(starter.priceYearlyUsd).toBe(starter.priceMonthlyUsd * 10);
    expect(pro.priceYearlyUsd).toBe(pro.priceMonthlyUsd * 10);
    expect(business.priceYearlyUsd).toBe(business.priceMonthlyUsd * 10);
    expect(agency.priceYearlyUsd).toBe(agency.priceMonthlyUsd * 10);

    // Límites escalonados
    expect(starter.limits.maxContacts).toBe(1000);
    expect(starter.limits.maxChannels).toBe(1);
    expect(starter.limits.allowWhitelabel).toBe(false);

    expect(pro.limits.maxContacts).toBe(10000);
    expect(pro.limits.maxChannels).toBe(4);
    expect(pro.limits.allowVoiceNotesTranscription).toBe(true);

    expect(business.limits.maxContacts).toBe(50000);
    expect(business.limits.maxTeamMembers).toBe(-1); // Ilimitado

    expect(agency.limits.allowWhitelabel).toBe(true);
    expect(agency.limits.allowCustomDomain).toBe(true);
    expect(agency.limits.maxContacts).toBe(-1);
  });

  it("la estructura de PlanLimits es conforme al contrato de tipos", () => {
    for (const plan of DEFAULT_PLANS) {
      const limits: PlanLimits = plan.limits;
      expect(typeof limits.maxContacts).toBe("number");
      expect(typeof limits.maxTeamMembers).toBe("number");
      expect(typeof limits.maxChannels).toBe("number");
      expect(typeof limits.maxMonthlyAiTokens).toBe("number");
      expect(Array.isArray(limits.includedModules)).toBe(true);
      expect(typeof limits.allowCustomApi).toBe("boolean");
      expect(typeof limits.allowWhitelabel).toBe("boolean");
      expect(typeof limits.allowCustomDomain).toBe("boolean");
    }
  });
});

describe("SaaS Phase 1 — Formato de Período y Cuotas", () => {
  it("getCurrentPeriodMonth devuelve el formato YYYY-MM correcto en UTC", () => {
    const fixedDate = new Date("2026-11-17T15:00:00Z");
    expect(getCurrentPeriodMonth(fixedDate)).toBe("2026-11");

    const janDate = new Date("2027-01-05T00:00:00Z");
    expect(getCurrentPeriodMonth(janDate)).toBe("2027-01");
  });
});

describe("SaaS Phase 1 — RBAC de Plataforma y Multi-Agencia", () => {
  it("reconoce a un superadministrador por rol string o por platformRole en objeto", () => {
    expect(isSuperAdmin("superadmin")).toBe(true);
    expect(isSuperAdmin({ platformRole: "superadmin" })).toBe(true);
    expect(isSuperAdmin("owner")).toBe(false);
    expect(isSuperAdmin({ platformRole: "user" })).toBe(false);
    expect(isSuperAdmin(null)).toBe(false);
  });

  it("superadmin y owner pueden gestionar facturación", () => {
    expect(canManageBilling("superadmin")).toBe(true);
    expect(canManageBilling("owner")).toBe(true);
    expect(canManageBilling("admin")).toBe(true);
    expect(canManageBilling("operador")).toBe(false);
    expect(canManageBilling("viewer")).toBe(false);
  });

  it("solo superadmin y owner pueden gestionar agencias y conmutar clientes", () => {
    expect(canManageAgency("superadmin")).toBe(true);
    expect(canManageAgency("owner")).toBe(true);
    expect(canManageAgency("admin")).toBe(false);
    expect(canManageAgency("operador")).toBe(false);

    expect(hasPermission("superadmin", "agency:switch_client")).toBe(true);
    expect(hasPermission("owner", "agency:switch_client")).toBe(true);
    expect(hasPermission("admin", "agency:switch_client")).toBe(false);
  });
});
