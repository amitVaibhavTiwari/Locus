import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable("sprints")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("project_id", "text", (col) =>
      col.notNull().references("projects.id").onDelete("cascade"),
    )
    .addColumn("organization_id", "text", (col) =>
      col.notNull().references("organizations.id").onDelete("cascade"),
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("goal", "text")
    .addColumn("start_date", "text")
    .addColumn("end_date", "text")
    .addColumn("status", "text", (col) => col.notNull().defaultTo("planned"))
    .addColumn("velocity", "integer")
    .addColumn("created_at", "text", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn("updated_at", "text", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .execute();

  await db.schema
    .alterTable("issues")
    .addColumn("sprint_id", "text")
    .execute();
}

export async function down(db: Kysely<any>) {
  // SQLite does not support DROP COLUMN; skip in rollback
  await db.schema.dropTable("sprints").execute();
}
