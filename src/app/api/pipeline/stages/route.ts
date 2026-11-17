import { asc, sql } from "drizzle-orm";
import { z } from "zod";
import { parseBody, withAuth } from "@/lib/api";
import { getDb, schema } from "@/lib/db";
import { newId } from "@/lib/db/ids";
import { scoped } from "@/lib/db/tenant";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (session) => {
  const db = getDb();
  const stages = await db
    .select()
    .from(schema.pipelineStage)
    .where(scoped(schema.pipelineStage.organizationId, session.organizationId))
    .orderBy(asc(schema.pipelineStage.position));
  return Response.json({ stages });
});

const createSchema = z.object({
  name: z.string().trim().min(1).max(60),
});

export const POST = withAuth(async (session, req: Request) => {
  const body = await parseBody(req, createSchema);
  if (!body.ok) return body.response;

  const db = getDb();
  const maxPos = await db
    .select({
      max: sql<number>`coalesce(max(${schema.pipelineStage.position}), -1)`,
    })
    .from(schema.pipelineStage)
    .where(scoped(schema.pipelineStage.organizationId, session.organizationId));

  const inserted = await db
    .insert(schema.pipelineStage)
    .values({
      id: newId("stage"),
      organizationId: session.organizationId,
      name: body.data.name,
      position: (maxPos[0]?.max ?? -1) + 1,
      kind: "open",
    })
    .returning();
  return Response.json({ stage: inserted[0] }, { status: 201 });
});

const patchStageSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(60).optional(),
  capiEvent: z
    .enum(["", "Lead", "Contact", "Schedule", "SubmitApplication", "InitiateCheckout", "Purchase"])
    .optional(),
  position: z.number().int().min(0).optional(),
});

export const PATCH = withAuth(async (session, req: Request) => {
  const body = await parseBody(req, patchStageSchema);
  if (!body.ok) return body.response;

  const db = getDb();
  const updates: Record<string, unknown> = {};
  if (body.data.name !== undefined) updates.name = body.data.name;
  if (body.data.capiEvent !== undefined) updates.capiEvent = body.data.capiEvent;
  if (body.data.position !== undefined) updates.position = body.data.position;

  const updated = await db
    .update(schema.pipelineStage)
    .set(updates)
    .where(
      scoped(
        schema.pipelineStage.organizationId,
        session.organizationId,
        sql`${schema.pipelineStage.id} = ${body.data.id}`
      )
    )
    .returning();

  return Response.json({ stage: updated[0] });
});
