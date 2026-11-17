import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api";
import { getOrganizationSubscription } from "@/server/billing/service";
import { createStripeCustomerPortalSession } from "@/server/billing/stripe";

export const POST = withAuth(async (session, req: Request) => {
  try {
    const orgId = session.organizationId;
    if (!orgId) {
      return NextResponse.json({ error: "Organización no activa" }, { status: 400 });
    }

    const sub = await getOrganizationSubscription(orgId);
    if (!sub || !sub.providerCustomerId) {
      return NextResponse.json(
        { error: "No se encontró un cliente de Stripe asociado a esta organización" },
        { status: 404 }
      );
    }

    const urlObj = new URL(req.url);
    const origin = urlObj.origin;
    const portalSession = await createStripeCustomerPortalSession({
      customerId: sub.providerCustomerId,
      returnUrl: `${origin}/settings/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Error abriendo portal de facturación", details: message },
      { status: 500 }
    );
  }
});
