import { and, eq, lte } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { newId } from "@/lib/db/ids";
import { isWindowOpen } from "@/server/inbox/window";
import { sendText } from "@/server/inbox/send";
import { moveLeadToStage } from "@/server/leads/stage-history";

export type AutomationStep = {
  type: "send_message" | "send_template" | "move_stage" | "add_tags" | "wait";
  params: Record<string, unknown>;
};

export type AutomationDefinition = {
  id: string;
  name: string;
  trigger: string;
  steps: AutomationStep[];
  active: boolean;
};

/**
 * Runner transaccional seguro respaldado en PostgreSQL usando SKIP LOCKED
 * para evitar duplicación de tareas y race conditions sin necesidad de Redis.
 */
export async function claimNextPendingJob(workerId = "worker-1") {
  const db = getDb();
  const now = new Date();

  const [job] = await db
    .select()
    .from(schema.automationJob)
    .where(
      and(
        eq(schema.automationJob.status, "pending"),
        lte(schema.automationJob.runAt, now)
      )
    )
    .limit(1)
    .for("update", { skipLocked: true });

  if (!job) return null;

  const [updated] = await db
    .update(schema.automationJob)
    .set({
      status: "processing",
      lockedAt: now,
      lockedBy: workerId,
      attempts: job.attempts + 1,
      updatedAt: now,
    })
    .where(eq(schema.automationJob.id, job.id))
    .returning();

  return updated ?? null;
}

export async function processJob(job: NonNullable<Awaited<ReturnType<typeof claimNextPendingJob>>>) {
  const db = getDb();
  const payload = (job.payload as Record<string, unknown>) || {};

  try {
    if (job.actionType === "send_message" && job.conversationId) {
      const text = String(payload.text || "");
      if (text) {
        // Verifica si la ventana está abierta antes de enviar texto libre
        const [conv] = await db
          .select()
          .from(schema.conversation)
          .where(eq(schema.conversation.id, job.conversationId))
          .limit(1);

        if (conv && isWindowOpen(conv.lastInboundAt)) {
          await sendText({
            organizationId: job.organizationId,
            conversationId: job.conversationId,
            text,
          });
        }
      }
    } else if (job.actionType === "move_stage" && job.contactId && payload.stageId) {
      // Busca el lead asociado al contacto
      const [lead] = await db
        .select()
        .from(schema.lead)
        .where(
          and(
            eq(schema.lead.organizationId, job.organizationId),
            eq(schema.lead.contactId, job.contactId)
          )
        )
        .limit(1);

      if (lead) {
        await moveLeadToStage({
          organizationId: job.organizationId,
          leadId: lead.id,
          toStageId: String(payload.stageId),
          source: "sistema",
        });
      }
    }

    // Marca como completado
    await db
      .update(schema.automationJob)
      .set({
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(schema.automationJob.id, job.id));

    return true;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const hasMoreAttempts = job.attempts < job.maxAttempts;

    await db
      .update(schema.automationJob)
      .set({
        status: hasMoreAttempts ? "pending" : "failed",
        lastError: errorMsg,
        runAt: hasMoreAttempts ? new Date(Date.now() + 1000 * 60 * Math.pow(2, job.attempts)) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(schema.automationJob.id, job.id));

    return false;
  }
}

/**
 * Encola un nuevo trabajo de automatización diferido en PostgreSQL.
 */
export async function scheduleAutomationJob(params: {
  organizationId: string;
  automationId: string;
  conversationId?: string | null;
  contactId?: string | null;
  stepIndex?: number;
  actionType: string;
  payload: Record<string, unknown>;
  runAt?: Date;
}) {
  const db = getDb();
  const id = newId("automationJob");

  const [job] = await db
    .insert(schema.automationJob)
    .values({
      id,
      organizationId: params.organizationId,
      automationId: params.automationId,
      conversationId: params.conversationId ?? null,
      contactId: params.contactId ?? null,
      stepIndex: params.stepIndex ?? 0,
      actionType: params.actionType,
      payload: params.payload,
      status: "pending",
      runAt: params.runAt ?? new Date(),
    })
    .returning();

  return job;
}
