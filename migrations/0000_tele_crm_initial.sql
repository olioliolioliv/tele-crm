CREATE TYPE "public"."direction" AS ENUM('INBOUND', 'OUTBOUND');--> statement-breakpoint
CREATE TYPE "public"."flag_type" AS ENUM('GOOD_EXAMPLE', 'NEEDS_REVIEW', 'BAD_RESPONSE');--> statement-breakpoint
CREATE TYPE "public"."presence_status" AS ENUM('ONLINE', 'AWAY', 'OFFLINE');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('OWNER', 'MANAGER', 'CHATTER');--> statement-breakpoint
CREATE TYPE "public"."thread_status" AS ENUM('OPEN', 'CLOSED', 'SNOOZED');--> statement-breakpoint
CREATE TYPE "public"."vault_kind" AS ENUM('IMAGE', 'VIDEO', 'AUDIO');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activity_event" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"member_id" text,
	"type" text NOT NULL,
	"payload" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assignment_rule" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"priority" bigint NOT NULL,
	"match_json" text NOT NULL,
	"assign_to" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chatter_presence" (
	"member_id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"status" "presence_status" DEFAULT 'OFFLINE' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "creator" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"display_name" text NOT NULL,
	"telegram_handle" text,
	"tgm_bot_account_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fan" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"telegram_user_id" text NOT NULL,
	"display_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "member" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"role" "role" DEFAULT 'CHATTER' NOT NULL,
	"display_name" text,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "message_flag" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"message_id" text NOT NULL,
	"flagged_by" text NOT NULL,
	"flag_type" "flag_type" NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "message" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"direction" "direction" NOT NULL,
	"content" text NOT NULL,
	"attachments" text,
	"sent_by_member_id" text,
	"external_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"billing_ref" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "script" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"content" text NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"internal_note" text,
	"media_ids" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "script_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"script_id" text NOT NULL,
	"thread_id" text NOT NULL,
	"sent_by_member_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "thread" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"creator_id" text NOT NULL,
	"fan_id" text NOT NULL,
	"status" "thread_status" DEFAULT 'OPEN' NOT NULL,
	"assigned_member_id" text,
	"last_message_at" timestamp,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vault_item" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"creator_id" text NOT NULL,
	"kind" "vault_kind" NOT NULL,
	"r2_key" text NOT NULL,
	"filename" text NOT NULL,
	"thumbnail_r2_key" text,
	"size_bytes" bigint,
	"width" bigint,
	"height" bigint,
	"duration_ms" bigint,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vault_send" (
	"id" text PRIMARY KEY NOT NULL,
	"vault_item_id" text NOT NULL,
	"thread_id" text NOT NULL,
	"fan_id" text NOT NULL,
	"message_id" text,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activity_event" ADD CONSTRAINT "activity_event_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activity_event" ADD CONSTRAINT "activity_event_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assignment_rule" ADD CONSTRAINT "assignment_rule_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chatter_presence" ADD CONSTRAINT "chatter_presence_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chatter_presence" ADD CONSTRAINT "chatter_presence_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "creator" ADD CONSTRAINT "creator_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fan" ADD CONSTRAINT "fan_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message_flag" ADD CONSTRAINT "message_flag_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message_flag" ADD CONSTRAINT "message_flag_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message_flag" ADD CONSTRAINT "message_flag_flagged_by_member_id_fk" FOREIGN KEY ("flagged_by") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message" ADD CONSTRAINT "message_thread_id_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."thread"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message" ADD CONSTRAINT "message_sent_by_member_id_member_id_fk" FOREIGN KEY ("sent_by_member_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "script" ADD CONSTRAINT "script_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "script" ADD CONSTRAINT "script_created_by_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "script_usage" ADD CONSTRAINT "script_usage_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "script_usage" ADD CONSTRAINT "script_usage_script_id_script_id_fk" FOREIGN KEY ("script_id") REFERENCES "public"."script"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "script_usage" ADD CONSTRAINT "script_usage_thread_id_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."thread"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "script_usage" ADD CONSTRAINT "script_usage_sent_by_member_id_member_id_fk" FOREIGN KEY ("sent_by_member_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "thread" ADD CONSTRAINT "thread_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "thread" ADD CONSTRAINT "thread_creator_id_creator_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creator"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "thread" ADD CONSTRAINT "thread_fan_id_fan_id_fk" FOREIGN KEY ("fan_id") REFERENCES "public"."fan"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "thread" ADD CONSTRAINT "thread_assigned_member_id_member_id_fk" FOREIGN KEY ("assigned_member_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vault_item" ADD CONSTRAINT "vault_item_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vault_item" ADD CONSTRAINT "vault_item_creator_id_creator_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creator"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vault_item" ADD CONSTRAINT "vault_item_uploaded_by_member_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vault_send" ADD CONSTRAINT "vault_send_vault_item_id_vault_item_id_fk" FOREIGN KEY ("vault_item_id") REFERENCES "public"."vault_item"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vault_send" ADD CONSTRAINT "vault_send_thread_id_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."thread"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vault_send" ADD CONSTRAINT "vault_send_fan_id_fan_id_fk" FOREIGN KEY ("fan_id") REFERENCES "public"."fan"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vault_send" ADD CONSTRAINT "vault_send_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_org_created_idx" ON "activity_event" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rule_org_priority_idx" ON "assignment_rule" USING btree ("organization_id","priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "creator_org_id_idx" ON "creator" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fan_org_telegram_user_idx" ON "fan" USING btree ("organization_id","telegram_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "member_org_id_idx" ON "member" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "member_user_org_unique_idx" ON "member" USING btree ("clerk_user_id","organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "flag_org_type_created_idx" ON "message_flag" USING btree ("organization_id","flag_type","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_thread_idx" ON "message" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "message_external_id_unique" ON "message" USING btree ("external_id") WHERE "message"."external_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "script_org_name_idx" ON "script" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "script_usage_script_idx" ON "script_usage" USING btree ("organization_id","script_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "script_usage_thread_idx" ON "script_usage" USING btree ("thread_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "thread_creator_fan_idx" ON "thread" USING btree ("creator_id","fan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thread_org_last_message_idx" ON "thread" USING btree ("organization_id","last_message_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vault_org_creator_idx" ON "vault_item" USING btree ("organization_id","creator_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "vault_send_item_fan_unique" ON "vault_send" USING btree ("vault_item_id","fan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vault_send_thread_idx" ON "vault_send" USING btree ("thread_id");