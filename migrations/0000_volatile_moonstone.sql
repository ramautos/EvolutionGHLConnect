CREATE TYPE "public"."role" AS ENUM('user', 'admin', 'system_admin');--> statement-breakpoint
CREATE TABLE "api_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token_name" text NOT NULL,
	"token" text NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "api_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone_number" text,
	"country" text,
	"address" text,
	"notes" text,
	"ghl_company_id" text,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"manual_billing" boolean DEFAULT false NOT NULL,
	"price_per_subaccount" text DEFAULT '10.00',
	"price_per_extra_instance" text DEFAULT '5.00',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "companies_ghl_company_id_unique" UNIQUE("ghl_company_id")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subaccount_id" varchar NOT NULL,
	"amount" text NOT NULL,
	"plan" text NOT NULL,
	"base_amount" text DEFAULT '0.00' NOT NULL,
	"extra_amount" text DEFAULT '0.00' NOT NULL,
	"extra_slots" text DEFAULT '0' NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"stripe_invoice_id" text,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "oauth_states" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"state" text NOT NULL,
	"user_id" varchar NOT NULL,
	"company_id" varchar NOT NULL,
	"user_email" text NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "oauth_states_state_unique" UNIQUE("state")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" json NOT NULL,
	"expire" timestamp (6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subaccounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"location_id" text,
	"location_name" text,
	"ghl_company_id" text,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"city" text,
	"state" text,
	"address" text,
	"password_hash" text,
	"google_id" text,
	"role" "role" DEFAULT 'user' NOT NULL,
	"last_login_at" timestamp,
	"eleven_labs_api_key" text,
	"eleven_labs_voice_id" text,
	"gemini_api_key" text,
	"notification_phone" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"billing_enabled" boolean DEFAULT true NOT NULL,
	"manually_activated" boolean DEFAULT true NOT NULL,
	"is_sold" boolean DEFAULT false NOT NULL,
	"access_token" text,
	"sold_by_agency_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"installed_at" timestamp,
	"uninstalled_at" timestamp,
	CONSTRAINT "subaccounts_location_id_unique" UNIQUE("location_id"),
	CONSTRAINT "subaccounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subaccount_id" varchar NOT NULL,
	"plan" text DEFAULT 'trial' NOT NULL,
	"max_subaccounts" text DEFAULT '1' NOT NULL,
	"included_instances" text DEFAULT '1' NOT NULL,
	"extra_slots" text DEFAULT '0' NOT NULL,
	"base_price" text DEFAULT '0.00' NOT NULL,
	"extra_price" text DEFAULT '0.00' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"trial_ends_at" timestamp,
	"in_trial" boolean DEFAULT true NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"stripe_product_id" text,
	"current_period_start" timestamp DEFAULT now(),
	"current_period_end" timestamp,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subscriptions_subaccount_id_unique" UNIQUE("subaccount_id")
);
--> statement-breakpoint
CREATE TABLE "system_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evolution_api_url" text,
	"evolution_api_key" text,
	"system_name" text DEFAULT 'WhatsApp Platform' NOT NULL,
	"system_email" text,
	"support_email" text,
	"trial_days" text DEFAULT '15' NOT NULL,
	"trial_enabled" boolean DEFAULT true NOT NULL,
	"maintenance_mode" boolean DEFAULT false NOT NULL,
	"maintenance_message" text,
	"is_initialized" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "triggers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subaccount_id" varchar NOT NULL,
	"trigger_name" text NOT NULL,
	"trigger_tag" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "whatsapp_instances" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subaccount_id" varchar NOT NULL,
	"location_id" text NOT NULL,
	"custom_name" text,
	"evolution_instance_name" text NOT NULL,
	"phone_number" text,
	"status" text DEFAULT 'created' NOT NULL,
	"qr_code" text,
	"webhook_url" text,
	"api_key" text,
	"created_at" timestamp DEFAULT now(),
	"connected_at" timestamp,
	"disconnected_at" timestamp,
	"last_activity_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_user_id_subaccounts_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."subaccounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subaccount_id_subaccounts_id_fk" FOREIGN KEY ("subaccount_id") REFERENCES "public"."subaccounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_states" ADD CONSTRAINT "oauth_states_user_id_subaccounts_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."subaccounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_states" ADD CONSTRAINT "oauth_states_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subaccounts" ADD CONSTRAINT "subaccounts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subaccounts" ADD CONSTRAINT "subaccounts_sold_by_agency_id_subaccounts_id_fk" FOREIGN KEY ("sold_by_agency_id") REFERENCES "public"."subaccounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_subaccount_id_subaccounts_id_fk" FOREIGN KEY ("subaccount_id") REFERENCES "public"."subaccounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "triggers" ADD CONSTRAINT "triggers_subaccount_id_subaccounts_id_fk" FOREIGN KEY ("subaccount_id") REFERENCES "public"."subaccounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_instances" ADD CONSTRAINT "whatsapp_instances_subaccount_id_subaccounts_id_fk" FOREIGN KEY ("subaccount_id") REFERENCES "public"."subaccounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_tokens_user_id_idx" ON "api_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_tokens_token_idx" ON "api_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "invoices_subaccount_id_idx" ON "invoices" USING btree ("subaccount_id");--> statement-breakpoint
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subaccounts_company_id_idx" ON "subaccounts" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "subaccounts_is_active_idx" ON "subaccounts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "subaccounts_role_idx" ON "subaccounts" USING btree ("role");--> statement-breakpoint
CREATE INDEX "subaccounts_access_token_idx" ON "subaccounts" USING btree ("access_token");--> statement-breakpoint
CREATE INDEX "subaccounts_is_sold_idx" ON "subaccounts" USING btree ("is_sold");--> statement-breakpoint
CREATE INDEX "triggers_subaccount_id_idx" ON "triggers" USING btree ("subaccount_id");--> statement-breakpoint
CREATE INDEX "whatsapp_instances_subaccount_id_idx" ON "whatsapp_instances" USING btree ("subaccount_id");--> statement-breakpoint
CREATE INDEX "whatsapp_instances_location_id_idx" ON "whatsapp_instances" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "whatsapp_instances_status_idx" ON "whatsapp_instances" USING btree ("status");