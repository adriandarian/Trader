import { drizzle } from "drizzle-orm/postgres-js";
import "server-only";
import postgres from "postgres";

import * as schema from "@/db/schema";

let db: ReturnType<typeof createDb> | null = null;

export function createDb(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to connect Proof Portfolio to Supabase Postgres.");
  }

  const client = postgres(connectionString, {
    prepare: false,
  });

  return drizzle(client, { schema });
}

export function getDb() {
  if (!db) {
    db = createDb();
  }

  return db;
}
