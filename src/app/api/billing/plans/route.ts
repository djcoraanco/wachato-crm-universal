import { NextResponse } from "next/server";
import { getPlans } from "@/server/billing/service";
import { isStripeConfigured } from "@/server/billing/stripe";
import { isPayPalConfigured } from "@/server/billing/paypal";

export async function GET() {
  try {
    const plans = await getPlans(true);
    return NextResponse.json({
      plans: plans.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        tier: p.tier,
        description: p.description,
        priceMonthlyUsd: p.priceMonthlyUsd / 100,
        priceYearlyUsd: p.priceYearlyUsd / 100,
        limits: p.limits,
        sortOrder: p.sortOrder,
      })),
      providers: {
        stripe: isStripeConfigured(),
        paypal: isPayPalConfigured(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Error obteniendo planes", details: message },
      { status: 500 }
    );
  }
}
