import { NextRequest, NextResponse } from "next/server";
import { handleStripeWebhook } from "@/server/billing/stripe";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Falta cabecera stripe-signature" }, { status: 400 });
    }

    const rawBody = await req.text();
    const result = await handleStripeWebhook(rawBody, signature);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[billing:webhook:stripe] Error procesando webhook:", err);
    return NextResponse.json(
      { error: "Error procesando webhook de Stripe", message },
      { status: 400 }
    );
  }
}
