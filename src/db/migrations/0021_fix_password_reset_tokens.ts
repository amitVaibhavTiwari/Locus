import { Kysely } from "kysely";

// Migration 0001 created password_reset_tokens with a "token" column.
// Migration 0018 silently skipped it (ifNotExists). (I was vibe coding at late night so i missed it)
// This migration will drop and recreate table as needed in auth actions, which use "token_hash" instead of "token" and have a different schema.
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("password_reset_tokens").ifExists().execute();

  await db.schema
    .createTable("password_reset_tokens")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("user_id", "text", (col) => col.notNull())
    .addColumn("token_hash", "text", (col) => col.notNull())
    .addColumn("expires_at", "text", (col) => col.notNull())
    .addColumn("used", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("created_at", "text", (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("password_reset_tokens").execute();
}
