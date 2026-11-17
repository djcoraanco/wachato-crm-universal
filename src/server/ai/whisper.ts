import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { readMediaFile } from "@/server/whatsapp/media";
import { publish } from "@/server/events/bus";

/**
 * Transcribe un archivo de audio (nota de voz o audio entrante) usando Whisper
 * a través de un endpoint compatible con OpenAI / Groq.
 */
export async function transcribeAudio(
  data: Buffer | Uint8Array,
  mimeType: string,
  filename = "audio.ogg"
): Promise<string | null> {
  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const apiKey = groqKey || openaiKey;
  if (!apiKey) return null;

  const endpoint = groqKey
    ? "https://api.groq.com/openai/v1/audio/transcriptions"
    : "https://api.openai.com/v1/audio/transcriptions";

  const model = groqKey ? "whisper-large-v3-turbo" : "whisper-1";

  try {
    const blob = new Blob([data as unknown as BlobPart], { type: mimeType });
    const formData = new FormData();
    formData.append("file", blob, filename);
    formData.append("model", model);
    formData.append("language", "es");

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(`[whisper] error al transcribir (${res.status}):`, errText);
      return null;
    }

    const json = (await res.json()) as { text?: string };
    const text = json.text?.trim();
    return text || null;
  } catch (err) {
    console.warn("[whisper] excepción durante la transcripción:", err);
    return null;
  }
}

/**
 * Procesa la transcripción de un mensaje de audio entrante cuando su asset
 * esté disponible y actualiza el texto del mensaje para que el agente y la UI
 * lo tengan de inmediato.
 */
export async function transcribeMessageAudio(
  organizationId: string,
  messageId: string,
  assetId: string
): Promise<string | null> {
  try {
    const db = getDb();
    const data = await readMediaFile(organizationId, assetId);
    if (!data) return null;

    const [msgRow] = await db
      .select({ message: schema.message, asset: schema.mediaAsset })
      .from(schema.message)
      .leftJoin(schema.mediaAsset, eq(schema.message.mediaAssetId, schema.mediaAsset.id))
      .where(eq(schema.message.id, messageId))
      .limit(1);

    if (!msgRow) return null;

    const mime = msgRow.asset?.mimeType || "audio/ogg";
    const filename = msgRow.asset?.fileName || "audio.ogg";

    const text = await transcribeAudio(data, mime, filename);
    if (!text) return null;

    const formattedText = `[Nota de voz transcrita]: "${text}"`;

    await db
      .update(schema.message)
      .set({ text: formattedText })
      .where(eq(schema.message.id, messageId));

    publish(organizationId, {
      type: "conversation.updated",
      data: {
        conversation: {
          id: msgRow.message.conversationId,
        },
      },
    });

    return formattedText;
  } catch (err) {
    console.warn("[whisper] no se pudo transcribir el mensaje:", err);
    return null;
  }
}
