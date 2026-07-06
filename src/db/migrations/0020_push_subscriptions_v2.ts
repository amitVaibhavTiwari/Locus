import { Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("push_subscriptions").ifExists().execute();

  await db.schema
    .createTable("push_subscriptions")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("user_id", "text", (col) => col.notNull())
    .addColumn("organization_id", "text", (col) => col.notNull())
    .addColumn("endpoint", "text", (col) => col.notNull())
    .addColumn("p256dh", "text", (col) => col.notNull())
    .addColumn("auth", "text", (col) => col.notNull())
    .addColumn("is_valid", "integer", (col) => col.notNull().defaultTo(1))
    .addColumn("user_agent", "text")
    .addColumn("created_at", "text", (col) => col.notNull())
    .execute();

  // UNIQUE: one subscription per (endpoint, workspace)
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_push_endpoint_org
    ON push_subscriptions (endpoint, organization_id)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("push_subscriptions").ifExists().execute();
}
