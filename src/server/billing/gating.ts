import { getDb, schema } from "@/lib/db";
import { scoped } from "@/lib/db/tenant";
import { count } from "drizzle-orm";
import { getEffectivePlan, getOrCreateCurrentUsage } from "./service";

export class QuotaExceededError extends Error {
  constructor(
    public readonly metric: "contacts" | "aiTokens" | "channels" | "teamMembers",
    public readonly current: number,
    public readonly limit: number
  ) {
    super(
      `Límite alcanzado para '${metric}': ${current}/${limit}. Actualiza tu plan para ampliar la capacidad.`
    );
    this.name = "QuotaExceededError";
  }
}

export class FeatureNotAllowedError extends Error {
  constructor(public readonly feature: string, public readonly requiredTier = "pro") {
    super(
      `La función '${feature}' no está disponible en tu plan actual. Requiere el plan ${requiredTier.toUpperCase()} o superior.`
    );
    this.name = "FeatureNotAllowedError";
  }
}

/**
 * Mapeo de módulos a categorías de industria del plan.
 */
const MODULE_CATEGORY_MAPPING: Record<string, string> = {
  // Módulos con slugs o categorías directas
  restaurantes: "restaurant",
  restaurant: "restaurant",
  clinicas: "medical",
  medical: "medical",
  ecommerce: "ecommerce",
  inmobiliarias: "realestate",
  realestate: "realestate",
  marketing: "marketing",
  servicios: "services",
  services: "services",
  educacion: "education",
  education: "education",
  logistica: "logistics",
  logistics: "logistics",
};

/**
 * Obtiene el total de contactos reales almacenados para una organización.
 */
export async function getActualContactCount(organizationId: string): Promise<number> {
  const db = getDb();
  const res = await db
    .select({ total: count() })
    .from(schema.contact)
    .where(scoped(schema.contact.organizationId, organizationId));
  return Number(res[0]?.total ?? 0);
}

/**
 * Obtiene el total de miembros de equipo en una organización.
 */
export async function getActualTeamMemberCount(organizationId: string): Promise<number> {
  const db = getDb();
  const res = await db
    .select({ total: count() })
    .from(schema.member)
    .where(scoped(schema.member.organizationId, organizationId));
  return Number(res[0]?.total ?? 0);
}

/**
 * Obtiene el total de canales configurados y activos para una organización.
 */
export async function getActualChannelCount(organizationId: string): Promise<number> {
  const db = getDb();
  let channels = 1; // WhatsApp Cloud API base

  // Verificar si tiene credenciales en canales opcionales
  const ig = await db
    .select({ id: schema.instagramCredentials.id })
    .from(schema.instagramCredentials)
    .where(scoped(schema.instagramCredentials.organizationId, organizationId))
    .limit(1);
  if (ig.length > 0) channels++;

  const fb = await db
    .select({ id: schema.messengerCredentials.id })
    .from(schema.messengerCredentials)
    .where(scoped(schema.messengerCredentials.organizationId, organizationId))
    .limit(1);
  if (fb.length > 0) channels++;

  const tt = await db
    .select({ id: schema.tiktokCredentials.id })
    .from(schema.tiktokCredentials)
    .where(scoped(schema.tiktokCredentials.organizationId, organizationId))
    .limit(1);
  if (tt.length > 0) channels++;

  return channels;
}

/**
 * Valida si la organización puede agregar más contactos.
 */
export async function assertCanAddContact(
  organizationId: string,
  countToAdd = 1
): Promise<{ allowed: boolean; current: number; limit: number; remaining: number }> {
  const { limits } = await getEffectivePlan(organizationId);
  const current = await getActualContactCount(organizationId);
  const limit = limits.maxContacts;

  if (limit === -1) {
    return { allowed: true, current, limit: -1, remaining: Infinity };
  }

  const remaining = Math.max(0, limit - current);
  if (current + countToAdd > limit) {
    throw new QuotaExceededError("contacts", current, limit);
  }

  return { allowed: true, current, limit, remaining };
}

/**
 * Valida si la organización puede invitar o agregar otro miembro a su equipo.
 */
export async function assertCanAddTeamMember(
  organizationId: string
): Promise<{ allowed: boolean; current: number; limit: number; remaining: number }> {
  const { limits } = await getEffectivePlan(organizationId);
  const current = await getActualTeamMemberCount(organizationId);
  const limit = limits.maxTeamMembers;

  if (limit === -1) {
    return { allowed: true, current, limit: -1, remaining: Infinity };
  }

  const remaining = Math.max(0, limit - current);
  if (current + 1 > limit) {
    throw new QuotaExceededError("teamMembers", current, limit);
  }

  return { allowed: true, current, limit, remaining };
}

/**
 * Valida si la organización puede conectar un canal adicional.
 */
export async function assertCanAddChannel(
  organizationId: string,
  _channelName: string
): Promise<{ allowed: boolean; current: number; limit: number; remaining: number }> {
  const { limits } = await getEffectivePlan(organizationId);
  const current = await getActualChannelCount(organizationId);
  const limit = limits.maxChannels;

  if (limit === -1) {
    return { allowed: true, current, limit: -1, remaining: Infinity };
  }

  const remaining = Math.max(0, limit - current);
  if (current >= limit) {
    throw new QuotaExceededError("channels", current, limit);
  }

  return { allowed: true, current, limit, remaining };
}

/**
 * Valida si la organización tiene cuota disponible para consumir tokens de IA en el mes.
 */
export async function assertCanConsumeAiTokens(
  organizationId: string,
  tokensRequested = 100
): Promise<{ allowed: boolean; current: number; limit: number; remaining: number }> {
  const { limits } = await getEffectivePlan(organizationId);
  const usage = await getOrCreateCurrentUsage(organizationId);
  const current = usage.aiTokensUsed;
  const limit = limits.maxMonthlyAiTokens;

  if (limit === -1) {
    return { allowed: true, current, limit: -1, remaining: Infinity };
  }

  const remaining = Math.max(0, limit - current);
  if (current + tokensRequested > limit) {
    throw new QuotaExceededError("aiTokens", current, limit);
  }

  return { allowed: true, current, limit, remaining };
}

/**
 * Valida si un módulo de industria específico está incluido en el plan de la organización.
 */
export async function assertModuleAllowed(
  organizationId: string,
  moduleId: string
): Promise<boolean> {
  const { limits, plan } = await getEffectivePlan(organizationId);
  const normalizedCategory = MODULE_CATEGORY_MAPPING[moduleId.toLowerCase()] || moduleId.toLowerCase();

  // Si tiene todos los módulos o el módulo está explícitamente listado
  const isIncluded =
    limits.includedModules.includes(normalizedCategory) ||
    limits.includedModules.includes(moduleId) ||
    limits.includedModules.includes("all");

  if (!isIncluded) {
    throw new FeatureNotAllowedError(`Módulo '${moduleId}'`, plan?.tier === "starter" ? "pro" : "business");
  }

  return true;
}

/**
 * Valida si una característica booleana está autorizada para la organización.
 */
export async function assertFeatureAllowed(
  organizationId: string,
  feature: "allowCustomApi" | "allowWhitelabel" | "allowCustomDomain" | "allowVoiceNotesTranscription"
): Promise<boolean> {
  const { limits } = await getEffectivePlan(organizationId);
  const allowed = Boolean(limits[feature]);

  if (!allowed) {
    throw new FeatureNotAllowedError(feature, feature === "allowWhitelabel" ? "agency" : "pro");
  }

  return true;
}

/**
 * Resumen consolidado del estado de cuotas de una organización para el portal de facturación y API.
 */
export async function getOrganizationQuotaSummary(organizationId: string) {
  const { plan, limits, source } = await getEffectivePlan(organizationId);
  const usage = await getOrCreateCurrentUsage(organizationId);

  const contactCount = await getActualContactCount(organizationId);
  const teamCount = await getActualTeamMemberCount(organizationId);
  const channelCount = await getActualChannelCount(organizationId);

  return {
    plan: plan
      ? {
          id: plan.id,
          name: plan.name,
          slug: plan.slug,
          tier: plan.tier,
        }
      : null,
    source,
    periodMonth: usage.periodMonth,
    quotas: {
      contacts: {
        current: contactCount,
        limit: limits.maxContacts,
        remaining: limits.maxContacts === -1 ? Infinity : Math.max(0, limits.maxContacts - contactCount),
        percentage:
          limits.maxContacts === -1
            ? 0
            : Math.min(100, Math.round((contactCount / limits.maxContacts) * 100)),
      },
      teamMembers: {
        current: teamCount,
        limit: limits.maxTeamMembers,
        remaining: limits.maxTeamMembers === -1 ? Infinity : Math.max(0, limits.maxTeamMembers - teamCount),
        percentage:
          limits.maxTeamMembers === -1
            ? 0
            : Math.min(100, Math.round((teamCount / limits.maxTeamMembers) * 100)),
      },
      channels: {
        current: channelCount,
        limit: limits.maxChannels,
        remaining: limits.maxChannels === -1 ? Infinity : Math.max(0, limits.maxChannels - channelCount),
        percentage:
          limits.maxChannels === -1
            ? 0
            : Math.min(100, Math.round((channelCount / limits.maxChannels) * 100)),
      },
      aiTokens: {
        current: usage.aiTokensUsed,
        limit: limits.maxMonthlyAiTokens,
        remaining:
          limits.maxMonthlyAiTokens === -1
            ? Infinity
            : Math.max(0, limits.maxMonthlyAiTokens - usage.aiTokensUsed),
        percentage:
          limits.maxMonthlyAiTokens === -1
            ? 0
            : Math.min(100, Math.round((usage.aiTokensUsed / limits.maxMonthlyAiTokens) * 100)),
      },
    },
    features: {
      includedModules: limits.includedModules,
      allowCustomApi: limits.allowCustomApi,
      allowWhitelabel: limits.allowWhitelabel,
      allowCustomDomain: limits.allowCustomDomain,
      allowVoiceNotesTranscription: limits.allowVoiceNotesTranscription,
    },
  };
}
