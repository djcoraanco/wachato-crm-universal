import Stripe from "stripe";
import { getPlanBySlug, upsertSubscription } from "./service";
import type { BillingInterval } from "@/lib/billing/types";

let stripeInstance: Stripe | null = null;

type StripeSubscriptionLike = {
  id: string;
  customer?: string | { id: string } | null;
  status?: string;
  current_period_start?: number;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  metadata?: Record<string, string>;
  items?: { data?: Array<{ price?: { recurring?: { interval?: string } } }> };
};

type StripeInvoiceLike = {
  subscription?: string | { id: string } | null;
};

export function getStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;

  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey, {
      typescript: true,
    });
  }
  return stripeInstance;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Crea una sesión de Checkout en Stripe para suscripciones recurrentes.
 */
export async function createStripeCheckoutSession(params: {
  planSlug: string;
  billingInterval: BillingInterval;
  organizationId?: string;
  agencyId?: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe no está configurado (falta STRIPE_SECRET_KEY)");
  }

  const plan = await getPlanBySlug(params.planSlug);
  if (!plan) {
    throw new Error(`Plan no encontrado: ${params.planSlug}`);
  }

  const isYearly = params.billingInterval === "yearly";
  const unitAmount = isYearly ? plan.priceYearlyUsd : plan.priceMonthlyUsd;
  const configuredPriceId = isYearly
    ? plan.stripePriceIdYearly
    : plan.stripePriceIdMonthly;

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  if (configuredPriceId) {
    lineItems.push({
      price: configuredPriceId,
      quantity: 1,
    });
  } else {
    // Generación dinámica de precio con recurring mensual o anual
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: `${plan.name} (${isYearly ? "Anual" : "Mensual"})`,
          description: plan.description ?? `Suscripción a ${plan.name} en Wachato CRM`,
        },
        unit_amount: unitAmount,
        recurring: {
          interval: isYearly ? "year" : "month",
        },
      },
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: lineItems,
    customer_email: params.customerEmail,
    success_url: `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: params.cancelUrl,
    metadata: {
      planId: plan.id,
      planSlug: plan.slug,
      billingInterval: params.billingInterval,
      organizationId: params.organizationId ?? "",
      agencyId: params.agencyId ?? "",
    },
    subscription_data: {
      metadata: {
        planId: plan.id,
        planSlug: plan.slug,
        organizationId: params.organizationId ?? "",
        agencyId: params.agencyId ?? "",
      },
    },
  });

  if (!session.url) {
    throw new Error("No se pudo generar la URL de Stripe Checkout");
  }

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/**
 * Crea una sesión para el Customer Portal de Stripe (permite al cliente gestionar tarjetas y facturas).
 */
export async function createStripeCustomerPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<{ url: string }> {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe no está configurado");
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });

  return { url: portalSession.url };
}

/**
 * Procesa y valida eventos recibidos desde el webhook de Stripe.
 */
export async function handleStripeWebhook(
  rawBody: string | Buffer,
  signature: string
): Promise<{ received: boolean; eventType: string }> {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    throw new Error("Stripe o STRIPE_WEBHOOK_SECRET no configurado");
  }

  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription) {
        const subId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;
        const customerId = typeof session.customer === "string"
          ? session.customer
          : session.customer?.id ?? null;

        const planId = session.metadata?.planId;
        const orgId = session.metadata?.organizationId || null;
        const agencyId = session.metadata?.agencyId || null;
        const billingInterval = (session.metadata?.billingInterval ?? "monthly") as BillingInterval;

        if (planId) {
          const subscriptionObj = (await stripe.subscriptions.retrieve(subId)) as unknown as StripeSubscriptionLike;
          await upsertSubscription({
            organizationId: orgId,
            agencyId: agencyId,
            planId,
            provider: "stripe",
            providerSubscriptionId: subId,
            providerCustomerId: customerId,
            status: "active",
            billingInterval,
            currentPeriodStart: new Date((subscriptionObj.current_period_start ?? Date.now() / 1000) * 1000),
            currentPeriodEnd: new Date((subscriptionObj.current_period_end ?? Date.now() / 1000 + 2592000) * 1000),
            cancelAtPeriodEnd: Boolean(subscriptionObj.cancel_at_period_end),
            metadata: { stripeSessionId: session.id },
          });
        }
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as unknown as StripeSubscriptionLike;
      const planId = sub.metadata?.planId;
      const orgId = sub.metadata?.organizationId || null;
      const agencyId = sub.metadata?.agencyId || null;

      let status: "active" | "past_due" | "canceled" | "trialing" = "active";
      if (sub.status === "past_due") status = "past_due";
      if (sub.status === "canceled") status = "canceled";
      if (sub.status === "trialing") status = "trialing";

      if (planId) {
        await upsertSubscription({
          organizationId: orgId,
          agencyId: agencyId,
          planId,
          provider: "stripe",
          providerSubscriptionId: sub.id,
          providerCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
          status,
          billingInterval: sub.items?.data?.[0]?.price?.recurring?.interval === "year" ? "yearly" : "monthly",
          currentPeriodStart: new Date((sub.current_period_start ?? Date.now() / 1000) * 1000),
          currentPeriodEnd: new Date((sub.current_period_end ?? Date.now() / 1000 + 2592000) * 1000),
          cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as unknown as StripeSubscriptionLike;
      const planId = sub.metadata?.planId;
      if (planId) {
        await upsertSubscription({
          planId,
          provider: "stripe",
          providerSubscriptionId: sub.id,
          status: "canceled",
          billingInterval: "monthly",
          currentPeriodStart: new Date((sub.current_period_start ?? Date.now() / 1000) * 1000),
          currentPeriodEnd: new Date((sub.current_period_end ?? Date.now() / 1000) * 1000),
          cancelAtPeriodEnd: true,
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as unknown as StripeInvoiceLike;
      if (invoice.subscription) {
        const subId = typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription.id;
        const sub = (await stripe.subscriptions.retrieve(subId)) as unknown as StripeSubscriptionLike;
        const planId = sub.metadata?.planId;
        if (planId) {
          await upsertSubscription({
            planId,
            provider: "stripe",
            providerSubscriptionId: subId,
            status: "past_due",
            billingInterval: "monthly",
            currentPeriodStart: new Date((sub.current_period_start ?? Date.now() / 1000) * 1000),
            currentPeriodEnd: new Date((sub.current_period_end ?? Date.now() / 1000 + 2592000) * 1000),
          });
        }
      }
      break;
    }
  }

  return { received: true, eventType: event.type };
}
