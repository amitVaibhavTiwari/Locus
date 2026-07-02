import { Kysely, PostgresDialect, SqliteDialect } from "kysely";
import type { Database } from "@/db/types";

function createDb(): Kysely<Database> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  if (url.startsWith("postgres")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool } = require("pg") as typeof import("pg");
    return new Kysely<Database>({
      dialect: new PostgresDialect({
        pool: new Pool({ connectionString: url }),
      }),
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const BetterSqlite3 = require("better-sqlite3") as {
    new (filename: string): any;
  };
  return new Kysely<Database>({
    dialect: new SqliteDialect({
      database: new BetterSqlite3(url),
    }),
  });
}

declare global {
  // eslint-disable-next-line no-var
  var __db: Kysely<Database> | undefined;
}

// Singleton — reuse connection pool across hot reloads in dev
export const db: Kysely<Database> =
  globalThis.__db ?? (globalThis.__db = createDb());
