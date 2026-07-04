import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { issueId } = await params;

  const issue = await db
    .selectFrom("issues")
    .where("issues.id", "=", issueId)
    .select([
      "issues.id",
      "issues.title",
      "issues.description",
      "issues.status",
      "issues.priority",
      "issues.issue_number",
      "issues.created_at",
      "issues.due_date",
      "issues.assignee_id",
      "issues.reporter_id",
      "issues.epic_id",
      "issues.parent_issue_id",
      "issues.board_id",
      "issues.organization_id",
      "issues.project_id",
      "issues.edit_permission",
    ])
    .executeTakeFirst();

  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  const membership = await db
    .selectFrom("organization_members")
    .where("organization_id", "=", issue.organization_id)
    .where("user_id", "=", session.user.id)
    .select("id")
    .executeTakeFirst();

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [assignee, reporter, labelRows, epic, parentIssue, boardStatuses] =
    await Promise.all([
      issue.assignee_id
        ? db
            .selectFrom("users")
            .where("id", "=", issue.assignee_id)
            .select(["id", "username", "email", "avatar_url"])
            .executeTakeFirst()
        : Promise.resolve(null),
      db
        .selectFrom("users")
        .where("id", "=", issue.reporter_id)
        .select(["id", "username", "email", "avatar_url"])
        .executeTakeFirst(),
      db
        .selectFrom("issue_labels")
        .innerJoin("labels", "labels.id", "issue_labels.label_id")
        .where("issue_labels.issue_id", "=", issueId)
        .select(["labels.name"])
        .execute(),
      issue.epic_id
        ? db
            .selectFrom("epics")
            .where("id", "=", issue.epic_id)
            .select(["name"])
            .executeTakeFirst()
        : Promise.resolve(null),
      issue.parent_issue_id
        ? db
            .selectFrom("issues")
            .where("id", "=", issue.parent_issue_id)
            .select(["id", "title"])
            .executeTakeFirst()
        : Promise.resolve(null),
      issue.board_id
        ? db
            .selectFrom("columns")
            .where("board_id", "=", issue.board_id)
            .select(["key", "name"])
            .orderBy("order_index", "asc")
            .execute()
        : Promise.resolve([]),
    ]);

  const initials = (name: string) =>
    name
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "??";

  return NextResponse.json({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    status: issue.status,
    priority: issue.priority,
    issue_number: issue.issue_number,
    created_at: issue.created_at,
    due_date: issue.due_date,
    project_id: issue.project_id,
    edit_permission: issue.edit_permission,
    assignee: assignee
      ? {
          id: assignee.id,
          name: assignee.username,
          initials: initials(assignee.username),
          email: assignee.email,
          avatar_url: assignee.avatar_url,
        }
      : null,
    reporter: reporter
      ? {
          id: reporter.id,
          name: reporter.username,
          initials: initials(reporter.username),
          email: reporter.email,
          avatar_url: reporter.avatar_url,
        }
      : null,
    labels: labelRows.map((l) => l.name),
    epic_name: epic?.name ?? null,
    epic_id: issue.epic_id,
    parentTask: parentIssue
      ? { id: parentIssue.id, title: parentIssue.title }
      : null,
    boardStatuses: boardStatuses.map((c) => ({
      key: c.key ?? c.name.toLowerCase().replace(/\s+/g, "-"),
      name: c.name,
    })),
  });
}
