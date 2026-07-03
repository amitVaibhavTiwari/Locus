import { notFound, redirect } from "next/navigation";
import {
  getSessionUser,
  getActiveOrg,
  getEpic,
  getEpicIssues,
  getProjectBoard,
} from "@/lib/dal";
import { EpicDetailClient } from "./EpicDetailClient";

export default async function EpicDetailPage({
  params,
}: {
  params: Promise<{ epicId: string }>;
}) {
  const { epicId } = await params;

  const [user, org] = await Promise.all([getSessionUser(), getActiveOrg()]);
  if (!org || !user) redirect("/onboarding/workspace");

  const epic = await getEpic(epicId);
  if (!epic) notFound();

  const [issues, board] = await Promise.all([
    getEpicIssues(epicId),
    getProjectBoard(epic.project_id),
  ]);

  const boardStatuses = (board?.columns ?? [])
    .filter((c) => c.key)
    .map((c) => ({ key: c.key!, name: c.name }));

  return (
    <EpicDetailClient
      epic={epic}
      issues={issues}
      boardStatuses={boardStatuses}
    />
  );
}
