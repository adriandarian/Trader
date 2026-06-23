import {
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const ledgerEntryType = pgEnum("ledger_entry_type", [
  "deposit",
  "withdrawal",
  "stock_buy",
  "stock_sell",
  "option_premium_debit",
  "option_premium_credit",
  "fee",
]);

export const assetType = pgEnum("asset_type", ["stock", "option"]);
export const tradeAction = pgEnum("trade_action", ["buy", "sell"]);
export const tradeStatus = pgEnum("trade_status", ["open", "closed"]);
export const optionType = pgEnum("option_type", ["call", "put"]);
export const auditAction = pgEnum("audit_action", ["created", "closed", "ledger_posted"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ledgerEntries = pgTable("ledger_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  date: date("date").notNull(),
  type: ledgerEntryType("type").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  source: text("source").notNull(),
  notes: text("notes"),
  tradeId: uuid("trade_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const trades = pgTable("trades", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  ticker: text("ticker").notNull(),
  assetType: assetType("asset_type").notNull(),
  action: tradeAction("action").notNull(),
  quantity: integer("quantity").notNull(),
  entryPrice: numeric("entry_price", { precision: 14, scale: 4 }).notNull(),
  exitPrice: numeric("exit_price", { precision: 14, scale: 4 }),
  openedAt: date("opened_at").notNull(),
  closedAt: date("closed_at"),
  thesis: text("thesis").notNull(),
  strategy: text("strategy").notNull(),
  riskAmount: numeric("risk_amount", { precision: 14, scale: 2 }).notNull(),
  target: numeric("target", { precision: 14, scale: 4 }).notNull(),
  stopLoss: numeric("stop_loss", { precision: 14, scale: 4 }).notNull(),
  notes: text("notes"),
  status: tradeStatus("status").notNull().default("open"),
  underlyingTicker: text("underlying_ticker"),
  optionType: optionType("option_type"),
  strike: numeric("strike", { precision: 14, scale: 4 }),
  expirationDate: date("expiration_date"),
  premium: numeric("premium", { precision: 14, scale: 4 }),
  contracts: integer("contracts"),
  strategyTag: text("strategy_tag"),
  maxLoss: numeric("max_loss", { precision: 14, scale: 2 }),
  maxProfit: numeric("max_profit", { precision: 14, scale: 2 }),
  greeks: jsonb("greeks"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  action: auditAction("action").notNull(),
  summary: text("summary").notNull(),
  before: jsonb("before"),
  after: jsonb("after"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
