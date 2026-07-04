import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable("issue_comments")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("issue_id", "text", (col) =>
      col.notNull().references("issues.id").onDelete("cascade"),
    )
    .addColumn("organization_id", "text", (col) =>
      col.notNull().references("organizations.id").onDelete("cascade"),
    )
    .addColumn("user_id", "text", (col) => col.notNull().references("users.id"))
    .addColumn("body", "text", (col) => col.notNull())
    .addColumn("edited_at", "text")
    .addColumn("created_at", "text", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn("updated_at", "text", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("issue_comments").execute();
}
