import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("projects")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("organization_id", "text", (col) =>
      col.notNull().references("organizations.id").onDelete("cascade"),
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("key", "text", (col) => col.notNull())
    .addColumn("slug", "text", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("visibility", "text", (col) =>
      col.notNull().defaultTo("private"),
    )
    .addColumn("archived", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("created_by", "text", (col) =>
      col.notNull().references("users.id"),
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .execute();

  await db.schema
    .createIndex("projects_org_slug_idx")
    .unique()
    .on("projects")
    .columns(["organization_id", "slug"])
    .execute();

  await db.schema
    .createTable("project_members")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("project_id", "text", (col) =>
      col.notNull().references("projects.id").onDelete("cascade"),
    )
    .addColumn("user_id", "text", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("role", "text", (col) => col.notNull().defaultTo("member"))
    .addColumn("joined_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .execute();

  await db.schema
    .createIndex("project_members_proj_user_idx")
    .unique()
    .on("project_members")
    .columns(["project_id", "user_id"])
    .execute();

  await db.schema
    .createTable("boards")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("project_id", "text", (col) =>
      col.notNull().references("projects.id").onDelete("cascade"),
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .execute();

  await db.schema
    .createTable("columns")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("board_id", "text", (col) =>
      col.notNull().references("boards.id").onDelete("cascade"),
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("order_index", "integer", (col) => col.notNull())
    .addColumn("wip_limit", "integer")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("columns").execute();
  await db.schema.dropTable("boards").execute();
  await db.schema.dropTable("project_members").execute();
  await db.schema.dropTable("projects").execute();
}
