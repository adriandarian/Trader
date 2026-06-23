CREATE TYPE "public"."asset_type" AS ENUM('stock', 'option');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('created', 'closed', 'ledger_posted');--> statement-breakpoint
CREATE TYPE "public"."ledger_entry_type" AS ENUM('deposit', 'withdrawal', 'stock_buy', 'stock_sell', 'option_premium_debit', 'option_premium_credit', 'fee');--> statement-breakpoint
CREATE TYPE "public"."option_type" AS ENUM('call', 'put');--> statement-breakpoint
CREATE TYPE "public"."trade_action" AS ENUM('buy', 'sell');--> statement-breakpoint
CREATE TYPE "public"."trade_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" "audit_action" NOT NULL,
	"summary" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"type" "ledger_entry_type" NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"source" text NOT NULL,
	"notes" text,
	"trade_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"ticker" text NOT NULL,
	"asset_type" "asset_type" NOT NULL,
	"action" "trade_action" NOT NULL,
	"quantity" integer NOT NULL,
	"entry_price" numeric(14, 4) NOT NULL,
	"exit_price" numeric(14, 4),
	"opened_at" date NOT NULL,
	"closed_at" date,
	"thesis" text NOT NULL,
	"strategy" text NOT NULL,
	"risk_amount" numeric(14, 2) NOT NULL,
	"target" numeric(14, 4) NOT NULL,
	"stop_loss" numeric(14, 4) NOT NULL,
	"notes" text,
	"status" "trade_status" DEFAULT 'open' NOT NULL,
	"underlying_ticker" text,
	"option_type" "option_type",
	"strike" numeric(14, 4),
	"expiration_date" date,
	"premium" numeric(14, 4),
	"contracts" integer,
	"strategy_tag" text,
	"max_loss" numeric(14, 2),
	"max_profit" numeric(14, 2),
	"greeks" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;