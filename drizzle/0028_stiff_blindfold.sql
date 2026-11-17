ALTER TABLE "agent_profile" ADD COLUMN "mode" text DEFAULT 'wachato' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_profile" ADD COLUMN "external_webhook_url" text;--> statement-breakpoint
ALTER TABLE "agent_profile" ADD COLUMN "external_secret" text;--> statement-breakpoint
ALTER TABLE "agent_profile" ADD COLUMN "handoff_rules" jsonb;--> statement-breakpoint
ALTER TABLE "agent_profile" ADD COLUMN "business_info" jsonb;