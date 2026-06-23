import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";

export function createDb(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to connect Proof Portfolio to Supabase Postgres.");
  }

  const client = postgres(connectionString, {
    prepare: false,
  });

  return drizzle(client, { schema });
}
