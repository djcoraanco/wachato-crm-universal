import { getEnv } from "@/lib/env";
import { getPlanBySlug, upsertSubscription } from "./service";
import type { BillingInterval } from "@/lib/billing/types";

function getPayPalBaseUrl(): string {
  const environment = process.env.PAYPAL_ENVIRONMENT || "sandbox";
  return environment === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function isPayPalConfigured(): boolean {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  return Boolean(clientId && clientSecret);
}

/**
 * Obtiene un Access Token OAuth 2.0 desde la API de PayPal.
 */
export async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Credenciales de PayPal no configuradas (PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET faltante)");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error obteniendo token de PayPal (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

/**
 * Crea una suscripción en PayPal Subscriptions API y devuelve el link de aprobación para el cliente.
 */
export async function createPayPalSubscription(params: {
  planSlug: string;
  billingInterval: BillingInterval;
  organizationId?: string;
  agencyId?: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ subscriptionId: string; approveUrl: string }> {
  const plan = await getPlanBySlug(params.planSlug);
  if (!plan) {
    throw new Error(`Plan no encontrado: ${params.planSlug}`);
  }

  const isYearly = params.billingInterval === "yearly";
  const paypalPlanId = isYearly ? plan.paypalPlanIdYearly : plan.paypalPlanIdMonthly;

  const accessToken = await getPayPalAccessToken();

  // Payload de suscripción estándar de PayPal
  const customIdPayload = JSON.stringify({
    planId: plan.id,
    planSlug: plan.slug,
    organizationId: params.organizationId ?? "",
    agencyId: params.agencyId ?? "",
    billingInterval: params.billingInterval,
  });

  // Si no hay un plan ID de PayPal específico pre-creado en la consola de PayPal,
  // se utiliza un fallback de suscripción o el ID configurado
  const resolvedPlanId = paypalPlanId || `P-WACHATO-${plan.slug.toUpperCase()}-${isYearly ? "YEARLY" : "MONTHLY"}`;

  const response = await fetch(`${getPayPalBaseUrl()}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      plan_id: resolvedPlanId,
      custom_id: customIdPayload,
      application_context: {
        brand_name: "Wachato CRM",
        locale: "es-ES",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Error creando suscripción en PayPal: ${errorData}`);
  }

  const subscription = (await response.json()) as {
    id: string;
    links: Array<{ rel: string; href: string }>;
  };

  const approveLink = subscription.links.find((l) => l.rel === "approve");
  if (!approveLink) {
    throw new Error("PayPal no devolvió un enlace de aprobación (approve link)");
  }

  return {
    subscriptionId: subscription.id,
    approveUrl: approveLink.href,
  };
}

/**
 * Valida la firma del webhook de PayPal contra su endpoint de verificación.
 */
export async function verifyPayPalWebhookSignature(params: {
  headers: Record<string, string | undefined>;
  rawBody: string;
}): Promise<boolean> {
  const env = getEnv();
  const webhookId = env.PAYPAL_WEBHOOK_ID || process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;

  const accessToken = await getPayPalAccessToken();

  const response = await fetch(
    `${getPayPalBaseUrl()}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: params.headers["paypal-auth-algo"],
        cert_url: params.headers["paypal-cert-url"],
        transmission_id: params.headers["paypal-transmission-id"],
        transmission_sig: params.headers["paypal-transmission-sig"],
        transmission_time: params.headers["paypal-transmission-time"],
        webhook_id: webhookId,
        webhook_event: JSON.parse(params.rawBody),
      }),
    }
  );

  if (!response.ok) return false;
  const data = (await response.json()) as { verification_status: string };
  return data.verification_status === "SUCCESS";
}

/**
 * Procesa un evento de webhook de PayPal.
 */
export async function handlePayPalWebhook(event: {
  event_type: string;
  resource: {
    id: string;
    custom_id?: string;
    status?: string;
    billing_info?: {
      next_billing_time?: string;
      last_payment?: { time?: string };
    };
    subscriber?: { payer_id?: string; email_address?: string };
  };
}): Promise<{ received: boolean; eventType: string }> {
  const resource = event.resource;

  let metadata: Record<string, unknown> = {};
  if (resource.custom_id) {
    try {
      metadata = JSON.parse(resource.custom_id) as Record<string, unknown>;
    } catch {
      // Ignorar si no es JSON válido
    }
  }

  const planId = typeof metadata.planId === "string" ? metadata.planId : undefined;
  const orgId = typeof metadata.organizationId === "string" && metadata.organizationId ? metadata.organizationId : null;
  const agencyId = typeof metadata.agencyId === "string" && metadata.agencyId ? metadata.agencyId : null;
  const billingInterval: BillingInterval = metadata.billingInterval === "yearly" ? "yearly" : "monthly";

  switch (event.event_type) {
    case "BILLING.SUBSCRIPTION.ACTIVATED": {
      if (planId) {
        const now = new Date();
        const nextPeriod = resource.billing_info?.next_billing_time
          ? new Date(resource.billing_info.next_billing_time)
          : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        await upsertSubscription({
          organizationId: orgId,
          agencyId: agencyId,
          planId,
          provider: "paypal",
          providerSubscriptionId: resource.id,
          providerCustomerId: resource.subscriber?.payer_id ?? null,
          status: "active",
          billingInterval,
          currentPeriodStart: now,
          currentPeriodEnd: nextPeriod,
          metadata: { paypalSubscriberEmail: resource.subscriber?.email_address },
        });
      }
      break;
    }

    case "BILLING.SUBSCRIPTION.CANCELLED": {
      if (planId) {
        await upsertSubscription({
          planId,
          provider: "paypal",
          providerSubscriptionId: resource.id,
          status: "canceled",
          billingInterval,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(),
          cancelAtPeriodEnd: true,
        });
      }
      break;
    }

    case "BILLING.SUBSCRIPTION.SUSPENDED": {
      if (planId) {
        await upsertSubscription({
          planId,
          provider: "paypal",
          providerSubscriptionId: resource.id,
          status: "past_due",
          billingInterval,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(),
        });
      }
      break;
    }
  }

  return { received: true, eventType: event.event_type };
}
