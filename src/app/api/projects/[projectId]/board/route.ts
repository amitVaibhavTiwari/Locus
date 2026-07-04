import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "kysely";
import { auth } from "@/lib/auth";

const PAGE_SIZE_KANBAN = 20;
const PAGE_SIZE_TABLE = 50;

function getInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "??"
  );
}

type IssueRow = {
  id: string;
  issue_number: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  type: string | null;
  sprint_id: string | null;
  epic_id: string | null;
  assignee_id: string | null;
  reporter_id: string | null;
  due_date: string | null;
  created_at: string;
};

async function enrichIssues(issues: IssueRow[]) {
  if (issues.length === 0) return [];

  const userIds = new Set<string>();
  issues.forEach((i) => {
    if (i.assignee_id) userIds.add(i.assignee_id);
    if (i.reporter_id) userIds.add(i.reporter_id);
  });

  const issueIds = issues.map((i) => i.id);
  const epicIds = [
    ...new Set(issues.map((i) => i.epic_id).filter(Boolean)),
  ] as string[];

  const [users, labelRows, epicRows] = await Promise.all([
    userIds.size > 0
      ? db
          .selectFrom("users")
          .where("id", "in", [...userIds])
          .select(["id", "username", "avatar_url"])
          .execute()
      : Promise.resolve(
          [] as { id: string; username: string; avatar_url: string | null }[],
        ),
    db
      .selectFrom("issue_labels")
      .innerJoin("labels", "labels.id", "issue_labels.label_id")
      .where("issue_labels.issue_id", "in", issueIds)
      .select(["issue_labels.issue_id", "labels.name"])
      .execute(),
    epicIds.length > 0
      ? db
          .selectFrom("epics")
          .where("id", "in", epicIds)
          .select(["id", "name"])
          .execute()
      : Promise.resolve([] as { id: string; name: string }[]),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));

  const labelMap = new Map<string, string[]>();
  labelRows.forEach((r) => {
    const arr = labelMap.get(r.issue_id) ?? [];
    arr.push(r.name);
    labelMap.set(r.issue_id, arr);
  });

  const epicMap = new Map(epicRows.map((e) => [e.id, e.name]));

  return issues.map((issue) => {
    const assignee = issue.assignee_id ? userMap.get(issue.assignee_id) : null;
    const reporter = issue.reporter_id ? userMap.get(issue.reporter_id) : null;
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description ?? undefined,
      status: issue.status,
      priority: issue.priority as
        | "highest"
        | "high"
        | "medium"
        | "low"
        | "none",
      issueNumber: issue.issue_number,
      type: (issue.type ?? "task") as "task" | "story" | "bug" | "subtask",
      sprintId: issue.sprint_id,
      epicId: issue.epic_id,
      epicName: issue.epic_id ? (epicMap.get(issue.epic_id) ?? null) : null,
      assigneeId: issue.assignee_id,
      reporterId: issue.reporter_id,
      dueDate: issue.due_date ?? undefined,
      createdAt: issue.created_at,
      labels: labelMap.get(issue.id) ?? [],
      assignee: assignee
        ? {
            name: assignee.username,
            avatar: assignee.avatar_url ?? undefined,
            initials: getInitials(assignee.username),
          }
        : undefined,
      reporter: reporter
        ? { name: reporter.username, initials: getInitials(reporter.username) }
        : undefined,
    };
  });
}

const VALID_SORT_FIELDS = [
  "issue_number",
  "created_at",
  "due_date",
  "priority",
  "status",
  "title",
] as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const sp = req.nextUrl.searchParams;

  const view = sp.get("view") ?? "kanban";
  const sprintFilter = sp.get("sprintFilter") ?? "all";
  const activeSprintId = sp.get("activeSprintId") ?? "";
  const priority = sp.get("priority") ?? "all";
  const assigneeId = sp.get("assigneeId") ?? "all";
  const reporterId = sp.get("reporterId") ?? "all";

  const project = await db
    .selectFrom("projects")
    .where("id", "=", projectId)
    .select(["id", "organization_id"])
    .executeTakeFirst();

  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await db
    .selectFrom("organization_members")
    .where("organization_id", "=", project.organization_id)
    .where("user_id", "=", session.user.id)
    .select("id")
    .executeTakeFirst();

  if (!membership)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const SELECT_FIELDS = [
    "issues.id",
    "issues.issue_number",
    "issues.title",
    "issues.description",
    "issues.status",
    "issues.priority",
    "issues.type",
    "issues.sprint_id",
    "issues.epic_id",
    "issues.assignee_id",
    "issues.reporter_id",
    "issues.due_date",
    "issues.created_at",
  ] as const;

  const base = db
    .selectFrom("issues")
    .where("issues.project_id", "=", projectId)
    .where("issues.parent_issue_id", "is", null)
    .$if(sprintFilter === "current" && !!activeSprintId, (q) =>
      q.where("issues.sprint_id", "=", activeSprintId),
    )
    .$if(priority !== "all", (q) => q.where("issues.priority", "=", priority))
    .$if(assigneeId !== "all", (q) =>
      q.where("issues.assignee_id", "=", assigneeId),
    )
    .$if(reporterId !== "all", (q) =>
      q.where("issues.reporter_id", "=", reporterId),
    );

  if (view === "kanban") {
    const status = sp.get("status");
    if (!status) {
      return NextResponse.json(
        { error: "status is required for kanban view" },
        { status: 400 },
      );
    }

    const offset = Math.max(0, parseInt(sp.get("offset") ?? "0"));

    const rows = await base
      .where("issues.status", "=", status)
      .select(SELECT_FIELDS)
      .orderBy("issues.issue_number", "desc")
      .limit(PAGE_SIZE_KANBAN + 1)
      .offset(offset)
      .execute();

    const hasMore = rows.length > PAGE_SIZE_KANBAN;
    const tasks = await enrichIssues(
      hasMore ? rows.slice(0, PAGE_SIZE_KANBAN) : rows,
    );

    return NextResponse.json({ tasks, hasMore });
  }

  if (view === "table") {
    const offset = Math.max(0, parseInt(sp.get("offset") ?? "0"));
    const sort = sp.get("sort") ?? "created_at:desc";
    const [rawField, rawDir] = sort.split(":");
    const sortField = (VALID_SORT_FIELDS as readonly string[]).includes(
      rawField,
    )
      ? rawField
      : "created_at";
    const sortDir = rawDir === "desc" ? "desc" : "asc";

    const priorityCaseExpr = sql<number>`CASE issues.priority WHEN 'highest' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END`;

    const rows = await base
      .select(SELECT_FIELDS)
      .$if(sortField === "priority", (q) =>
        q.orderBy(priorityCaseExpr, sortDir),
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .$if(sortField !== "priority", (q) =>
        q.orderBy(`issues.${sortField}` as any, sortDir),
      )
      .limit(PAGE_SIZE_TABLE + 1)
      .offset(offset)
      .execute();

    const hasMore = rows.length > PAGE_SIZE_TABLE;
    const tasks = await enrichIssues(
      hasMore ? rows.slice(0, PAGE_SIZE_TABLE) : rows,
    );

    return NextResponse.json({ tasks, hasMore });
  }

  if (view === "calendar") {
    const now = new Date();
    const year = Math.max(
      2000,
      Math.min(2100, parseInt(sp.get("year") ?? String(now.getFullYear()))),
    );
    const month = Math.max(
      1,
      Math.min(12, parseInt(sp.get("month") ?? String(now.getMonth() + 1))),
    );

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const rows = await base
      .where("issues.due_date", ">=", startDate)
      .where("issues.due_date", "<=", endDate)
      .select(SELECT_FIELDS)
      .orderBy("issues.due_date", "asc")
      .execute();

    const tasks = await enrichIssues(rows);
    return NextResponse.json({ tasks });
  }

  return NextResponse.json({ error: "Invalid view" }, { status: 400 });
}
