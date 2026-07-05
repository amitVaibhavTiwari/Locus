import { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("activities")
    .addColumn("sprint_id", "text")
    .execute();
}

export async function down(_db: Kysely<unknown>): Promise<void> {}
