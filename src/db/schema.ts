import {
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const authSchema = pgSchema("auth");

export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const ledgerEntryType = pgEnum("ledger_entry_type", [
  "deposit",
  "withdrawal",
  "trade_debit",
  "trade_credit",
  "dividend",
  "option_premium",
  "fee",
  "adjustment",
]);

export const assetType = pgEnum("asset_type", ["stock", "option"]);
export const optionType = pgEnum("option_type", ["call", "put"]);
export const orderSide = pgEnum("order_side", ["buy", "sell"]);
export const orderType = pgEnum("order_type", ["market", "limit"]);
export const orderStatus = pgEnum("order_status", ["pending", "filled", "cancelled", "rejected"]);
export const journalEntryType = pgEnum("journal_entry_type", ["thesis", "update", "exit", "correction", "review"]);

export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    baseCurrency: text("base_currency").notNull().default("USD"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("accounts_user_id_idx").on(table.userId)],
);

export const instruments = pgTable(
  "instruments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    symbol: text("symbol").notNull(),
    assetType: assetType("asset_type").notNull(),
    underlyingSymbol: text("underlying_symbol"),
    optionType: optionType("option_type"),
    strike: numeric("strike", { precision: 14, scale: 4 }),
    expirationDate: date("expiration_date"),
    multiplier: integer("multiplier").notNull().default(1),
    providerSymbol: text("provider_symbol").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("instruments_symbol_idx").on(table.symbol),
    index("instruments_underlying_idx").on(table.underlyingSymbol),
  ],
);

export const cashLedgerEntries = pgTable(
  "cash_ledger_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    type: ledgerEntryType("type").notNull(),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
    effectiveAt: timestamp("effective_at", { withTimezone: true }).notNull(),
    sourceLabel: text("source_label").notNull(),
    note: text("note"),
    linkedTradeId: uuid("linked_trade_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    immutableAt: timestamp("immutable_at", { withTimezone: true }),
  },
  (table) => [
    index("cash_ledger_entries_account_id_idx").on(table.accountId),
    index("cash_ledger_entries_effective_at_idx").on(table.effectiveAt),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    instrumentId: uuid("instrument_id")
      .notNull()
      .references(() => instruments.id),
    side: orderSide("side").notNull(),
    orderType: orderType("order_type").notNull(),
    status: orderStatus("status").notNull().default("pending"),
    quantity: numeric("quantity", { precision: 18, scale: 6 }).notNull(),
    limitPrice: numeric("limit_price", { precision: 18, scale: 4 }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    filledAt: timestamp("filled_at", { withTimezone: true }),
    fillPrice: numeric("fill_price", { precision: 18, scale: 4 }),
    dataTimestampAtFill: timestamp("data_timestamp_at_fill", { withTimezone: true }),
    quoteSource: text("quote_source"),
    thesis: text("thesis").notNull(),
    strategyTag: text("strategy_tag").notNull(),
    stopPrice: numeric("stop_price", { precision: 18, scale: 4 }),
    targetPrice: numeric("target_price", { precision: 18, scale: 4 }),
    maximumRisk: numeric("maximum_risk", { precision: 18, scale: 2 }),
    confidenceScore: integer("confidence_score"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("orders_account_id_idx").on(table.accountId),
    index("orders_instrument_id_idx").on(table.instrumentId),
    index("orders_status_idx").on(table.status),
  ],
);

export const fills = pgTable(
  "fills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    quantity: numeric("quantity", { precision: 18, scale: 6 }).notNull(),
    price: numeric("price", { precision: 18, scale: 4 }).notNull(),
    executedAt: timestamp("executed_at", { withTimezone: true }).notNull(),
    bidAtFill: numeric("bid_at_fill", { precision: 18, scale: 4 }),
    askAtFill: numeric("ask_at_fill", { precision: 18, scale: 4 }),
    quoteTimestamp: timestamp("quote_timestamp", { withTimezone: true }).notNull(),
    provider: text("provider").notNull(),
  },
  (table) => [index("fills_order_id_idx").on(table.orderId)],
);

export const positions = pgTable(
  "positions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    instrumentId: uuid("instrument_id")
      .notNull()
      .references(() => instruments.id),
    quantity: numeric("quantity", { precision: 18, scale: 6 }).notNull(),
    averageCost: numeric("average_cost", { precision: 18, scale: 4 }).notNull(),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    status: text("status").notNull().default("open"),
  },
  (table) => [
    index("positions_account_id_idx").on(table.accountId),
    index("positions_instrument_id_idx").on(table.instrumentId),
  ],
);

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").references(() => orders.id),
    positionId: uuid("position_id").references(() => positions.id),
    entryType: journalEntryType("entry_type").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    immutableAt: timestamp("immutable_at", { withTimezone: true }),
  },
  (table) => [
    index("journal_entries_account_id_idx").on(table.accountId),
    index("journal_entries_order_id_idx").on(table.orderId),
    index("journal_entries_position_id_idx").on(table.positionId),
  ],
);

export const portfolioSnapshots = pgTable(
  "portfolio_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
    cashValue: numeric("cash_value", { precision: 18, scale: 2 }).notNull(),
    holdingsValue: numeric("holdings_value", { precision: 18, scale: 2 }).notNull(),
    totalValue: numeric("total_value", { precision: 18, scale: 2 }).notNull(),
    netContributions: numeric("net_contributions", { precision: 18, scale: 2 }).notNull(),
    realizedPnl: numeric("realized_pnl", { precision: 18, scale: 2 }).notNull(),
    unrealizedPnl: numeric("unrealized_pnl", { precision: 18, scale: 2 }).notNull(),
    benchmarkValue: numeric("benchmark_value", { precision: 18, scale: 2 }),
  },
  (table) => [
    index("portfolio_snapshots_account_id_idx").on(table.accountId),
    index("portfolio_snapshots_captured_at_idx").on(table.capturedAt),
  ],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    action: text("action").notNull(),
    previousValue: jsonb("previous_value"),
    newValue: jsonb("new_value"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_events_account_id_idx").on(table.accountId),
    index("audit_events_entity_idx").on(table.entityType, table.entityId),
  ],
);

export const watchlistItems = pgTable(
  "watchlist_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    symbol: text("symbol").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("watchlist_items_account_id_idx").on(table.accountId),
    index("watchlist_items_symbol_idx").on(table.symbol),
  ],
);
