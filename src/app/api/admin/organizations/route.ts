import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth, apiError, parseBody } from "@/lib/api";
import { getAdminOrganizationsList } from "@/server/admin/service";
import { getDb, schema } from "@/lib/db";
import { newId } from "@/lib/db/ids";
import { getPlanBySlug } from "@/server/billing/service";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (session, req: NextRequest) => {
  if (session.role !== "owner" && session.role !== "admin" && session.role !== "superadmin") {
    return apiError(403, "forbidden", "Acceso restringido a administradores");
  }

  const url = new URL(req.url);
  const search = url.searchParams.get("search") ?? undefined;
  const limit = url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!, 10) : 50;
  const offset = url.searchParams.get("offset") ? parseInt(url.searchParams.get("offset")!, 10) : 0;

  try {
    const data = await getAdminOrganizationsList({ search, limit, offset });
    return Response.json(data);
  } catch (err) {
    console.error("[admin-organizations] Error listando organizaciones:", err);
    return apiError(500, "organizations_error", "Error listando organizaciones");
  }
});

const createOrgSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  slug: z.string().trim().min(2).max(50).regex(/^[a-z0-9-]+$/).optional(),
  planSlug: z.string().trim().default("pro"),
});

const SEED_STAGES: { name: string; kind: "open" | "won" | "lost" }[] = [
  { name: "Nuevo", kind: "open" },
  { name: "En conversación", kind: "open" },
  { name: "Interesado", kind: "open" },
  { name: "Cliente", kind: "won" },
  { name: "Perdido", kind: "lost" },
];

export const POST = withAuth(async (session, req: Request) => {
  if (session.role !== "owner" && session.role !== "admin" && session.role !== "superadmin") {
    return apiError(403, "forbidden", "Solo el SuperAdmin puede crear nuevas organizaciones desde este panel");
  }

  const body = await parseBody(req, createOrgSchema);
  if (!body.ok) return body.response;

  const db = getDb();
  const orgId = newId("organization");
  const rawSlug = body.data.slug || body.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const slug = rawSlug || `org-${Date.now().toString(36)}`;

  try {
    const planSlug = body.data.planSlug || "pro";
    const plan = (await getPlanBySlug(planSlug)) || (await getPlanBySlug("pro"));

    await db.transaction(async (tx) => {
      // 1. Crear organización
      await tx.insert(schema.organization).values({
        id: orgId,
        name: body.data.name,
        slug,
      });

      // 2. Asociar al superadmin como owner
      await tx.insert(schema.member).values({
        id: newId("member"),
        organizationId: orgId,
        userId: session.userId,
        role: "owner",
      });

      // 3. Sembrar etapas de pipeline
      await tx.insert(schema.pipelineStage).values(
        SEED_STAGES.map((s, i) => ({
          id: newId("stage"),
          organizationId: orgId,
          name: s.name,
          position: i,
          kind: s.kind,
        }))
      );

      // 4. Sembrar perfil de agente
      await tx.insert(schema.agentProfile).values({
        id: newId("agentProfile"),
        organizationId: orgId,
      });

      // 5. Asignar suscripción inicial si hay plan disponible
      if (plan) {
        const now = new Date();
        const nextYear = new Date();
        nextYear.setFullYear(now.getFullYear() + 1);

        await tx.insert(schema.subscription).values({
          id: newId("subscription"),
          organizationId: orgId,
          planId: plan.id,
          provider: "manual",
          providerSubscriptionId: `sub_admin_${Date.now().toString(36)}`,
          status: "active",
          billingInterval: "monthly",
          currentPeriodStart: now,
          currentPeriodEnd: nextYear,
        });
      }
    });

    return Response.json({
      ok: true,
      organization: {
        id: orgId,
        name: body.data.name,
        slug,
        planName: plan?.name ?? "Pro Negocios",
      },
    });
  } catch (err) {
    console.error("[admin-create-org] Error:", err);
    const message = err instanceof Error ? err.message : "Error al crear la organización";
    return apiError(400, "org_create_failed", message);
  }
});
