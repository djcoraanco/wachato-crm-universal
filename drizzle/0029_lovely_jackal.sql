CREATE TABLE "agency" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"subdomain" text,
	"custom_domain" text,
	"owner_user_id" text NOT NULL,
	"branding" jsonb,
	"stripe_customer_id" text,
	"paypal_payer_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agency_slug_unique" UNIQUE("slug"),
	CONSTRAINT "agency_subdomain_unique" UNIQUE("subdomain"),
	CONSTRAINT "agency_custom_domain_unique" UNIQUE("custom_domain")
);
--> statement-breakpoint
CREATE TABLE "agency_member" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'agency_member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "landing_content" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text,
	"hero" jsonb NOT NULL,
	"features" jsonb NOT NULL,
	"pricing" jsonb NOT NULL,
	"testimonials" jsonb NOT NULL,
	"faq" jsonb NOT NULL,
	"theme" jsonb NOT NULL,
	"seo" jsonb NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"tier" text DEFAULT 'starter' NOT NULL,
	"description" text,
	"price_monthly_usd" integer DEFAULT 0 NOT NULL,
	"price_yearly_usd" integer DEFAULT 0 NOT NULL,
	"stripe_price_id_monthly" text,
	"stripe_price_id_yearly" text,
	"stripe_product_id" text,
	"paypal_plan_id_monthly" text,
	"paypal_plan_id_yearly" text,
	"limits" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plan_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text,
	"organization_id" text,
	"plan_id" text NOT NULL,
	"provider" text DEFAULT 'manual' NOT NULL,
	"provider_subscription_id" text,
	"provider_customer_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"billing_interval" text DEFAULT 'monthly' NOT NULL,
	"current_period_start" timestamp DEFAULT now() NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"canceled_at" timestamp,
	"trial_end" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_quota" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"period_month" text NOT NULL,
	"ai_tokens_used" integer DEFAULT 0 NOT NULL,
	"messages_sent" integer DEFAULT 0 NOT NULL,
	"media_storage_bytes" integer DEFAULT 0 NOT NULL,
	"contacts_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "agency_id" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "plan_id" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "is_agency_client" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "custom_domain" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "platform_role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "agency" ADD CONSTRAINT "agency_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_member" ADD CONSTRAINT "agency_member_agency_id_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agency"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_member" ADD CONSTRAINT "agency_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_content" ADD CONSTRAINT "landing_content_agency_id_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agency"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_agency_id_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agency"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_plan_id_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plan"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_quota" ADD CONSTRAINT "usage_quota_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agency_slug_idx" ON "agency" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "agency_subdomain_idx" ON "agency" USING btree ("subdomain");--> statement-breakpoint
CREATE INDEX "agency_owner_idx" ON "agency" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "agency_member_agency_idx" ON "agency_member" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "agency_member_user_idx" ON "agency_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "landing_content_agency_idx" ON "landing_content" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "plan_slug_idx" ON "plan" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "plan_active_order_idx" ON "plan" USING btree ("is_active","sort_order");--> statement-breakpoint
CREATE INDEX "subscription_agency_idx" ON "subscription" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "subscription_org_idx" ON "subscription" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "subscription_provider_sub_idx" ON "subscription" USING btree ("provider_subscription_id");--> statement-breakpoint
CREATE INDEX "subscription_status_idx" ON "subscription" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_quota_org_period_idx" ON "usage_quota" USING btree ("organization_id","period_month");--> statement-breakpoint
CREATE INDEX "usage_quota_period_idx" ON "usage_quota" USING btree ("period_month");--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_agency_id_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agency"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_plan_id_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "organization_agency_idx" ON "organization" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "organization_plan_idx" ON "organization" USING btree ("plan_id");