import { describe, expect, it, vi, beforeAll, beforeEach } from "vitest";

const mockSubscriptions = [
  {
    sub: {
      id: "sub_1",
      organizationId: "org_1",
      planId: "plan_pro",
      status: "active",
      billingInterval: "monthly",
      createdAt: new Date(),
      currentPeriodEnd: new Date(),
      provider: "stripe",
      providerSubscriptionId: "sub_stripe_1",
    },
    plan: {
      id: "plan_pro",
      name: "Pro",
      slug: "pro",
      tier: "pro",
      priceMonthlyUsd: 79,
      priceYearlyUsd: 790,
      limits: { maxContacts: 10000 },
    },
  },
  {
    sub: {
      id: "sub_2",
      organizationId: "org_2",
      planId: "plan_agency",
      status: "active",
      billingInterval: "yearly",
      createdAt: new Date(),
      currentPeriodEnd: new Date(),
      provider: "paypal",
      providerSubscriptionId: "sub_paypal_2",
    },
    plan: {
      id: "plan_agency",
      name: "Agency Scale",
      slug: "agency-scale",
      tier: "agency",
      priceMonthlyUsd: 199,
      priceYearlyUsd: 1990,
      limits: { maxContacts: -1 },
    },
  },
];

vi.mock("@/server/billing/service", () => ({
  getPlanBySlug: vi.fn().mockImplementation((slug: string) => {
    return Promise.resolve({
      id: `plan_${slug}`,
      name: slug.toUpperCase(),
      slug,
      tier: slug === "agency-scale" ? "agency" : slug,
      priceMonthlyUsd: slug === "pro" ? 79 : 29,
      priceYearlyUsd: slug === "pro" ? 790 : 290,
      limits: {},
    });
  }),
  upsertSubscription: vi.fn().mockResolvedValue({ id: "sub_mock" }),
}));

vi.mock("@/lib/db", () => ({
  getDb: () => ({
    select: (fields?: unknown) => ({
      from: (_table?: unknown) => {
        const chain = {
          where: () => chain,
          innerJoin: () => chain,
          orderBy: () => chain,
          limit: () => chain,
          offset: () => chain,
          then: (resolve: (v: unknown) => void) => {
            // Si consulta suscripciones activas
            if (fields && typeof fields === "object" && "sub" in fields && "plan" in fields) {
              return resolve(mockSubscriptions);
            }
            // Si conteo
            if (fields && typeof fields === "object" && "count" in fields) {
              return resolve([{ count: 5 }]);
            }
            // Si tokens
            if (fields && typeof fields === "object" && "totalTokens" in fields) {
              return resolve([{ totalTokens: 45000 }]);
            }
            // Organizaciones default
            return resolve([
              {
                id: "org_demo",
                name: "Clínica Dental Sonrisas",
                slug: "sonrisas",
                createdAt: new Date("2026-01-15"),
                agencyId: null,
              },
            ]);
          },
        };
        return chain;
      },
    }),
  }),
  schema: {
    organization: { id: "id", name: "name", slug: "slug", createdAt: "created_at", agencyId: "agency_id" },
    user: { id: "id", name: "name", email: "email" },
    contact: { id: "id" },
    subscription: {
      id: "id",
      organizationId: "organization_id",
      agencyId: "agency_id",
      planId: "plan_id",
      status: "status",
      billingInterval: "billing_interval",
      provider: "provider",
      providerSubscriptionId: "provider_subscription_id",
      currentPeriodEnd: "current_period_end",
      createdAt: "created_at",
    },
    plan: { id: "id", name: "name", slug: "slug", tier: "tier" },
    usageQuota: {
      organizationId: "organization_id",
      periodMonth: "period_month",
      aiTokensCount: "ai_tokens_count",
      contactsCount: "contacts_count",
    },
    member: { organizationId: "organization_id", userId: "user_id", role: "role" },
    agency: { id: "id", name: "name" },
  },
}));

import {
  getSaaSSummaryMetrics,
  getAdminOrganizationsList,
  updateOrganizationPlanAdmin,
} from "@/server/admin/service";

describe("SaaS SuperAdmin & Administración Global", () => {
  beforeAll(() => {
    process.env.APP_BASE_URL = "http://localhost:3000";
    process.env.DATABASE_URL = "postgresql://t:t@localhost:5432/t";
    process.env.BETTER_AUTH_SECRET = "secret-super-admin-key-16";
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 5).toString("base64");
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";
    process.env.PAYPAL_CLIENT_ID = "paypal_mock_client";
    process.env.PAYPAL_CLIENT_SECRET = "paypal_mock_secret";
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calcula las métricas de ingresos MRR, ARR y conteos totales", async () => {
    const metrics = await getSaaSSummaryMetrics();

    // MRR = 79 (mensual pro) + 165.83 (anual agency 1990/12)
    expect(metrics.mrrUsd).toBeGreaterThan(0);
    expect(metrics.arrUsd).toBe(metrics.mrrUsd * 12);
    expect(metrics.totalOrganizations).toBe(5);
    expect(metrics.totalUsers).toBe(5);
    expect(metrics.totalContacts).toBe(5);
    expect(metrics.totalAiTokensMonthly).toBe(45000);

    expect(metrics.gatewaysStatus.stripeConfigured).toBe(true);
    expect(metrics.gatewaysStatus.paypalConfigured).toBe(true);
  });

  it("obtiene el listado enriquecido de organizaciones para el panel", async () => {
    const data = await getAdminOrganizationsList({ limit: 10 });

    expect(data.organizations.length).toBeGreaterThan(0);
    const org = data.organizations[0];
    expect(org?.id).toBe("org_demo");
    expect(org?.name).toBe("Clínica Dental Sonrisas");
    expect(data.total).toBe(5);
  });

  it("permite al superadmin cambiar el plan de una organización directamente", async () => {
    await updateOrganizationPlanAdmin({
      organizationId: "org_demo",
      planSlug: "pro",
      billingInterval: "yearly",
    });

    const { upsertSubscription } = await import("@/server/billing/service");
    expect(upsertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org_demo",
        planId: "plan_pro",
        status: "active",
        billingInterval: "yearly",
      })
    );
  });
});
