import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const PAGE_SIZE = 20;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") ?? "";
  const priority = searchParams.get("priority") ?? "";
  const assigneeId = searchParams.get("assigneeId") ?? "";
  const reporterId = searchParams.get("reporterId") ?? "";
  const sort = searchParams.get("sort") ?? "created_at_desc";
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));

  const baseQuery = db
    .selectFrom("issues")
    .where("project_id", "=", projectId)
    .where("sprint_id", "is", null)
    .where("parent_issue_id", "is", null)
    .$if(!!search, (qb) => qb.where("title", "like", `%${search}%`))
    .$if(!!priority && priority !== "all", (qb) =>
      qb.where("priority", "=", priority),
    )
    .$if(assigneeId === "none", (qb) => qb.where("assignee_id", "is", null))
    .$if(!!assigneeId && assigneeId !== "none", (qb) =>
      qb.where("assignee_id", "=", assigneeId),
    )
    .$if(!!reporterId, (qb) => qb.where("reporter_id", "=", reporterId));

  const [rows, countRow] = await Promise.all([
    baseQuery
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
      .orderBy("created_at", sort === "created_at_asc" ? "asc" : "desc")
      .orderBy("issue_number", sort === "created_at_asc" ? "asc" : "desc")
      .offset(offset)
      .limit(PAGE_SIZE + 1)
      .execute(),
    baseQuery
      .select((eb) => eb.fn.countAll<number>().as("total"))
      .executeTakeFirst(),
  ]);

  const hasMore = rows.length > PAGE_SIZE;
  const issues = rows.slice(0, PAGE_SIZE);
  const total = Number(countRow?.total ?? 0);

  if (issues.length === 0) {
    return NextResponse.json({ issues: [], hasMore: false, total });
  }

  const userIds = new Set<string>();
  issues.forEach((i) => {
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

  const issueIds = issues.map((i) => i.id);
  const labelRows = await db
    .selectFrom("issue_labels")
    .innerJoin("labels", "labels.id", "issue_labels.label_id")
    .where("issue_labels.issue_id", "in", issueIds)
    .select(["issue_labels.issue_id", "labels.name"])
    .execute();
  const labelMap = new Map<string, string[]>();
  labelRows.forEach((r) => {
    const arr = labelMap.get(r.issue_id) ?? [];
    arr.push(r.name);
    labelMap.set(r.issue_id, arr);
  });

  const epicIds = [
    ...new Set(issues.map((i) => i.epic_id).filter(Boolean)),
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

  const enriched = issues.map((issue) => ({
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

  return NextResponse.json({ issues: enriched, hasMore, total });
}
