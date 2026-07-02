import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("projects")
    .addColumn("priority", "text")
    .execute();
  await db.schema
    .alterTable("projects")
    .addColumn("allow_delete_tickets", "integer", (col) =>
      col.notNull().defaultTo(0),
    )
    .execute();
  await db.schema
    .alterTable("projects")
    .addColumn("allow_manage_sprint", "integer", (col) =>
      col.notNull().defaultTo(1),
    )
    .execute();
  await db.schema
    .alterTable("projects")
    .addColumn("allow_members_edit", "integer", (col) =>
      col.notNull().defaultTo(0),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("projects").dropColumn("priority").execute();
  await db.schema
    .alterTable("projects")
    .dropColumn("allow_delete_tickets")
    .execute();
  await db.schema
    .alterTable("projects")
    .dropColumn("allow_manage_sprint")
    .execute();
  await db.schema
    .alterTable("projects")
    .dropColumn("allow_members_edit")
    .execute();
}
