import { redirect } from "next/navigation";
import { getUserIdFromRequest, getOrgIdFromRequest } from "@/lib/dal";
import { db } from "@/lib/db";
import { TeamClient } from "./TeamClient";

const PAGE_SIZE = 15;

export default async function TeamPage() {
  const userId = await getUserIdFromRequest();
  if (!userId) redirect("/login");

  const orgId = await getOrgIdFromRequest();
  if (!orgId) redirect("/onboarding/workspace");

  const workspacePrefs = await db
    .selectFrom("workspace_preferences")
    .where("organization_id", "=", orgId)
    .select(["allow_admin_invite"])
    .executeTakeFirst();

  const allowAdminInvite = (workspacePrefs?.allow_admin_invite ?? 0) === 1;

  const baseQuery = db
    .selectFrom("organization_members")
    .innerJoin("users", "users.id", "organization_members.user_id")
    .where("organization_members.organization_id", "=", orgId);

  const [firstBatch, countRow] = await Promise.all([
    baseQuery
      .select([
        "organization_members.id as memberId",
        "organization_members.user_id as userId",
        "organization_members.role",
        "organization_members.joined_at",
        "users.username",
        "users.email",
        "users.avatar_url",
      ])
      .orderBy("organization_members.joined_at", "asc")
      .limit(PAGE_SIZE + 1)
      .execute(),
    baseQuery
      .select((eb) => eb.fn.countAll<number>().as("total"))
      .executeTakeFirst(),
  ]);

  const hasMore = firstBatch.length > PAGE_SIZE;
  const members = firstBatch.slice(0, PAGE_SIZE);
  const initialTotal = Number(countRow?.total ?? 0);

  return (
    <TeamClient
      initialMembers={members}
      initialHasMore={hasMore}
      initialTotal={initialTotal}
      allowAdminInvite={allowAdminInvite}
    />
  );
}
