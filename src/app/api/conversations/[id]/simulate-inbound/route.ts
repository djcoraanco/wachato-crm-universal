import { z } from "zod";
import { apiError, parseBody, withAuth } from "@/lib/api";
import { newId } from "@/lib/db/ids";
import { getConversation } from "@/server/inbox/queries";
import { ingestInboundMessage } from "@/server/inbox/ingest";

export const dynamic = "force-dynamic";

const schema = z.object({
  text: z.string().min(1, "El texto es obligatorio").max(4096),
});

type Params = { params: Promise<{ id: string }> };

export const POST = withAuth(async (session, req: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const body = await parseBody(req, schema);
  if (!body.ok) return body.response;

  const row = await getConversation(session.organizationId, id);
  if (!row) {
    return apiError(404, "not_found", "Conversación no encontrada");
  }

  const { contact } = row;
  const identityKey = contact.waIdentity ?? contact.phone ?? id;
  const waUserId = contact.waIdentity?.startsWith("bsuid:")
    ? contact.waIdentity.replace("bsuid:", "")
    : null;

  const waMessageId = `sim_${newId("message")}`;

  await ingestInboundMessage({
    organizationId: session.organizationId,
    identity: {
      identity: identityKey,
      phone: contact.phone,
      waUserId,
      profileName: contact.name,
    },
    waMessageId,
    type: "text",
    text: body.data.text.trim(),
    timestamp: String(Math.floor(Date.now() / 1000)),
  });

  return Response.json({ ok: true, waMessageId });
});
