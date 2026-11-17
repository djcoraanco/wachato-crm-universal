import { getDb, schema } from "@/lib/db";
import { count } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const apiKey = req.headers.get("x-agency-api-key") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const expectedKey = process.env.AGENCY_API_KEY || process.env.BOT_API_KEY;

  if (expectedKey && apiKey !== expectedKey) {
    return new Response(
      JSON.stringify({ error: { code: "unauthorized", message: "API Key de agencia inválida o ausente" } }),
      { status: 401, headers: { "content-type": "application/json" } }
    );
  }

  try {
    const db = getDb();
    const [cCount, ctCount, msgCount, modCount] = await Promise.all([
      db.select({ val: count() }).from(schema.conversation),
      db.select({ val: count() }).from(schema.contact),
      db.select({ val: count() }).from(schema.message),
      db.select({ val: count() }).from(schema.moduleInstallation),
    ]);

    const mem = process.memoryUsage();

    return Response.json({
      status: "healthy",
      service: "Wachato CRM Universal",
      version: "2.0.0",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: "connected",
      telemetry: {
        conversations: cCount[0]?.val ?? 0,
        contacts: ctCount[0]?.val ?? 0,
        messages: msgCount[0]?.val ?? 0,
        installedModules: modCount[0]?.val ?? 0,
      },
      system: {
        rssBytes: mem.rss,
        heapUsedBytes: mem.heapUsed,
        heapTotalBytes: mem.heapTotal,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return new Response(
      JSON.stringify({ status: "unhealthy", error: msg }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
