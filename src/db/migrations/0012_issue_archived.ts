import { Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("issues")
    .addColumn("archived", "integer", (col) => col.notNull().defaultTo(0))
    .execute();

  await db.schema
    .alterTable("issues")
    .addColumn("archived_at", "text")
    .execute();

  await db.schema
    .createIndex("issues_archived_idx")
    .on("issues")
    .column("archived")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS issues_archived_idx`.execute(db);
  await db.schema.alterTable("issues").dropColumn("archived").execute();
  await db.schema.alterTable("issues").dropColumn("archived_at").execute();
}
