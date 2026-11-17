import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api";
import { createPayPalSubscription } from "@/server/billing/paypal";
import { z } from "zod";

const paypalCheckoutSchema = z.object({
  planSlug: z.string().min(1),
  billingInterval: z.enum(["monthly", "yearly"]).default("monthly"),
  returnUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export const POST = withAuth(async (session, req: Request) => {
  try {
    const json = await req.json();
    const parsed = paypalCheckoutSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload inválido", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { planSlug, billingInterval, returnUrl, cancelUrl } = parsed.data;
    const urlObj = new URL(req.url);
    const origin = urlObj.origin;

    const result = await createPayPalSubscription({
      planSlug,
      billingInterval,
      organizationId: session.organizationId,
      returnUrl: returnUrl ?? `${origin}/settings/billing?status=paypal_success`,
      cancelUrl: cancelUrl ?? `${origin}/settings/billing?status=paypal_cancelled`,
    });

    return NextResponse.json({
      subscriptionId: result.subscriptionId,
      approveUrl: result.approveUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Error iniciando suscripción con PayPal", details: message },
      { status: 500 }
    );
  }
});
