import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { newId } from "@/lib/db/ids";
import { getPlanBySlug, upsertSubscription } from "@/server/billing/service";
import type { BillingInterval, SubscriptionStatus } from "@/lib/billing/types";

export type AdminSaaSMetrics = {
  mrrUsd: number;
  arrUsd: number;
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  totalContacts: number;
  totalAiTokensMonthly: number;
  subscriptionsByTier: {
    starter: number;
    growth: number;
    pro: number;
    agency: number;
  };
  gatewaysStatus: {
    stripeConfigured: boolean;
    paypalConfigured: boolean;
    metaAppConfigured: boolean;
  };
};

export type AdminOrganizationItem = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  ownerName: string | null;
  ownerEmail: string | null;
  planName: string;
  planSlug: string;
  planTier: string;
  subscriptionStatus: SubscriptionStatus;
  billingInterval: BillingInterval;
  contactsCount: number;
  teamMembersCount: number;
  aiTokensCount: number;
  agencyName: string | null;
};

/**
 * Calcula las métricas globales del SaaS para el Super Admin.
 */
export async function getSaaSSummaryMetrics(): Promise<AdminSaaSMetrics> {
  const db = getDb();

  // 1. Organizaciones totales
  const orgCountRes = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.organization);
  const totalOrganizations = orgCountRes[0]?.count ?? 0;

  // 2. Usuarios totales
  const userCountRes = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.user);
  const totalUsers = userCountRes[0]?.count ?? 0;

  // 3. Contactos totales
  const contactCountRes = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.contact);
  const totalContacts = contactCountRes[0]?.count ?? 0;

  // 4. Suscripciones activas y cálculo de MRR / ARR
  const activeSubs = await db
    .select({
      sub: schema.subscription,
      plan: schema.plan,
    })
    .from(schema.subscription)
    .innerJoin(schema.plan, eq(schema.subscription.planId, schema.plan.id))
    .where(eq(schema.subscription.status, "active"));

  let mrrUsd = 0;
  const subscriptionsByTier = {
    starter: 0,
    growth: 0,
    pro: 0,
    agency: 0,
  };

  for (const { sub, plan } of activeSubs) {
    if (sub.billingInterval === "yearly") {
      mrrUsd += Math.round(plan.priceYearlyUsd / 12);
    } else {
      mrrUsd += plan.priceMonthlyUsd;
    }

    const tier = plan.tier as keyof typeof subscriptionsByTier;
    if (tier in subscriptionsByTier) {
      subscriptionsByTier[tier]++;
    }
  }

  // 5. Consumo total de tokens IA en el ciclo actual
  const currentMonth = new Date().toISOString().slice(0, 7);
  const tokenRes = await db
    .select({ totalTokens: sql<number>`coalesce(sum(${schema.usageQuota.aiTokensUsed}), 0)::int` })
    .from(schema.usageQuota)
    .where(eq(schema.usageQuota.periodMonth, currentMonth));
  const totalAiTokensMonthly = tokenRes[0]?.totalTokens ?? 0;

  // 6. Pasarelas
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  const paypalConfigured = Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
  const metaAppConfigured = Boolean(process.env.META_APP_ID);

  return {
    mrrUsd,
    arrUsd: mrrUsd * 12,
    totalOrganizations,
    activeOrganizations: totalOrganizations, // Todas activas por defecto
    totalUsers,
    totalContacts,
    totalAiTokensMonthly,
    subscriptionsByTier,
    gatewaysStatus: {
      stripeConfigured,
      paypalConfigured,
      metaAppConfigured,
    },
  };
}

/**
 * Obtiene el listado de organizaciones para el panel de administración.
 */
export async function getAdminOrganizationsList(opts: {
  search?: string;
  planFilter?: string;
  limit?: number;
  offset?: number;
}): Promise<{ organizations: AdminOrganizationItem[]; total: number }> {
  const db = getDb();
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  // Consulta enriquecida de organizaciones
  const query = db
    .select({
      id: schema.organization.id,
      name: schema.organization.name,
      slug: schema.organization.slug,
      createdAt: schema.organization.createdAt,
      agencyId: schema.organization.agencyId,
    })
    .from(schema.organization)
    .orderBy(desc(schema.organization.createdAt))
    .limit(limit)
    .offset(offset);

  if (opts.search && opts.search.trim().length > 0) {
    query.where(ilike(schema.organization.name, `%${opts.search.trim()}%`));
  }

  const rows = await query;
  const currentMonth = new Date().toISOString().slice(0, 7);

  const result: AdminOrganizationItem[] = [];

  for (const row of rows) {
    // 1. Obtener dueño / primer miembro
    const ownerRes = await db
      .select({
        userName: schema.user.name,
        userEmail: schema.user.email,
      })
      .from(schema.member)
      .innerJoin(schema.user, eq(schema.member.userId, schema.user.id))
      .where(and(eq(schema.member.organizationId, row.id), eq(schema.member.role, "owner")))
      .limit(1);

    // 2. Suscripción y plan
    const subRes = await db
      .select({
        sub: schema.subscription,
        plan: schema.plan,
      })
      .from(schema.subscription)
      .innerJoin(schema.plan, eq(schema.subscription.planId, schema.plan.id))
      .where(eq(schema.subscription.organizationId, row.id))
      .orderBy(desc(schema.subscription.createdAt))
      .limit(1);

    // 3. Cuotas de contactos y tokens
    const quotaRes = await db
      .select()
      .from(schema.usageQuota)
      .where(
        and(
          eq(schema.usageQuota.organizationId, row.id),
          eq(schema.usageQuota.periodMonth, currentMonth)
        )
      )
      .limit(1);

    // 4. Conteo de miembros
    const memberCountRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.member)
      .where(eq(schema.member.organizationId, row.id));

    // 5. Nombre de agencia nodriza si existe
    let agencyName: string | null = null;
    if (row.agencyId) {
      const agRes = await db
        .select({ name: schema.agency.name })
        .from(schema.agency)
        .where(eq(schema.agency.id, row.agencyId))
        .limit(1);
      agencyName = agRes[0]?.name ?? null;
    }

    const sub = subRes[0]?.sub;
    const plan = subRes[0]?.plan;

    result.push({
      id: row.id,
      name: row.name,
      slug: row.slug ?? row.id,
      createdAt: row.createdAt.toISOString(),
      ownerName: ownerRes[0]?.userName ?? null,
      ownerEmail: ownerRes[0]?.userEmail ?? null,
      planName: plan?.name ?? "Starter Free",
      planSlug: plan?.slug ?? "starter",
      planTier: plan?.tier ?? "starter",
      subscriptionStatus: sub?.status ?? "active",
      billingInterval: sub?.billingInterval ?? "monthly",
      contactsCount: quotaRes[0]?.contactsCount ?? 0,
      teamMembersCount: memberCountRes[0]?.count ?? 1,
      aiTokensCount: quotaRes[0]?.aiTokensUsed ?? 0,
      agencyName,
    });
  }

  // Conteo total para paginación
  const countRes = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.organization);

  return {
    organizations: result,
    total: countRes[0]?.count ?? 0,
  };
}

/**
 * Asigna o modifica directamente el plan de una organización desde el Super Admin.
 */
export async function updateOrganizationPlanAdmin(opts: {
  organizationId: string;
  planSlug: string;
  billingInterval?: BillingInterval;
}): Promise<void> {
  const plan = await getPlanBySlug(opts.planSlug);
  if (!plan) {
    throw new Error(`El plan '${opts.planSlug}' no existe`);
  }

  const interval = opts.billingInterval ?? "monthly";
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await upsertSubscription({
    organizationId: opts.organizationId,
    planId: plan.id,
    provider: "stripe",
    providerSubscriptionId: `admin_sub_${newId("subscription")}`,
    providerCustomerId: `admin_cust_${opts.organizationId}`,
    status: "active",
    billingInterval: interval,
    currentPeriodStart: now,
    currentPeriodEnd: nextMonth,
    metadata: {
      grantedByAdmin: true,
      updatedAt: now.toISOString(),
    },
  });
}

/**
 * Obtiene las suscripciones recientes para el log de transacciones del Super Admin.
 */
export async function getAdminRecentSubscriptions(limit = 30) {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.subscription.id,
      organizationId: schema.subscription.organizationId,
      agencyId: schema.subscription.agencyId,
      planName: schema.plan.name,
      planSlug: schema.plan.slug,
      provider: schema.subscription.provider,
      providerSubscriptionId: schema.subscription.providerSubscriptionId,
      status: schema.subscription.status,
      billingInterval: schema.subscription.billingInterval,
      currentPeriodEnd: schema.subscription.currentPeriodEnd,
      createdAt: schema.subscription.createdAt,
    })
    .from(schema.subscription)
    .innerJoin(schema.plan, eq(schema.subscription.planId, schema.plan.id))
    .orderBy(desc(schema.subscription.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    currentPeriodEnd: r.currentPeriodEnd.toISOString(),
  }));
}
