import { getDb, schema } from "@/lib/db";
import { newId } from "@/lib/db/ids";
import type { PlanLimits, PlanTier } from "@/lib/billing/types";
import { eq } from "drizzle-orm";

export interface DefaultPlanDefinition {
  slug: string;
  name: string;
  tier: PlanTier;
  description: string;
  priceMonthlyUsd: number; // en centavos
  priceYearlyUsd: number; // en centavos (ej: 2 meses gratis)
  limits: PlanLimits;
  sortOrder: number;
}

export const DEFAULT_PLANS: DefaultPlanDefinition[] = [
  {
    slug: "starter",
    name: "Starter Emprendedor",
    tier: "starter",
    description: "Ideal para profesionales y pequeños negocios que inician en WhatsApp.",
    priceMonthlyUsd: 2900, // $29 USD
    priceYearlyUsd: 29000, // $290 USD (2 meses gratis)
    limits: {
      maxContacts: 1000,
      maxTeamMembers: 2,
      maxChannels: 1, // solo WhatsApp
      maxMonthlyAiTokens: 150000,
      maxPipelines: 1,
      includedModules: ["services"],
      allowCustomApi: false,
      allowWhitelabel: false,
      allowCustomDomain: false,
      allowVoiceNotesTranscription: false,
    },
    sortOrder: 1,
  },
  {
    slug: "pro",
    name: "Pro Negocios",
    tier: "pro",
    description: "Para empresas en crecimiento con atención omnicanal e IA avanzada.",
    priceMonthlyUsd: 7900, // $79 USD
    priceYearlyUsd: 79000, // $790 USD
    limits: {
      maxContacts: 10000,
      maxTeamMembers: 10,
      maxChannels: 4, // WhatsApp, Instagram, Messenger, TikTok
      maxMonthlyAiTokens: 800000,
      maxPipelines: 5,
      includedModules: [
        "restaurant",
        "medical",
        "ecommerce",
        "realestate",
        "services",
        "education",
        "logistics",
        "marketing",
      ],
      allowCustomApi: true,
      allowWhitelabel: false,
      allowCustomDomain: false,
      allowVoiceNotesTranscription: true,
    },
    sortOrder: 2,
  },
  {
    slug: "business",
    name: "Business Scale",
    tier: "business",
    description: "Alto volumen de ventas, automatizaciones complejas y prioridad de soporte.",
    priceMonthlyUsd: 14900, // $149 USD
    priceYearlyUsd: 149000, // $1490 USD
    limits: {
      maxContacts: 50000,
      maxTeamMembers: -1, // Ilimitado
      maxChannels: 4,
      maxMonthlyAiTokens: 2500000,
      maxPipelines: -1,
      includedModules: ["*"],
      allowCustomApi: true,
      allowWhitelabel: false,
      allowCustomDomain: true,
      allowVoiceNotesTranscription: true,
    },
    sortOrder: 3,
  },
  {
    slug: "agency-scale",
    name: "Agency Partner (Marca Blanca)",
    tier: "agency",
    description: "Para agencias de marketing y software: gestiona hasta 20 clientes con tu marca y subdominios.",
    priceMonthlyUsd: 29900, // $299 USD
    priceYearlyUsd: 299000, // $2990 USD
    limits: {
      maxContacts: -1, // Ilimitado
      maxTeamMembers: -1,
      maxChannels: 4,
      maxMonthlyAiTokens: 6000000,
      maxPipelines: -1,
      includedModules: ["*"],
      allowCustomApi: true,
      allowWhitelabel: true,
      allowCustomDomain: true,
      allowVoiceNotesTranscription: true,
    },
    sortOrder: 4,
  },
];

/**
 * Inserta o actualiza los planes por defecto en la base de datos de manera idempotente.
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
