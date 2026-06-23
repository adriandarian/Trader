ALTER TYPE "public"."ledger_entry_type" ADD VALUE IF NOT EXISTS 'trade_debit';
ALTER TYPE "public"."ledger_entry_type" ADD VALUE IF NOT EXISTS 'trade_credit';
ALTER TYPE "public"."ledger_entry_type" ADD VALUE IF NOT EXISTS 'dividend';
ALTER TYPE "public"."ledger_entry_type" ADD VALUE IF NOT EXISTS 'option_premium';
ALTER TYPE "public"."ledger_entry_type" ADD VALUE IF NOT EXISTS 'adjustment';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."order_side" AS ENUM('buy', 'sell');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."order_type" AS ENUM('market', 'limit');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."order_status" AS ENUM('pending', 'filled', 'cancelled', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."journal_entry_type" AS ENUM('thesis', 'update', 'exit', 'correction', 'review');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE "profiles" (
  "id" uuid PRIMARY KEY NOT NULL REFERENCES "auth"."users"("id") ON DELETE cascade,
  "display_name" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "base_currency" text DEFAULT 'USD' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instruments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "symbol" text NOT NULL,
  "asset_type" "asset_type" NOT NULL,
  "underlying_symbol" text,
  "option_type" "option_type",
  "strike" numeric(14, 4),
  "expiration_date" date,
  "multiplier" integer DEFAULT 1 NOT NULL,
  "provider_symbol" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_ledger_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "account_id" uuid NOT NULL REFERENCES "accounts"("id") ON DELETE cascade,
  "type" "ledger_entry_type" NOT NULL,
  "amount" numeric(18, 2) NOT NULL,
  "effective_at" timestamp with time zone NOT NULL,
  "source_label" text NOT NULL,
  "note" text,
  "linked_trade_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "immutable_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "account_id" uuid NOT NULL REFERENCES "accounts"("id") ON DELETE cascade,
  "instrument_id" uuid NOT NULL REFERENCES "instruments"("id"),
  "side" "order_side" NOT NULL,
  "order_type" "order_type" NOT NULL,
  "status" "order_status" DEFAULT 'pending' NOT NULL,
  "quantity" numeric(18, 6) NOT NULL,
  "limit_price" numeric(18, 4),
  "submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
  "filled_at" timestamp with time zone,
  "fill_price" numeric(18, 4),
  "data_timestamp_at_fill" timestamp with time zone,
  "quote_source" text,
  "thesis" text NOT NULL,
  "strategy_tag" text NOT NULL,
  "stop_price" numeric(18, 4),
  "target_price" numeric(18, 4),
  "maximum_risk" numeric(18, 2),
  "confidence_score" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fills" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE cascade,
  "quantity" numeric(18, 6) NOT NULL,
  "price" numeric(18, 4) NOT NULL,
  "executed_at" timestamp with time zone NOT NULL,
  "bid_at_fill" numeric(18, 4),
  "ask_at_fill" numeric(18, 4),
  "quote_timestamp" timestamp with time zone NOT NULL,
  "provider" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "positions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "account_id" uuid NOT NULL REFERENCES "accounts"("id") ON DELETE cascade,
  "instrument_id" uuid NOT NULL REFERENCES "instruments"("id"),
  "quantity" numeric(18, 6) NOT NULL,
  "average_cost" numeric(18, 4) NOT NULL,
  "opened_at" timestamp with time zone NOT NULL,
  "closed_at" timestamp with time zone,
  "status" text DEFAULT 'open' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "account_id" uuid NOT NULL REFERENCES "accounts"("id") ON DELETE cascade,
  "order_id" uuid REFERENCES "orders"("id"),
  "position_id" uuid REFERENCES "positions"("id"),
  "entry_type" "journal_entry_type" NOT NULL,
  "body" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "immutable_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "portfolio_snapshots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "account_id" uuid NOT NULL REFERENCES "accounts"("id") ON DELETE cascade,
  "captured_at" timestamp with time zone NOT NULL,
  "cash_value" numeric(18, 2) NOT NULL,
  "holdings_value" numeric(18, 2) NOT NULL,
  "total_value" numeric(18, 2) NOT NULL,
  "net_contributions" numeric(18, 2) NOT NULL,
  "realized_pnl" numeric(18, 2) NOT NULL,
  "unrealized_pnl" numeric(18, 2) NOT NULL,
  "benchmark_value" numeric(18, 2)
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "account_id" uuid NOT NULL REFERENCES "accounts"("id") ON DELETE cascade,
  "entity_type" text NOT NULL,
  "entity_id" uuid NOT NULL,
  "action" text NOT NULL,
  "previous_value" jsonb,
  "new_value" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlist_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "account_id" uuid NOT NULL REFERENCES "accounts"("id") ON DELETE cascade,
  "symbol" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" ("user_id");
CREATE INDEX "instruments_symbol_idx" ON "instruments" ("symbol");
CREATE INDEX "instruments_underlying_idx" ON "instruments" ("underlying_symbol");
CREATE INDEX "cash_ledger_entries_account_id_idx" ON "cash_ledger_entries" ("account_id");
CREATE INDEX "cash_ledger_entries_effective_at_idx" ON "cash_ledger_entries" ("effective_at");
CREATE INDEX "orders_account_id_idx" ON "orders" ("account_id");
CREATE INDEX "orders_instrument_id_idx" ON "orders" ("instrument_id");
CREATE INDEX "orders_status_idx" ON "orders" ("status");
CREATE INDEX "fills_order_id_idx" ON "fills" ("order_id");
CREATE INDEX "positions_account_id_idx" ON "positions" ("account_id");
CREATE INDEX "positions_instrument_id_idx" ON "positions" ("instrument_id");
CREATE INDEX "journal_entries_account_id_idx" ON "journal_entries" ("account_id");
CREATE INDEX "journal_entries_order_id_idx" ON "journal_entries" ("order_id");
CREATE INDEX "journal_entries_position_id_idx" ON "journal_entries" ("position_id");
CREATE INDEX "portfolio_snapshots_account_id_idx" ON "portfolio_snapshots" ("account_id");
CREATE INDEX "portfolio_snapshots_captured_at_idx" ON "portfolio_snapshots" ("captured_at");
CREATE INDEX "audit_events_account_id_idx" ON "audit_events" ("account_id");
CREATE INDEX "audit_events_entity_idx" ON "audit_events" ("entity_type", "entity_id");
CREATE INDEX "watchlist_items_account_id_idx" ON "watchlist_items" ("account_id");
CREATE INDEX "watchlist_items_symbol_idx" ON "watchlist_items" ("symbol");
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cash_ledger_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fills" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "positions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "journal_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "portfolio_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "watchlist_items" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "profiles_owner_policy" ON "profiles"
  FOR ALL TO authenticated
  USING ("id" = (select auth.uid()))
  WITH CHECK ("id" = (select auth.uid()));
--> statement-breakpoint
CREATE POLICY "accounts_owner_policy" ON "accounts"
  FOR ALL TO authenticated
  USING ("user_id" = (select auth.uid()))
  WITH CHECK ("user_id" = (select auth.uid()));
--> statement-breakpoint
CREATE POLICY "cash_ledger_entries_owner_policy" ON "cash_ledger_entries"
  FOR ALL TO authenticated
  USING (exists (select 1 from "accounts" where "accounts"."id" = "cash_ledger_entries"."account_id" and "accounts"."user_id" = (select auth.uid())))
  WITH CHECK (exists (select 1 from "accounts" where "accounts"."id" = "cash_ledger_entries"."account_id" and "accounts"."user_id" = (select auth.uid())));
--> statement-breakpoint
CREATE POLICY "orders_owner_policy" ON "orders"
  FOR ALL TO authenticated
  USING (exists (select 1 from "accounts" where "accounts"."id" = "orders"."account_id" and "accounts"."user_id" = (select auth.uid())))
  WITH CHECK (exists (select 1 from "accounts" where "accounts"."id" = "orders"."account_id" and "accounts"."user_id" = (select auth.uid())));
--> statement-breakpoint
CREATE POLICY "positions_owner_policy" ON "positions"
  FOR ALL TO authenticated
  USING (exists (select 1 from "accounts" where "accounts"."id" = "positions"."account_id" and "accounts"."user_id" = (select auth.uid())))
  WITH CHECK (exists (select 1 from "accounts" where "accounts"."id" = "positions"."account_id" and "accounts"."user_id" = (select auth.uid())));
--> statement-breakpoint
CREATE POLICY "journal_entries_owner_policy" ON "journal_entries"
  FOR ALL TO authenticated
  USING (exists (select 1 from "accounts" where "accounts"."id" = "journal_entries"."account_id" and "accounts"."user_id" = (select auth.uid())))
  WITH CHECK (exists (select 1 from "accounts" where "accounts"."id" = "journal_entries"."account_id" and "accounts"."user_id" = (select auth.uid())));
--> statement-breakpoint
CREATE POLICY "portfolio_snapshots_owner_policy" ON "portfolio_snapshots"
  FOR ALL TO authenticated
  USING (exists (select 1 from "accounts" where "accounts"."id" = "portfolio_snapshots"."account_id" and "accounts"."user_id" = (select auth.uid())))
  WITH CHECK (exists (select 1 from "accounts" where "accounts"."id" = "portfolio_snapshots"."account_id" and "accounts"."user_id" = (select auth.uid())));
--> statement-breakpoint
CREATE POLICY "audit_events_owner_policy" ON "audit_events"
  FOR ALL TO authenticated
  USING (exists (select 1 from "accounts" where "accounts"."id" = "audit_events"."account_id" and "accounts"."user_id" = (select auth.uid())))
  WITH CHECK (exists (select 1 from "accounts" where "accounts"."id" = "audit_events"."account_id" and "accounts"."user_id" = (select auth.uid())));
--> statement-breakpoint
CREATE POLICY "watchlist_items_owner_policy" ON "watchlist_items"
  FOR ALL TO authenticated
  USING (exists (select 1 from "accounts" where "accounts"."id" = "watchlist_items"."account_id" and "accounts"."user_id" = (select auth.uid())))
  WITH CHECK (exists (select 1 from "accounts" where "accounts"."id" = "watchlist_items"."account_id" and "accounts"."user_id" = (select auth.uid())));
--> statement-breakpoint
CREATE POLICY "fills_owner_policy" ON "fills"
  FOR ALL TO authenticated
  USING (
    exists (
      select 1
      from "orders"
      join "accounts" on "accounts"."id" = "orders"."account_id"
      where "orders"."id" = "fills"."order_id"
        and "accounts"."user_id" = (select auth.uid())
    )
  )
  WITH CHECK (
    exists (
      select 1
      from "orders"
      join "accounts" on "accounts"."id" = "orders"."account_id"
      where "orders"."id" = "fills"."order_id"
        and "accounts"."user_id" = (select auth.uid())
    )
  );
