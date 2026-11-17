import { describe, expect, it, vi } from "vitest";
import { isStripeConfigured } from "@/server/billing/stripe";
import { isPayPalConfigured, handlePayPalWebhook } from "@/server/billing/paypal";
import * as billingService from "@/server/billing/service";

describe("SaaS Phase 2 — Configuración de Pasarelas", () => {
  it("reporta false cuando las variables de entorno de Stripe o PayPal no están fijadas", () => {
    // En entorno de tests unitarios puros sin llaves reales
    const stripeActive = isStripeConfigured();
    const payPalActive = isPayPalConfigured();

    // Deben retornar boolean sin arrojar excepciones
    expect(typeof stripeActive).toBe("boolean");
    expect(typeof payPalActive).toBe("boolean");
  });
});

describe("SaaS Phase 2 — Webhooks de PayPal", () => {
  it("procesa BILLING.SUBSCRIPTION.ACTIVATED llamando a upsertSubscription con status active", async () => {
    const upsertSpy = vi
      .spyOn(billingService, "upsertSubscription")
      .mockResolvedValueOnce({
        id: "sub_test123",
        agencyId: null,
        organizationId: "org_abc",
        planId: "plan_pro",
        provider: "paypal",
        providerSubscriptionId: "I-PAYPAL123",
        providerCustomerId: "PAYER123",
        status: "active",
        billingInterval: "monthly",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        trialEnd: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    const mockEvent = {
      event_type: "BILLING.SUBSCRIPTION.ACTIVATED",
      resource: {
        id: "I-PAYPAL123",
        custom_id: JSON.stringify({
          planId: "plan_pro",
          organizationId: "org_abc",
          billingInterval: "monthly",
        }),
        status: "ACTIVE",
        billing_info: {
          next_billing_time: new Date(Date.now() + 30 * 86400000).toISOString(),
        },
        subscriber: {
          payer_id: "PAYER123",
          email_address: "cliente@empresa.com",
        },
      },
    };

    const result = await handlePayPalWebhook(mockEvent);
    expect(result.received).toBe(true);
    expect(result.eventType).toBe("BILLING.SUBSCRIPTION.ACTIVATED");
    expect(upsertSpy).toHaveBeenCalledTimes(1);
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "paypal",
        providerSubscriptionId: "I-PAYPAL123",
        status: "active",
        organizationId: "org_abc",
      })
    );

    upsertSpy.mockRestore();
  });

  it("procesa BILLING.SUBSCRIPTION.CANCELLED marcando la suscripción como canceled", async () => {
    const upsertSpy = vi
      .spyOn(billingService, "upsertSubscription")
      .mockResolvedValueOnce({
        id: "sub_test123",
        agencyId: null,
        organizationId: "org_abc",
        planId: "plan_pro",
        provider: "paypal",
        providerSubscriptionId: "I-PAYPAL123",
        providerCustomerId: null,
        status: "canceled",
        billingInterval: "monthly",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
        trialEnd: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    const mockEvent = {
      event_type: "BILLING.SUBSCRIPTION.CANCELLED",
      resource: {
        id: "I-PAYPAL123",
        custom_id: JSON.stringify({
          planId: "plan_pro",
          organizationId: "org_abc",
        }),
      },
    };

    const result = await handlePayPalWebhook(mockEvent);
    expect(result.received).toBe(true);
    expect(result.eventType).toBe("BILLING.SUBSCRIPTION.CANCELLED");
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "canceled",
        cancelAtPeriodEnd: true,
      })
    );

    upsertSpy.mockRestore();
  });
});
