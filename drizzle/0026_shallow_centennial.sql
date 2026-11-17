CREATE TABLE "company" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"tax_id" text,
	"phone" text,
	"email" text,
	"website" text,
	"address" text,
	"industry" text,
	"parent_id" text,
	"notes" text,
	"custom_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_contact" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"company_id" text NOT NULL,
	"contact_id" text NOT NULL,
	"role" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_task" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"contact_id" text,
	"deal_id" text,
	"assigned_to" text,
	"title" text NOT NULL,
	"description" text,
	"activity_type" text DEFAULT 'tarea' NOT NULL,
	"due_date" timestamp,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_field" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"target_entity" text NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"field_type" text NOT NULL,
	"options" jsonb,
	"required" boolean DEFAULT false NOT NULL,
	"default_value" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_field_value" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"field_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"value" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deal" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"pipeline_id" text,
	"stage_id" text NOT NULL,
	"contact_id" text,
	"company_id" text,
	"title" text NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'DOP' NOT NULL,
	"priority" text DEFAULT 'media' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"expected_close_date" timestamp,
	"capi_event" text,
	"custom_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "contact" ADD COLUMN "doc_id" text;--> statement-breakpoint
ALTER TABLE "contact" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "contact" ADD COLUMN "phones" jsonb;--> statement-breakpoint
ALTER TABLE "contact" ADD COLUMN "emails" jsonb;--> statement-breakpoint
ALTER TABLE "contact" ADD COLUMN "avatar" text;--> statement-breakpoint
ALTER TABLE "contact" ADD COLUMN "birthdate" timestamp;--> statement-breakpoint
ALTER TABLE "contact" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "contact" ADD COLUMN "preferred_channel" text;--> statement-breakpoint
ALTER TABLE "contact" ADD COLUMN "tags" jsonb;--> statement-breakpoint
ALTER TABLE "contact" ADD COLUMN "privacy_consent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "contact" ADD COLUMN "custom_data" jsonb;--> statement-breakpoint
ALTER TABLE "pipeline_stage" ADD COLUMN "pipeline_id" text;--> statement-breakpoint
ALTER TABLE "pipeline_stage" ADD COLUMN "capi_event" text;--> statement-breakpoint
ALTER TABLE "company" ADD CONSTRAINT "company_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_contact" ADD CONSTRAINT "company_contact_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_contact" ADD CONSTRAINT "company_contact_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_contact" ADD CONSTRAINT "company_contact_contact_id_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_task" ADD CONSTRAINT "crm_task_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_task" ADD CONSTRAINT "crm_task_contact_id_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_task" ADD CONSTRAINT "crm_task_deal_id_deal_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_task" ADD CONSTRAINT "crm_task_assigned_to_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field" ADD CONSTRAINT "custom_field_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_value" ADD CONSTRAINT "custom_field_value_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_value" ADD CONSTRAINT "custom_field_value_field_id_custom_field_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."custom_field"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal" ADD CONSTRAINT "deal_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal" ADD CONSTRAINT "deal_pipeline_id_pipeline_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipeline"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal" ADD CONSTRAINT "deal_stage_id_pipeline_stage_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."pipeline_stage"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal" ADD CONSTRAINT "deal_contact_id_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contact"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal" ADD CONSTRAINT "deal_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline" ADD CONSTRAINT "pipeline_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "company_org_idx" ON "company" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "company_org_name_idx" ON "company" USING btree ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "company_contact_uq" ON "company_contact" USING btree ("organization_id","company_id","contact_id");--> statement-breakpoint
CREATE INDEX "company_contact_org_company_idx" ON "company_contact" USING btree ("organization_id","company_id");--> statement-breakpoint
CREATE INDEX "company_contact_org_contact_idx" ON "company_contact" USING btree ("organization_id","contact_id");--> statement-breakpoint
CREATE INDEX "crm_task_org_contact_idx" ON "crm_task" USING btree ("organization_id","contact_id");--> statement-breakpoint
CREATE INDEX "crm_task_org_deal_idx" ON "crm_task" USING btree ("organization_id","deal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "custom_field_org_target_key_uq" ON "custom_field" USING btree ("organization_id","target_entity","key");--> statement-breakpoint
CREATE INDEX "custom_field_org_target_idx" ON "custom_field" USING btree ("organization_id","target_entity");--> statement-breakpoint
CREATE UNIQUE INDEX "custom_field_value_org_entity_field_uq" ON "custom_field_value" USING btree ("organization_id","entity_id","field_id");--> statement-breakpoint
CREATE INDEX "custom_field_value_org_entity_idx" ON "custom_field_value" USING btree ("organization_id","entity_id");--> statement-breakpoint
CREATE INDEX "deal_org_stage_idx" ON "deal" USING btree ("organization_id","stage_id");--> statement-breakpoint
CREATE INDEX "deal_org_contact_idx" ON "deal" USING btree ("organization_id","contact_id");--> statement-breakpoint
CREATE INDEX "deal_org_company_idx" ON "deal" USING btree ("organization_id","company_id");--> statement-breakpoint
CREATE INDEX "pipeline_org_idx" ON "pipeline" USING btree ("organization_id");