import { notFound, redirect } from "next/navigation";
import { getSessionUser, getActiveOrg, getProject, getOrgMembers } from "@/lib/dal";
import { db } from "@/lib/db";
import { ProjectTeamClient } from "./ProjectTeamClient";

const PAGE_SIZE = 15;

export default async function ProjectTeamPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const [user, org] = await Promise.all([getSessionUser(), getActiveOrg()]);
  if (!org || !user) redirect("/onboarding/workspace");

  const [project, orgMembers] = await Promise.all([
    getProject(projectId, org.id, user.id),
    getOrgMembers(org.id),
  ]);

  if (!project) notFound();

  // First page of project members
  const membersBaseQuery = db
    .selectFrom("project_members")
    .innerJoin("users", "users.id", "project_members.user_id")
    .where("project_members.project_id", "=", projectId);

  const [firstBatch, countRow] = await Promise.all([
    membersBaseQuery
      .select([
        "project_members.id as memberId",
        "project_members.user_id as userId",
        "project_members.role",
        "project_members.joined_at",
        "users.username",
        "users.email",
        "users.avatar_url",
      ])
      .orderBy("project_members.joined_at", "asc")
      .limit(PAGE_SIZE + 1)
      .execute(),
    membersBaseQuery
      .select((eb) => eb.fn.countAll<number>().as("total"))
      .executeTakeFirst(),
  ]);

  const hasMore = firstBatch.length > PAGE_SIZE;
  const members = firstBatch.slice(0, PAGE_SIZE);
  const initialTotal = Number(countRow?.total ?? 0);

  const projectMemberUserIds = new Set(members.map((m) => m.userId));
  const availableMembers = orgMembers
    .filter((m) => !projectMemberUserIds.has(m.userId))
    .map((m) => ({
      userId: m.userId,
      username: m.username,
      email: m.email,
      avatar_url: m.avatar_url,
    }));

  return (
    <ProjectTeamClient
      projectId={projectId}
      projectName={project.name}
      initialMembers={members}
      initialHasMore={hasMore}
      initialTotal={initialTotal}
      availableMembers={availableMembers}
      currentUserId={user.id}
    />
  );
}
