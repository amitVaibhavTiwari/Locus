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

  if (url.startsWith("libsql://") || url.startsWith("wss://")) {
    // Turso
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } =
      require("@libsql/client") as typeof import("@libsql/client");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { LibsqlDialect } =
      require("kysely-libsql") as typeof import("kysely-libsql");
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!authToken) throw new Error("TURSO_AUTH_TOKEN is not set");
    return new Kysely<Database>({
      dialect: new LibsqlDialect({
        client: createClient({ url, authToken }),
      }),
    });
  }

  //  SQLite file
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

// Singleton to reuse connection pool across hot reloads in dev
export const db: Kysely<Database> =
  globalThis.__db ?? (globalThis.__db = createDb());
