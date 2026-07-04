import { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("epics")
    .addColumn("archived", "integer", (col) => col.notNull().defaultTo(0))
    .execute();
  await db.schema
    .alterTable("epics")
    .addColumn("archived_at", "text")
    .execute();
}

export async function down(_db: Kysely<unknown>): Promise<void> {}
