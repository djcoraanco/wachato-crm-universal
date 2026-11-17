import { gzipSync } from "node:zlib";
import { getDb, schema } from "@/lib/db";
import { scoped } from "@/lib/db/tenant";

export type BackupSummary = {
  organizationId: string;
  timestamp: string;
  version: string;
  counts: Record<string, number>;
};

export async function createOrganizationBackup(organizationId: string): Promise<{
  filename: string;
  buffer: Buffer;
  summary: BackupSummary;
}> {
  const db = getDb();

  const [
    contacts,
    conversations,
    messages,
    leads,
    deals,
    bookings,
    agentProf,
    modules,
  ] = await Promise.all([
    db.select().from(schema.contact).where(scoped(schema.contact.organizationId, organizationId)),
    db.select().from(schema.conversation).where(scoped(schema.conversation.organizationId, organizationId)),
    db.select().from(schema.message).where(scoped(schema.message.organizationId, organizationId)),
    db.select().from(schema.lead).where(scoped(schema.lead.organizationId, organizationId)),
    db.select().from(schema.deal).where(scoped(schema.deal.organizationId, organizationId)),
    db.select().from(schema.booking).where(scoped(schema.booking.organizationId, organizationId)),
    db.select().from(schema.agentProfile).where(scoped(schema.agentProfile.organizationId, organizationId)),
    db.select().from(schema.moduleInstallation).where(scoped(schema.moduleInstallation.organizationId, organizationId)),
  ]);

  const summary: BackupSummary = {
    organizationId,
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    counts: {
      contacts: contacts.length,
      conversations: conversations.length,
      messages: messages.length,
      leads: leads.length,
      deals: deals.length,
      bookings: bookings.length,
      agentProfiles: agentProf.length,
      modules: modules.length,
    },
  };

  const payload = {
    metadata: summary,
    data: {
      contacts,
      conversations,
      messages,
      leads,
      deals,
      bookings,
      agentProfile: agentProf[0] ?? null,
      modules,
    },
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const compressed = gzipSync(Buffer.from(jsonString, "utf-8"));
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `wachato-backup-${organizationId}-${dateStr}.json.gz`;

  return {
    filename,
    buffer: compressed,
    summary,
  };
}
