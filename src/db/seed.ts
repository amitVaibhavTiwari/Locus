import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

async function main() {
  console.log("Seeding database...");

  const userId = randomUUID();
  const orgId = randomUUID();
  const now = new Date().toISOString();

  await db
    .insertInto("users")
    .values({
      id: userId,
      email: "admin@example.com",
      username: "Admin",
      password_hash: await bcrypt.hash("password123", 12),
      avatar_url: null,
      email_verified_at: now,
      created_at: now,
      updated_at: now,
    })
    .execute();

  await db
    .insertInto("organizations")
    .values({
      id: orgId,
      name: "My Workspace",
      slug: "my-workspace",
      logo_url: null,
      created_by: userId,
      created_at: now,
      updated_at: now,
    })
    .execute();

  await db
    .insertInto("organization_members")
    .values({
      id: randomUUID(),
      organization_id: orgId,
      user_id: userId,
      role: "owner",
      joined_at: now,
      last_active_at: now,
    })
    .execute();

  await db
    .insertInto("workspace_preferences")
    .values({
      id: randomUUID(),
      organization_id: orgId,
      display_name: "My Workspace",
      brand_color: "hsl(25 95% 53%)",
      logo_url: null,
      allow_admin_invite: 0,
      updated_at: now,
    })
    .execute();

  await db
    .insertInto("user_preferences")
    .values({
      id: randomUUID(),
      user_id: userId,
      pinned_project_ids: "[]",
      active_organization_id: orgId,
      updated_at: now,
    })
    .execute();

  console.log("Seed complete");
  console.log(`  User:  admin@example.com / password123`);
  console.log(`  Org:   My Workspace (${orgId})`);
  await db.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
