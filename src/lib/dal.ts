import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const verifySession = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session;
});

export const getSessionUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  return db
    .selectFrom("users")
    .where("id", "=", session.user.id)
    .select(["id", "email", "username", "avatar_url"])
    .executeTakeFirst()
    .then((u) => u ?? null);
});

export const getActiveOrg = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const prefs = await db
    .selectFrom("user_preferences")
    .where("user_id", "=", session.user.id)
    .select(["active_organization_id"])
    .executeTakeFirst();

  if (!prefs?.active_organization_id) return null;

  const [org, workspacePrefs] = await Promise.all([
    db
      .selectFrom("organizations")
      .where("id", "=", prefs.active_organization_id)
      .select([
        "id",
        "name",
        "slug",
        "logo_url",
        "created_by",
        "created_at",
        "updated_at",
      ])
      .executeTakeFirst(),
    db
      .selectFrom("workspace_preferences")
      .where("organization_id", "=", prefs.active_organization_id)
      .select([
        "id",
        "organization_id",
        "display_name",
        "brand_color",
        "logo_url",
        "allow_admin_invite",
        "updated_at",
      ])
      .executeTakeFirst(),
  ]);

  if (!org) return null;
  return { ...org, workspacePrefs: workspacePrefs ?? null };
});

export const getCurrentUserOrgRole = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const prefs = await db
    .selectFrom("user_preferences")
    .where("user_id", "=", session.user.id)
    .select(["active_organization_id"])
    .executeTakeFirst();

  if (!prefs?.active_organization_id) return null;

  const member = await db
    .selectFrom("organization_members")
    .where("organization_id", "=", prefs.active_organization_id)
    .where("user_id", "=", session.user.id)
    .select(["role"])
    .executeTakeFirst();

  return member?.role ?? null;
});

export const getOrgMembers = cache(async (orgId: string) => {
  const members = await db
    .selectFrom("organization_members")
    .where("organization_id", "=", orgId)
    .select(["id", "user_id", "role", "joined_at"])
    .execute();

  if (members.length === 0) return [];

  const userIds = members.map((m) => m.user_id);
  const users = await db
    .selectFrom("users")
    .where("id", "in", userIds)
    .select(["id", "username", "email", "avatar_url"])
    .execute();

  const userMap = new Map(users.map((u) => [u.id, u]));

  return members.map((m) => ({
    memberId: m.id,
    userId: m.user_id,
    role: m.role,
    joined_at: m.joined_at,
    ...userMap.get(m.user_id)!,
  }));
});
