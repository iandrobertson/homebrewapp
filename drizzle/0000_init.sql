CREATE TYPE "public"."units_preference" AS ENUM('us', 'metric');--> statement-breakpoint
CREATE TYPE "public"."share_permission" AS ENUM('view', 'edit');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('signup','consent_granted','login','recipe_shared','share_revoked','export_requested','erasure_requested');--> statement-breakpoint
CREATE TABLE "chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"region" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX "chapters_slug_key" ON "chapters" USING btree ("slug");--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"chapter_id" uuid NOT NULL,
	"units_preference" "units_preference" DEFAULT 'us' NOT NULL,
	"terms_accepted_at" timestamp with time zone NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_chapter_id_idx" ON "users" USING btree ("chapter_id");--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");--> statement-breakpoint
CREATE TABLE "styles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bjcp_code" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"og_min" numeric(5, 3),
	"og_max" numeric(5, 3),
	"fg_min" numeric(5, 3),
	"fg_max" numeric(5, 3),
	"ibu_min" integer,
	"ibu_max" integer,
	"srm_min" numeric(4, 1),
	"srm_max" numeric(4, 1),
	"abv_min" numeric(4, 2),
	"abv_max" numeric(4, 2)
);--> statement-breakpoint
CREATE UNIQUE INDEX "styles_bjcp_code_key" ON "styles" USING btree ("bjcp_code");--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chapter_id" uuid NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"style_id" uuid,
	"style_freetext" text,
	"batch_size_liters" numeric(8, 3) NOT NULL,
	"original_gravity" numeric(5, 3),
	"final_gravity" numeric(5, 3),
	"abv_override" numeric(5, 2),
	"abv_calculated" numeric(5, 2) GENERATED ALWAYS AS (
  CASE
    WHEN original_gravity IS NULL OR final_gravity IS NULL THEN NULL
    ELSE round(((original_gravity - final_gravity) * 131.25)::numeric, 2)
  END
) STORED,
	"ibu" integer,
	"color_srm" numeric(4, 1),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recipes_og_range" CHECK ("recipes"."original_gravity" IS NULL OR ("recipes"."original_gravity" >= 0.990 AND "recipes"."original_gravity" <= 1.200)),
	CONSTRAINT "recipes_fg_range" CHECK ("recipes"."final_gravity" IS NULL OR ("recipes"."final_gravity" >= 0.980 AND "recipes"."final_gravity" <= 1.200)),
	CONSTRAINT "recipes_abv_override_range" CHECK ("recipes"."abv_override" IS NULL OR ("recipes"."abv_override" >= 0 AND "recipes"."abv_override" <= 100)),
	CONSTRAINT "recipes_ibu_range" CHECK ("recipes"."ibu" IS NULL OR ("recipes"."ibu" >= 0 AND "recipes"."ibu" <= 200)),
	CONSTRAINT "recipes_srm_range" CHECK ("recipes"."color_srm" IS NULL OR ("recipes"."color_srm" >= 0 AND "recipes"."color_srm" <= 100)),
	CONSTRAINT "recipes_batch_size_positive" CHECK ("recipes"."batch_size_liters" > 0),
	CONSTRAINT "recipes_name_not_blank" CHECK (length(btrim("recipes"."name")) > 0)
);--> statement-breakpoint
CREATE INDEX "recipes_chapter_id_idx" ON "recipes" USING btree ("chapter_id");--> statement-breakpoint
CREATE INDEX "recipes_owner_id_idx" ON "recipes" USING btree ("owner_id");--> statement-breakpoint
CREATE TABLE "recipe_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"chapter_id" uuid NOT NULL,
	"shared_by_user_id" text NOT NULL,
	"shared_with_user_id" text NOT NULL,
	"permission" "share_permission" DEFAULT 'view' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX "recipe_shares_recipe_recipient_key" ON "recipe_shares" USING btree ("recipe_id","shared_with_user_id");--> statement-breakpoint
CREATE INDEX "recipe_shares_recipient_idx" ON "recipe_shares" USING btree ("shared_with_user_id");--> statement-breakpoint
CREATE INDEX "recipe_shares_chapter_idx" ON "recipe_shares" USING btree ("chapter_id");--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"action" "audit_action" NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_hash" text,
	"detail" jsonb
);--> statement-breakpoint
CREATE INDEX "audit_log_user_id_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_occurred_at_idx" ON "audit_log" USING btree ("occurred_at");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_style_id_styles_id_fk" FOREIGN KEY ("style_id") REFERENCES "public"."styles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_shares" ADD CONSTRAINT "recipe_shares_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_shares" ADD CONSTRAINT "recipe_shares_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_shares" ADD CONSTRAINT "recipe_shares_shared_by_user_id_users_id_fk" FOREIGN KEY ("shared_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_shares" ADD CONSTRAINT "recipe_shares_shared_with_user_id_users_id_fk" FOREIGN KEY ("shared_with_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
