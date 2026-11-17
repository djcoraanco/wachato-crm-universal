/**
 * Tipos de dominio para la plataforma SaaS, Planes, Suscripciones, Cuotas y Agencias.
 */

export type PlanTier = "starter" | "pro" | "business" | "agency" | "enterprise";

export type BillingInterval = "monthly" | "yearly";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "paused";

export type BillingProvider = "stripe" | "paypal" | "manual";

export type PlanLimits = {
  maxContacts: number; // -1 = ilimitado
  maxTeamMembers: number; // -1 = ilimitado
  maxChannels: number; // 1 = solo WA, 4 = todos
  maxMonthlyAiTokens: number;
  maxPipelines: number;
  includedModules: string[]; // ["*"] o IDs específicos ["medical", "restaurant", ...]
  allowCustomApi: boolean;
  allowWhitelabel: boolean;
  allowCustomDomain: boolean;
  allowVoiceNotesTranscription: boolean;
};

export type AgencyStatus = "active" | "suspended" | "trial" | "past_due";

export type AgencyMemberRole = "agency_owner" | "agency_admin" | "agency_member";

export type AgencyBranding = {
  brandName: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  accentColor: string;
  supportEmail?: string;
  customCss?: string;
};

export type LandingHeroConfig = {
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  imageUrl?: string;
};

export type LandingFeatureItem = {
  icon: string;
  title: string;
  description: string;
  badge?: string;
};

export type LandingPricingConfig = {
  headline: string;
  subheadline: string;
  highlightedPlanSlug?: string;
  yearlyDiscountPercent: number;
};

export type LandingTestimonialItem = {
  name: string;
  role: string;
  company: string;
  avatarUrl?: string;
  quote: string;
  rating: number;
};

export type LandingFaqItem = {
  question: string;
  answer: string;
};

export type LandingThemeConfig = {
  primaryColor: string;
  accentColor: string;
  darkBg: string;
  panelBg: string;
};

export type LandingSeoConfig = {
  metaTitle: string;
  metaDescription: string;
  ogImage?: string;
};
