import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { db } from "@/lib/db";
import { EditTaskClient } from "./EditTaskClient";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: issueId } = await params;
  const session = await verifySession();

  const issue = await db
    .selectFrom("issues")
    .where("id", "=", issueId)
    .select([
      "id",
      "title",
      "description",
      "status",
      "priority",
      "type",
      "assignee_id",
      "reporter_id",
      "due_date",
      "epic_id",
      "sprint_id",
      "project_id",
      "board_id",
      "edit_permission",
      "story_points",
    ])
    .executeTakeFirst();

  if (!issue) redirect("/");

  if (
    issue.edit_permission === "assignee_only" &&
    issue.assignee_id !== session.user.id
  ) {
    redirect(`/project/${issue.project_id}`);
  }
  if (
    issue.edit_permission === "reporter_only" &&
    issue.reporter_id !== session.user.id
  ) {
    redirect(`/project/${issue.project_id}`);
  }

  const [
    project,
    reporter,
    assignee,
    labelRows,
    epic,
    members,
    statuses,
    sprints,
  ] = await Promise.all([
    db
      .selectFrom("projects")
      .where("id", "=", issue.project_id)
      .select(["name"])
      .executeTakeFirst(),
    db
      .selectFrom("users")
      .where("id", "=", issue.reporter_id)
      .select(["id", "username", "email", "avatar_url"])
      .executeTakeFirst(),
    issue.assignee_id
      ? db
          .selectFrom("users")
          .where("id", "=", issue.assignee_id)
          .select(["id", "username", "email", "avatar_url"])
          .executeTakeFirst()
      : Promise.resolve(null),
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
          .select(["id", "name"])
          .executeTakeFirst()
      : Promise.resolve(null),
    db
      .selectFrom("project_members")
      .innerJoin("users", "users.id", "project_members.user_id")
      .where("project_members.project_id", "=", issue.project_id)
      .select(["users.id", "users.username", "users.email", "users.avatar_url"])
      .execute(),
    issue.board_id
      ? db
          .selectFrom("columns")
          .where("board_id", "=", issue.board_id)
          .select(["key", "name"])
          .orderBy("order_index", "asc")
          .execute()
      : Promise.resolve([]),
    db
      .selectFrom("sprints")
      .where("project_id", "=", issue.project_id)
      .where("status", "!=", "completed")
      .select(["id", "name", "status"])
      .execute(),
  ]);

  if (!project) redirect("/");

  return (
    <EditTaskClient
      issue={{
        id: issue.id,
        title: issue.title,
        description: issue.description ?? "",
        status: issue.status,
        priority: issue.priority,
        type: issue.type,
        dueDate: issue.due_date,
        editPermission: issue.edit_permission,
        sprintId: issue.sprint_id,
        storyPoints: issue.story_points ?? null,
        labels: labelRows.map((l) => l.name),
        epic: epic ? { id: epic.id, name: epic.name } : null,
        assignee: assignee
          ? {
              id: assignee.id,
              username: assignee.username,
              email: assignee.email,
              avatar_url: assignee.avatar_url,
            }
          : null,
        reporter: reporter
          ? {
              id: reporter.id,
              username: reporter.username,
              email: reporter.email,
              avatar_url: reporter.avatar_url,
            }
          : {
              id: issue.reporter_id,
              username: "Unknown",
              email: "",
              avatar_url: null,
            },
      }}
      projectId={issue.project_id}
      projectName={project.name}
      statuses={statuses.map((s) => ({
        key: s.key ?? s.name.toLowerCase().replace(/\s+/g, "-"),
        name: s.name,
      }))}
      sprints={sprints}
      initialMembers={members.map((m) => ({
        id: m.id,
        username: m.username,
        email: m.email,
        avatar_url: m.avatar_url,
      }))}
    />
  );
}
