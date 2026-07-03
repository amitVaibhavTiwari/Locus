import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable("epics")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("project_id", "text", (col) =>
      col.notNull().references("projects.id").onDelete("cascade"),
    )
    .addColumn("organization_id", "text", (col) =>
      col.notNull().references("organizations.id").onDelete("cascade"),
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("priority", "text", (col) => col.notNull().defaultTo("medium"))
    .addColumn("status", "text", (col) => col.notNull().defaultTo("planned"))
    .addColumn("owner_id", "text")
    .addColumn("start_date", "text")
    .addColumn("end_date", "text")
    .addColumn("created_by", "text", (col) => col.notNull())
    .addColumn("created_at", "text", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn("updated_at", "text", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .execute();

  await db.schema.alterTable("issues").addColumn("epic_id", "text").execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("epics").execute();
}
