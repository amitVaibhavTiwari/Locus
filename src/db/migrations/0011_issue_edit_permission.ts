import { Kysely } from "kysely";

export async function up(db: Kysely<any>) {
  await db.schema
    .alterTable("issues")
    .addColumn("edit_permission", "text", (col) =>
      col.notNull().defaultTo("anyone"),
    )
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.alterTable("issues").dropColumn("edit_permission").execute();
}
