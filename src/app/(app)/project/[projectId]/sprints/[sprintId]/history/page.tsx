import { notFound, redirect } from "next/navigation";
import { getSessionUser, getActiveOrg, getProject } from "@/lib/dal";
import { db } from "@/lib/db";
import { SprintHistoryClient } from "./SprintHistoryClient";

export default async function SprintHistoryPage({
  params,
}: {
  params: Promise<{ projectId: string; sprintId: string }>;
}) {
  const { projectId, sprintId } = await params;

  const [user, org] = await Promise.all([getSessionUser(), getActiveOrg()]);
  if (!org || !user) redirect("/onboarding/workspace");

  const [project, sprint] = await Promise.all([
    getProject(projectId, org.id, user.id),
    db
      .selectFrom("sprints")
      .where("id", "=", sprintId)
      .select(["id", "name", "status"])
      .executeTakeFirst(),
  ]);

  if (!project || !sprint) notFound();

  const activities = await db
    .selectFrom("activities")
    .innerJoin("users", "users.id", "activities.user_id")
    .where("activities.sprint_id", "=", sprintId)
    .select([
      "activities.id",
      "activities.type",
      "activities.payload",
      "activities.created_at",
      "users.id as user_id",
      "users.username",
      "users.avatar_url",
    ])
    .orderBy("activities.created_at", "desc")
    .execute();

  return (
    <SprintHistoryClient
      projectId={projectId}
      sprint={{ id: sprint.id, name: sprint.name, status: sprint.status }}
      activities={activities.map((a) => ({
        id: a.id,
        type: a.type,
        payload: a.payload,
        created_at: a.created_at,
        user: { id: a.user_id, username: a.username, avatar_url: a.avatar_url },
      }))}
    />
  );
}
