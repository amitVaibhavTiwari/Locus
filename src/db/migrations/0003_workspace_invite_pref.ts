import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("workspace_preferences")
    .addColumn("allow_admin_invite", "integer", (col) =>
      col.notNull().defaultTo(0),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("workspace_preferences")
    .dropColumn("allow_admin_invite")
    .execute();
}
