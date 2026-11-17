import { getDb, schema } from "@/lib/db";
import { newId } from "@/lib/db/ids";
import type {
  BillingInterval,
  BillingProvider,
  PlanLimits,
  SubscriptionStatus,
} from "@/lib/billing/types";
import { and, desc, eq, sql } from "drizzle-orm";
import { DEFAULT_PLANS } from "./seed-plans";

export type PlanRecord = typeof schema.plan.$inferSelect;
export type SubscriptionRecord = typeof schema.subscription.$inferSelect;
export type UsageQuotaRecord = typeof schema.usageQuota.$inferSelect;

/**
 * Límites ilimitados para el SuperAdmin y organizaciones de la plataforma.
 */
export const SUPERADMIN_UNLIMITED_LIMITS: PlanLimits = {
  maxContacts: -1,
  maxTeamMembers: -1,
  maxChannels: -1,
  maxMonthlyAiTokens: -1,
  maxPipelines: -1,
  includedModules: ["all"],
  allowCustomApi: true,
  allowWhitelabel: true,
  allowCustomDomain: true,
  allowVoiceNotesTranscription: true,
};

/**
 * Obtiene todos los planes disponibles ordenados por sortOrder.
 */
export async function getPlans(onlyActive = true): Promise<PlanRecord[]> {
  const db = getDb();
  if (onlyActive) {
    return db
      .select()
      .from(schema.plan)
      .where(eq(schema.plan.isActive, true))
      .orderBy(schema.plan.sortOrder);
  }
  return db.select().from(schema.plan).orderBy(schema.plan.sortOrder);
}

/**
 * Obtiene un plan por su slug identificador.
 */
export async function getPlanBySlug(slug: string): Promise<PlanRecord | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.plan)
    .where(eq(schema.plan.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Obtiene un plan por su ID único.
 */
export async function getPlanById(id: string): Promise<PlanRecord | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.plan)
    .where(eq(schema.plan.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Obtiene la suscripción activa de una organización.
 */
export async function getOrganizationSubscription(
  organizationId: string
): Promise<(SubscriptionRecord & { plan: PlanRecord }) | null> {
  const db = getDb();
  const rows = await db
    .select({
      sub: schema.subscription,
      plan: schema.plan,
    })
    .from(schema.subscription)
    .innerJoin(schema.plan, eq(schema.subscription.planId, schema.plan.id))
    .where(eq(schema.subscription.organizationId, organizationId))
    .orderBy(desc(schema.subscription.createdAt))
    .limit(1);

  if (!rows[0]) return null;
  return {
    ...rows[0].sub,
    plan: rows[0].plan,
  };
}

/**
 * Obtiene la suscripción activa de una agencia.
 */
export async function getAgencySubscription(
  agencyId: string
): Promise<(SubscriptionRecord & { plan: PlanRecord }) | null> {
  const db = getDb();
  const rows = await db
    .select({
      sub: schema.subscription,
      plan: schema.plan,
    })
    .from(schema.subscription)
    .innerJoin(schema.plan, eq(schema.subscription.planId, schema.plan.id))
    .where(eq(schema.subscription.agencyId, agencyId))
    .orderBy(desc(schema.subscription.createdAt))
    .limit(1);

  if (!rows[0]) return null;
  return {
    ...rows[0].sub,
    plan: rows[0].plan,
  };
}

/**
 * Obtiene el plan efectivo y sus límites para una organización.
 * Si pertenece a una agencia con plan activo, hereda las características de la agencia.
 * Si no tiene suscripción explícita, devuelve los límites del plan Starter como fallback seguro.
 */
export async function getEffectivePlan(organizationId: string): Promise<{
  plan: PlanRecord | null;
  limits: PlanLimits;
  isCustom: boolean;
  source: "organization" | "agency" | "fallback";
}> {
  const db = getDb();

  // 0. Comprobar si la organización tiene algún miembro con rol de plataforma 'superadmin'.
  // El SuperAdmin es el dueño self-hosted del sistema y jamás debe tener limitaciones de cuotas o módulos.
  const superadminMember = await db
    .select({ id: schema.user.id })
    .from(schema.member)
    .innerJoin(schema.user, eq(schema.member.userId, schema.user.id))
    .where(
      and(
        eq(schema.member.organizationId, organizationId),
        eq(schema.user.platformRole, "superadmin")
      )
    )
    .limit(1);

  if (superadminMember.length > 0) {
    const topPlan =
      (await getPlanBySlug("agency-scale")) ||
      (await getPlanBySlug("business")) ||
      (await getPlanBySlug("pro"));
    return {
      plan: topPlan,
      limits: SUPERADMIN_UNLIMITED_LIMITS,
      isCustom: true,
      source: "organization",
    };
  }

  // 1. Verificar suscripción directa de la organización
  const orgSub = await getOrganizationSubscription(organizationId);
  if (orgSub && (orgSub.status === "active" || orgSub.status === "trialing")) {
    return {
      plan: orgSub.plan,
      limits: orgSub.plan.limits,
      isCustom: false,
      source: "organization",
    };
  }

  // 2. Verificar si pertenece a una agencia y si la agencia tiene suscripción
  const orgRow = await db
    .select({ agencyId: schema.organization.agencyId })
    .from(schema.organization)
    .where(eq(schema.organization.id, organizationId))
    .limit(1);

  if (orgRow[0]?.agencyId) {
    const agencySub = await getAgencySubscription(orgRow[0].agencyId);
    if (agencySub && (agencySub.status === "active" || agencySub.status === "trialing")) {
      return {
        plan: agencySub.plan,
        limits: agencySub.plan.limits,
        isCustom: false,
        source: "agency",
      };
    }
  }

  // 2.5. Si no tiene suscripción ni agencia nodriza y en el sistema existe un superadmin,
  // conceder límites ilimitados por defecto (modo self-hosted master)
  const anySuper = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.platformRole, "superadmin"))
    .limit(1);

  if (anySuper.length > 0 && !orgRow[0]?.agencyId) {
    const topPlan =
      (await getPlanBySlug("agency-scale")) ||
      (await getPlanBySlug("business")) ||
      (await getPlanBySlug("pro"));
    return {
      plan: topPlan,
      limits: SUPERADMIN_UNLIMITED_LIMITS,
      isCustom: true,
      source: "organization",
    };
  }

  // 3. Fallback: plan starter por defecto
  const starterDef = DEFAULT_PLANS.find((p) => p.slug === "starter")!;
  const starterDb = await getPlanBySlug("starter");

  return {
    plan: starterDb,
    limits: starterDb ? starterDb.limits : starterDef.limits,
    isCustom: false,
    source: "fallback",
  };
}

/**
 * Crea o actualiza una suscripción en base de datos al recibir eventos de pago (Stripe / PayPal).
 */
export async function upsertSubscription(params: {
  id?: string;
  agencyId?: string | null;
  organizationId?: string | null;
  planId: string;
  provider: BillingProvider;
  providerSubscriptionId?: string | null;
  providerCustomerId?: string | null;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<SubscriptionRecord> {
  const db = getDb();

  if (params.id) {
    const [updated] = await db
      .update(schema.subscription)
      .set({
        planId: params.planId,
        status: params.status,
        billingInterval: params.billingInterval,
        currentPeriodStart: params.currentPeriodStart,
        currentPeriodEnd: params.currentPeriodEnd,
        cancelAtPeriodEnd: params.cancelAtPeriodEnd ?? false,
        metadata: params.metadata,
        updatedAt: new Date(),
      })
      .where(eq(schema.subscription.id, params.id))
      .returning();
    if (updated) return updated;
  }

  // Si existe por providerSubscriptionId, actualizar
  if (params.providerSubscriptionId) {
    const existing = await db
      .select({ id: schema.subscription.id })
      .from(schema.subscription)
      .where(eq(schema.subscription.providerSubscriptionId, params.providerSubscriptionId))
      .limit(1);

    if (existing[0]) {
      const [updated] = await db
        .update(schema.subscription)
        .set({
          planId: params.planId,
          status: params.status,
          billingInterval: params.billingInterval,
          currentPeriodStart: params.currentPeriodStart,
          currentPeriodEnd: params.currentPeriodEnd,
          cancelAtPeriodEnd: params.cancelAtPeriodEnd ?? false,
          metadata: params.metadata,
          updatedAt: new Date(),
        })
        .where(eq(schema.subscription.id, existing[0].id))
        .returning();
      if (updated) return updated;
    }
  }

  // Crear nueva suscripción
  const subId = newId("subscription");
  const [created] = await db
    .insert(schema.subscription)
    .values({
      id: subId,
      agencyId: params.agencyId ?? null,
      organizationId: params.organizationId ?? null,
      planId: params.planId,
      provider: params.provider,
      providerSubscriptionId: params.providerSubscriptionId ?? null,
      providerCustomerId: params.providerCustomerId ?? null,
      status: params.status,
      billingInterval: params.billingInterval,
      currentPeriodStart: params.currentPeriodStart,
      currentPeriodEnd: params.currentPeriodEnd,
      cancelAtPeriodEnd: params.cancelAtPeriodEnd ?? false,
      metadata: params.metadata,
    })
    .returning();

  return created!;
}

/**
 * Obtiene o inicializa la cuota de uso del mes corriente ("YYYY-MM").
 */
export async function getOrCreateCurrentUsage(
  organizationId: string,
  periodMonth = getCurrentPeriodMonth()
): Promise<UsageQuotaRecord> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.usageQuota)
    .where(
      and(
        eq(schema.usageQuota.organizationId, organizationId),
        eq(schema.usageQuota.periodMonth, periodMonth)
      )
    )
    .limit(1);

  if (rows[0]) return rows[0];

  const quotaId = newId("usageQuota");
  const [created] = await db
    .insert(schema.usageQuota)
    .values({
      id: quotaId,
      organizationId,
      periodMonth,
      aiTokensUsed: 0,
      messagesSent: 0,
      mediaStorageBytes: 0,
      contactsCount: 0,
    })
    .returning();

  return created!;
}

/**
 * Registra consumo de tokens de IA o mensajes en la cuota mensual.
 */
export async function recordUsage(params: {
  organizationId: string;
  aiTokensDelta?: number;
  messagesDelta?: number;
  periodMonth?: string;
}): Promise<void> {
  const db = getDb();
  const period = params.periodMonth ?? getCurrentPeriodMonth();
  await getOrCreateCurrentUsage(params.organizationId, period);

  await db
    .update(schema.usageQuota)
    .set({
      aiTokensUsed: sql`${schema.usageQuota.aiTokensUsed} + ${params.aiTokensDelta ?? 0}`,
      messagesSent: sql`${schema.usageQuota.messagesSent} + ${params.messagesDelta ?? 0}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.usageQuota.organizationId, params.organizationId),
        eq(schema.usageQuota.periodMonth, period)
      )
    );
}

/**
 * Comprueba si la organización tiene cuota disponible para una métrica.
 */
export async function checkQuotaAvailable(
  organizationId: string,
  metric: "contacts" | "aiTokens" | "channels" | "teamMembers",
  requestedAmount = 1
): Promise<{ allowed: boolean; current: number; limit: number; remaining: number }> {
  const { limits } = await getEffectivePlan(organizationId);
  const currentUsage = await getOrCreateCurrentUsage(organizationId);

  let current = 0;
  let limit = -1;

  switch (metric) {
    case "aiTokens":
      current = currentUsage.aiTokensUsed;
      limit = limits.maxMonthlyAiTokens;
      break;
    case "contacts":
      current = currentUsage.contactsCount;
      limit = limits.maxContacts;
      break;
    case "channels":
      current = 1; // Base WA
      limit = limits.maxChannels;
      break;
    case "teamMembers":
      current = 1;
      limit = limits.maxTeamMembers;
      break;
  }

  if (limit === -1) {
    return { allowed: true, current, limit: -1, remaining: Infinity };
  }

  const remaining = Math.max(0, limit - current);
  const allowed = current + requestedAmount <= limit;

  return { allowed, current, limit, remaining };
}

export function getCurrentPeriodMonth(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
