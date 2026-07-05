import { notFound, redirect } from "next/navigation";
import { getSessionUser, getActiveOrg, getEpic } from "@/lib/dal";
import { db } from "@/lib/db";
import { EpicHistoryClient } from "./EpicHistoryClient";

export default async function EpicHistoryPage({
  params,
}: {
  params: Promise<{ epicId: string }>;
}) {
  const { epicId } = await params;

  const [user, org] = await Promise.all([getSessionUser(), getActiveOrg()]);
  if (!org || !user) redirect("/onboarding/workspace");

  const epic = await getEpic(epicId);
  if (!epic) notFound();

  const activities = await db
    .selectFrom("activities")
    .innerJoin("users", "users.id", "activities.user_id")
    .where("activities.epic_id", "=", epicId)
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
    <EpicHistoryClient
      epic={{ id: epic.id, name: epic.name, project_id: epic.project_id }}
      activities={activities.map((a) => ({
        id: a.id,
        type: a.type,
        payload: a.payload,
        created_at: a.created_at,
        user: {
          id: a.user_id,
          username: a.username,
          avatar_url: a.avatar_url,
        },
      }))}
    />
  );
}
