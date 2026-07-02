import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("columns").addColumn("key", "text").execute();

  await db.schema
    .createTable("labels")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("organization_id", "text", (col) =>
      col.notNull().references("organizations.id").onDelete("cascade"),
    )
    .addColumn("project_id", "text", (col) =>
      col.references("projects.id").onDelete("cascade"),
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("color", "text", (col) => col.notNull().defaultTo("#6b7280"))
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .execute();

  await db.schema
    .createTable("issues")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("organization_id", "text", (col) =>
      col.notNull().references("organizations.id").onDelete("cascade"),
    )
    .addColumn("project_id", "text", (col) =>
      col.notNull().references("projects.id").onDelete("cascade"),
    )
    .addColumn("board_id", "text", (col) =>
      col.references("boards.id").onDelete("set null"),
    )
    .addColumn("column_id", "text", (col) =>
      col.references("columns.id").onDelete("set null"),
    )
    .addColumn("parent_issue_id", "text")
    .addColumn("issue_number", "integer", (col) => col.notNull())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("type", "text", (col) => col.notNull().defaultTo("task"))
    .addColumn("status", "text", (col) => col.notNull().defaultTo("todo"))
    .addColumn("priority", "text", (col) => col.notNull().defaultTo("medium"))
    .addColumn("reporter_id", "text", (col) =>
      col.notNull().references("users.id"),
    )
    .addColumn("assignee_id", "text", (col) => col.references("users.id"))
    .addColumn("due_date", "text")
    .addColumn("completed_at", "text")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .execute();

  await db.schema
    .createIndex("issues_project_number_idx")
    .unique()
    .on("issues")
    .columns(["project_id", "issue_number"])
    .execute();

  await db.schema
    .createTable("issue_labels")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("issue_id", "text", (col) =>
      col.notNull().references("issues.id").onDelete("cascade"),
    )
    .addColumn("label_id", "text", (col) =>
      col.notNull().references("labels.id").onDelete("cascade"),
    )
    .execute();

  await db.schema
    .createIndex("issue_labels_unique_idx")
    .unique()
    .on("issue_labels")
    .columns(["issue_id", "label_id"])
    .execute();

  await db.schema
    .createTable("activities")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("organization_id", "text", (col) =>
      col.notNull().references("organizations.id").onDelete("cascade"),
    )
    .addColumn("project_id", "text", (col) =>
      col.notNull().references("projects.id").onDelete("cascade"),
    )
    .addColumn("issue_id", "text", (col) =>
      col.references("issues.id").onDelete("cascade"),
    )
    .addColumn("user_id", "text", (col) => col.notNull().references("users.id"))
    .addColumn("type", "text", (col) => col.notNull())
    .addColumn("payload", "text", (col) => col.notNull().defaultTo("{}"))
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("activities").execute();
  await db.schema.dropTable("issue_labels").execute();
  await db.schema.dropTable("issues").execute();
  await db.schema.dropTable("labels").execute();
  // Note: removing the 'key' column from columns is not easily reversible in SQLite
  // In production (Postgres): ALTER TABLE columns DROP COLUMN key
}
