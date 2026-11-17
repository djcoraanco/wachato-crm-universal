import type { PlanLimits, PlanTier } from "@/lib/billing/types";

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
      maxPipelines: 20,
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
      allowCustomDomain: true,
      allowVoiceNotesTranscription: true,
    },
    sortOrder: 3,
  },
  {
    slug: "agency-scale",
    name: "Agency Partner",
    tier: "agency",
    description: "Plataforma completa de Marca Blanca para agencias con múltiples clientes.",
    priceMonthlyUsd: 29900, // $299 USD
    priceYearlyUsd: 299000, // $2990 USD
    limits: {
      maxContacts: 200000,
      maxTeamMembers: -1, // Ilimitado
      maxChannels: 4,
      maxMonthlyAiTokens: 10000000,
      maxPipelines: -1,
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
      allowWhitelabel: true,
      allowCustomDomain: true,
      allowVoiceNotesTranscription: true,
    },
    sortOrder: 4,
  },
];
