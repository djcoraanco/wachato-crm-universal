import { getDb, schema } from "@/lib/db";
import { newId } from "@/lib/db/ids";
import { eq } from "drizzle-orm";
import { DEFAULT_PLANS, type DefaultPlanDefinition } from "@/lib/billing/plans";

export { DEFAULT_PLANS, type DefaultPlanDefinition };

/**
 * Inserta o sincroniza los planes por defecto de Wachato CRM en la base de datos.
 * Es idempotente: si el plan ya existe por `slug`, actualiza sus límites y precios.
 */
export async function seedDefaultPlans(): Promise<void> {
  const db = getDb();

  for (const def of DEFAULT_PLANS) {
    const existing = await db
      .select({ id: schema.plan.id })
      .from(schema.plan)
      .where(eq(schema.plan.slug, def.slug))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.plan).values({
        id: newId("plan"),
        slug: def.slug,
        name: def.name,
        tier: def.tier,
        description: def.description,
        priceMonthlyUsd: def.priceMonthlyUsd,
        priceYearlyUsd: def.priceYearlyUsd,
        limits: def.limits,
        sortOrder: def.sortOrder,
        isActive: true,
      });
    } else {
      const planId = existing[0]!.id;
      await db
        .update(schema.plan)
        .set({
          name: def.name,
          tier: def.tier,
          description: def.description,
          priceMonthlyUsd: def.priceMonthlyUsd,
          priceYearlyUsd: def.priceYearlyUsd,
          limits: def.limits,
          sortOrder: def.sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(schema.plan.id, planId));
    }
  }
}
