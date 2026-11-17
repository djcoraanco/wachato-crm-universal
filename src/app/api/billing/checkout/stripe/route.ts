import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api";
import { getDb, schema } from "@/lib/db";
import { createStripeCheckoutSession } from "@/server/billing/stripe";
import { eq } from "drizzle-orm";
import { z } from "zod";

const checkoutSchema = z.object({
  planSlug: z.string().min(1),
  billingInterval: z.enum(["monthly", "yearly"]).default("monthly"),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export const POST = withAuth(async (session, req: Request) => {
  try {
    const json = await req.json();
    const parsed = checkoutSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload inválido", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { planSlug, billingInterval, successUrl, cancelUrl } = parsed.data;
    const urlObj = new URL(req.url);
    const origin = urlObj.origin;

    const db = getDb();
    const userRow = await db
      .select({ email: schema.user.email })
      .from(schema.user)
      .where(eq(schema.user.id, session.userId))
      .limit(1);

    const sessionResult = await createStripeCheckoutSession({
      planSlug,
      billingInterval,
      organizationId: session.organizationId,
      customerEmail: userRow[0]?.email,
      successUrl: successUrl ?? `${origin}/settings/billing?status=success`,
      cancelUrl: cancelUrl ?? `${origin}/settings/billing?status=cancelled`,
    });

    return NextResponse.json({
      url: sessionResult.url,
      sessionId: sessionResult.sessionId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Error iniciando checkout con Stripe", details: message },
      { status: 500 }
    );
  }
});
