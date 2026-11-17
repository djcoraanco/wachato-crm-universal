import { NextRequest, NextResponse } from "next/server";
import { handlePayPalWebhook, verifyPayPalWebhookSignature } from "@/server/billing/paypal";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headers = {
      "paypal-auth-algo": req.headers.get("paypal-auth-algo") ?? undefined,
      "paypal-cert-url": req.headers.get("paypal-cert-url") ?? undefined,
      "paypal-transmission-id": req.headers.get("paypal-transmission-id") ?? undefined,
      "paypal-transmission-sig": req.headers.get("paypal-transmission-sig") ?? undefined,
      "paypal-transmission-time": req.headers.get("paypal-transmission-time") ?? undefined,
    };

    // Si PAYPAL_WEBHOOK_ID está configurado, verificar la firma criptográfica
    if (process.env.PAYPAL_WEBHOOK_ID) {
      const isValid = await verifyPayPalWebhookSignature({ headers, rawBody });
      if (!isValid) {
        return NextResponse.json({ error: "Firma de webhook de PayPal inválida" }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    const result = await handlePayPalWebhook(event);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[billing:webhook:paypal] Error procesando webhook:", err);
    return NextResponse.json(
      { error: "Error procesando webhook de PayPal", message },
      { status: 400 }
    );
  }
}
