import { notFound, redirect } from "next/navigation";
import {
  getUserIdFromRequest,
  getOrgIdFromRequest,
  getProject,
} from "@/lib/dal";
import { db } from "@/lib/db";
import { EpicsClient } from "./EpicsClient";

const PAGE_SIZE = 20;

export default async function ProjectEpicsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const userId = await getUserIdFromRequest();
  if (!userId) redirect("/login");

  const orgId = await getOrgIdFromRequest();
  if (!orgId) redirect("/onboarding/workspace");

  const project = await getProject(projectId, orgId, userId);
  if (!project) notFound();

  const baseQuery = db
    .selectFrom("epics")
    .where("project_id", "=", projectId)
    .where("archived", "=", 0);

  const [rows, countRow] = await Promise.all([
    baseQuery
      .selectAll()
      .orderBy("created_at", "desc")
      .limit(PAGE_SIZE + 1)
      .execute(),
    baseQuery
      .select((eb) => eb.fn.countAll<number>().as("total"))
      .executeTakeFirst(),
  ]);

  const hasMore = rows.length > PAGE_SIZE;
  const rawEpics = rows.slice(0, PAGE_SIZE);
  const initialTotal = Number(countRow?.total ?? 0);

  const epicIds = rawEpics.map((e) => e.id);
  const ownerIds = [
    ...new Set(rawEpics.map((e) => e.owner_id).filter(Boolean)),
  ] as string[];

  const [issueRows, owners] = await Promise.all([
    epicIds.length > 0
      ? db
          .selectFrom("issues")
          .where("epic_id", "in", epicIds)
          .select(["epic_id", "completed_at"])
          .execute()
      : Promise.resolve(
          [] as { epic_id: string | null; completed_at: string | null }[],
        ),
    ownerIds.length > 0
      ? db
          .selectFrom("users")
          .where("id", "in", ownerIds)
          .select(["id", "username", "avatar_url"])
          .execute()
      : Promise.resolve(
          [] as { id: string; username: string; avatar_url: string | null }[],
        ),
  ]);

  const totalMap = new Map<string, number>();
  const doneMap = new Map<string, number>();
  issueRows.forEach((row) => {
    if (!row.epic_id) return;
    totalMap.set(row.epic_id, (totalMap.get(row.epic_id) ?? 0) + 1);
    if (row.completed_at !== null)
      doneMap.set(row.epic_id, (doneMap.get(row.epic_id) ?? 0) + 1);
  });

  const ownerMap = new Map(owners.map((u) => [u.id, u]));

  const initialEpics = rawEpics.map((epic) => ({
    id: epic.id,
    name: epic.name,
    description: epic.description,
    priority: epic.priority,
    status: epic.status,
    start_date: epic.start_date,
    end_date: epic.end_date,
    totalIssues: totalMap.get(epic.id) ?? 0,
    doneIssues: doneMap.get(epic.id) ?? 0,
    owner: epic.owner_id ? (ownerMap.get(epic.owner_id) ?? null) : null,
  }));

  return (
    <EpicsClient
      projectId={projectId}
      projectName={project.name}
      initialEpics={initialEpics}
      initialHasMore={hasMore}
      initialTotal={initialTotal}
    />
  );
}
