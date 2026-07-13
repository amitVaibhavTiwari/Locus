import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserIdFromRequest, getOrgIdFromRequest } from "@/lib/dal";
import { mapOrgRole } from "@/lib/utils";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const currentUserId = await getUserIdFromRequest();
  if (!currentUserId) redirect("/login");

  const orgId = await getOrgIdFromRequest();

  const user = await db
    .selectFrom("users")
    .where("id", "=", id)
    .select(["id", "email", "username", "avatar_url"])
    .executeTakeFirst();

  if (!user) notFound();

  let role: string | null = null;
  let joinedAt: string | null = null;

  if (orgId) {
    const membership = await db
      .selectFrom("organization_members")
      .where("organization_id", "=", orgId)
      .where("user_id", "=", user.id)
      .select(["role", "joined_at"])
      .executeTakeFirst();

    role = membership?.role ?? null;
    joinedAt = membership ? String(membership.joined_at) : null;
  }

  return (
    <ProfileClient
      user={{
        id: user.id,
        email: user.email,
        username: user.username,
        avatar_url: user.avatar_url,
      }}
      role={mapOrgRole(role)}
      joinedAt={joinedAt}
      isOwnProfile={currentUserId === user.id}
      activeOrgId={orgId ?? null}
    />
  );
}
