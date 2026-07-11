import { notFound, redirect } from "next/navigation";
import {
  getUserIdFromRequest,
  getOrgIdFromRequest,
  getProject,
  getProjectSprints,
} from "@/lib/dal";
import { db } from "@/lib/db";
import { BacklogClient } from "./BacklogClient";

const PAGE_SIZE = 20;

export default async function ProjectBacklogPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const userId = await getUserIdFromRequest();
  if (!userId) redirect("/login");

  const orgId = await getOrgIdFromRequest();
  if (!orgId) redirect("/onboarding/workspace");

  const [project, allSprints] = await Promise.all([
    getProject(projectId, orgId, userId),
    getProjectSprints(projectId),
  ]);

  if (!project) notFound();

  const backlogBaseQuery = db
    .selectFrom("issues")
    .where("project_id", "=", projectId)
    .where("sprint_id", "is", null)
    .where("parent_issue_id", "is", null)
    .where("archived", "=", 0);

  const [firstRows, countRow] = await Promise.all([
    backlogBaseQuery
      .select([
        "id",
        "issue_number",
        "title",
        "description",
        "status",
        "priority",
        "type",
        "due_date",
        "created_at",
        "completed_at",
        "assignee_id",
        "reporter_id",
        "epic_id",
      ])
      .orderBy("created_at", "desc")
      .limit(PAGE_SIZE + 1)
      .execute(),
    backlogBaseQuery
      .select((eb) => eb.fn.countAll<number>().as("total"))
      .executeTakeFirst(),
  ]);

  const hasMore = firstRows.length > PAGE_SIZE;
  const rawIssues = firstRows.slice(0, PAGE_SIZE);
  const initialTotal = Number(countRow?.total ?? 0);

  const userIds = new Set<string>();
  rawIssues.forEach((i) => {
    if (i.assignee_id) userIds.add(i.assignee_id);
    if (i.reporter_id) userIds.add(i.reporter_id);
  });
  const users =
    userIds.size > 0
      ? await db
          .selectFrom("users")
          .where("id", "in", [...userIds])
          .select(["id", "username", "avatar_url"])
          .execute()
      : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const issueIds = rawIssues.map((i) => i.id);
  const labelRows =
    issueIds.length > 0
      ? await db
          .selectFrom("issue_labels")
          .innerJoin("labels", "labels.id", "issue_labels.label_id")
          .where("issue_labels.issue_id", "in", issueIds)
          .select(["issue_labels.issue_id", "labels.name"])
          .execute()
      : [];
  const labelMap = new Map<string, string[]>();
  labelRows.forEach((r) => {
    const arr = labelMap.get(r.issue_id) ?? [];
    arr.push(r.name);
    labelMap.set(r.issue_id, arr);
  });

  const epicIds = [
    ...new Set(rawIssues.map((i) => i.epic_id).filter(Boolean)),
  ] as string[];
  const epicRows =
    epicIds.length > 0
      ? await db
          .selectFrom("epics")
          .where("id", "in", epicIds)
          .select(["id", "name"])
          .execute()
      : [];
  const epicMap = new Map(epicRows.map((e) => [e.id, e.name]));

  const initialIssues = rawIssues.map((issue) => ({
    id: issue.id,
    issue_number: issue.issue_number,
    title: issue.title,
    description: issue.description,
    status: issue.status,
    priority: issue.priority,
    type: issue.type,
    due_date: issue.due_date,
    created_at: issue.created_at,
    completed_at: issue.completed_at,
    labels: labelMap.get(issue.id) ?? [],
    epic_name: issue.epic_id ? (epicMap.get(issue.epic_id) ?? null) : null,
    assignee: issue.assignee_id
      ? (userMap.get(issue.assignee_id) ?? null)
      : null,
    reporter: issue.reporter_id
      ? (userMap.get(issue.reporter_id) ?? null)
      : null,
  }));

  const sprints = allSprints
    .filter((s) => s.status === "active" || s.status === "planned")
    .map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status as "active" | "planned",
    }));

  return (
    <BacklogClient
      projectId={projectId}
      projectName={project.name}
      initialIssues={initialIssues}
      initialHasMore={hasMore}
      initialTotal={initialTotal}
      sprints={sprints}
    />
  );
}
