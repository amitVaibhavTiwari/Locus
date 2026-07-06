"use server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { notify } from "@/lib/notifications";

const LABEL_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#84cc16",
];

async function ensureLabel(
  orgId: string,
  projectId: string,
  name: string,
): Promise<string> {
  const existing = await db
    .selectFrom("labels")
    .where("organization_id", "=", orgId)
    .where("name", "=", name)
    .select(["id"])
    .executeTakeFirst();
  if (existing) return existing.id;
  const id = randomUUID();
  await db
    .insertInto("labels")
    .values({
      id,
      organization_id: orgId,
      project_id: projectId,
      name,
      color: LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)],
      created_at: new Date().toISOString(),
    })
    .execute();
  return id;
}

async function getColumnIdForStatus(
  boardId: string,
  status: string,
): Promise<string | null> {
  const col = await db
    .selectFrom("columns")
    .where("board_id", "=", boardId)
    .where("key", "=", status)
    .select(["id"])
    .executeTakeFirst();
  return col?.id ?? null;
}

async function getProjectBoard(projectId: string) {
  return db
    .selectFrom("boards")
    .where("project_id", "=", projectId)
    .select(["id"])
    .executeTakeFirst();
}

async function nextIssueNumber(projectId: string): Promise<number> {
  const last = await db
    .selectFrom("issues")
    .where("project_id", "=", projectId)
    .select(["issue_number"])
    .orderBy("issue_number", "desc")
    .limit(1)
    .executeTakeFirst();
  return (last?.issue_number ?? 0) + 1;
}

export type IssueActionState = { error?: string; issueId?: string } | undefined;

export async function createIssue(
  state: IssueActionState,
  formData: FormData,
): Promise<IssueActionState> {
  const session = await verifySession();

  const projectId = formData.get("project_id")?.toString();
  if (!projectId) return { error: "Missing project" };

  const title = formData.get("title")?.toString().trim();
  if (!title) return { error: "Title is required" };

  const description = formData.get("description")?.toString().trim() || null;
  const status = formData.get("status")?.toString() || "todo";
  const priority = formData.get("priority")?.toString() || "medium";
  const type = formData.get("type")?.toString() || "task";
  const assigneeId = formData.get("assignee_id")?.toString() || null;
  const reporterId = formData.get("reporter_id")?.toString() || session.user.id;
  const dueDate = formData.get("due_date")?.toString() || null;
  const labelsJson = formData.get("labels")?.toString();
  const labelNames: string[] = labelsJson ? JSON.parse(labelsJson) : [];
  const epicId = formData.get("epic_id")?.toString() || null;
  const sprintId = formData.get("sprint_id")?.toString() || null;
  const editPermission =
    (formData.get("edit_permission")?.toString() as
      | "anyone"
      | "assignee_only"
      | "reporter_only") || "anyone";
  const storyPointsRaw = formData.get("story_points")?.toString();
  const storyPoints = storyPointsRaw
    ? parseFloat(storyPointsRaw) || null
    : null;

  const project = await db
    .selectFrom("projects")
    .where("id", "=", projectId)
    .select(["organization_id"])
    .executeTakeFirst();
  if (!project) return { error: "Project not found" };

  const board = await getProjectBoard(projectId);
  if (!board) return { error: "No board found for this project" };

  const [columnId, issueNumber, lastCol] = await Promise.all([
    getColumnIdForStatus(board.id, status),
    nextIssueNumber(projectId),
    db
      .selectFrom("columns")
      .where("board_id", "=", board.id)
      .orderBy("order_index", "desc")
      .limit(1)
      .select(["id"])
      .executeTakeFirst(),
  ]);

  const issueId = randomUUID();
  const now = new Date().toISOString();
  const completedAt = columnId && lastCol?.id === columnId ? now : null;

  await db
    .insertInto("issues")
    .values({
      id: issueId,
      organization_id: project.organization_id,
      project_id: projectId,
      sprint_id: sprintId,
      epic_id: epicId,
      board_id: board.id,
      column_id: columnId,
      parent_issue_id: null,
      issue_number: issueNumber,
      title,
      description,
      type: type as "task" | "story" | "bug" | "subtask",
      status,
      priority,
      reporter_id: reporterId,
      assignee_id: assigneeId || null,
      due_date: dueDate,
      completed_at: completedAt,
      edit_permission: editPermission,
      story_points: storyPoints,
      archived: 0,
      archived_at: null,
      created_at: now,
      updated_at: now,
    })
    .execute();

  if (labelNames.length > 0) {
    const labelIds = await Promise.all(
      labelNames.map((name) =>
        ensureLabel(project.organization_id, projectId, name),
      ),
    );
    await db
      .insertInto("issue_labels")
      .values(
        labelIds.map((labelId) => ({
          id: randomUUID(),
          issue_id: issueId,
          label_id: labelId,
        })),
      )
      .execute();
  }

  after(async () => {
    await db
      .insertInto("activities")
      .values({
        id: randomUUID(),
        organization_id: project.organization_id,
        project_id: projectId,
        issue_id: issueId,
        user_id: session.user.id,
        type: "created",
        payload: JSON.stringify({ title }),
        created_at: new Date().toISOString(),
      })
      .execute();
  });

  revalidatePath(`/project/${projectId}`);
  return { issueId };
}

export async function moveIssue(
  issueId: string,
  newStatus: string,
): Promise<{ error?: string }> {
  const session = await verifySession();

  const issue = await db
    .selectFrom("issues")
    .where("id", "=", issueId)
    .select(["project_id", "organization_id", "board_id", "status"])
    .executeTakeFirst();
  if (!issue) return { error: "Issue not found" };

  const columnId = issue.board_id
    ? await getColumnIdForStatus(issue.board_id, newStatus)
    : null;

  let completedAt: string | null = null;
  if (issue.board_id && columnId) {
    const lastCol = await db
      .selectFrom("columns")
      .where("board_id", "=", issue.board_id)
      .orderBy("order_index", "desc")
      .limit(1)
      .select(["id"])
      .executeTakeFirst();
    if (lastCol?.id === columnId) completedAt = new Date().toISOString();
  }

  const now = new Date().toISOString();
  await db
    .updateTable("issues")
    .set({
      status: newStatus,
      column_id: columnId,
      completed_at: completedAt,
      updated_at: now,
    })
    .where("id", "=", issueId)
    .execute();

  after(async () => {
    await db
      .insertInto("activities")
      .values({
        id: randomUUID(),
        organization_id: issue.organization_id,
        project_id: issue.project_id,
        issue_id: issueId,
        user_id: session.user.id,
        type: "moved",
        payload: JSON.stringify({ from: issue.status, to: newStatus }),
        created_at: new Date().toISOString(),
      })
      .execute();
  });

  revalidatePath(`/project/${issue.project_id}`);
  return {};
}

export async function updateIssue(
  state: IssueActionState,
  formData: FormData,
): Promise<IssueActionState> {
  const session = await verifySession();

  const issueId = formData.get("issue_id")?.toString();
  if (!issueId) return { error: "Missing issue ID" };

  const title = formData.get("title")?.toString().trim();
  if (!title) return { error: "Title is required" };

  const description = formData.get("description")?.toString().trim() || null;
  const priority = formData.get("priority")?.toString() || "medium";
  const assigneeId = formData.get("assignee_id")?.toString() || null;
  const dueDate = formData.get("due_date")?.toString() || null;
  const epicId = formData.get("epic_id")?.toString() || null;
  const sprintIdRaw = formData.get("sprint_id")?.toString();
  const sprintId =
    sprintIdRaw && sprintIdRaw !== "__none__" ? sprintIdRaw : null;
  const editPermission = formData.get("edit_permission")?.toString() as
    | "anyone"
    | "assignee_only"
    | "reporter_only"
    | undefined;
  const labelsJson = formData.get("labels")?.toString();
  const labelNames: string[] = labelsJson ? JSON.parse(labelsJson) : [];
  const spRaw = formData.get("story_points")?.toString();
  const storyPoints = spRaw ? parseFloat(spRaw) || null : null;

  const issue = await db
    .selectFrom("issues")
    .where("id", "=", issueId)
    .select([
      "project_id",
      "organization_id",
      "reporter_id",
      "assignee_id",
      "edit_permission",
      "title",
      "description",
      "priority",
      "due_date",
      "epic_id",
      "sprint_id",
      "story_points",
      "issue_number",
    ])
    .executeTakeFirst();
  if (!issue) return { error: "Issue not found" };

  if (
    issue.edit_permission === "assignee_only" &&
    issue.assignee_id !== session.user.id
  ) {
    return { error: "Only the assignee can edit this issue" };
  }
  if (
    issue.edit_permission === "reporter_only" &&
    issue.reporter_id !== session.user.id
  ) {
    return { error: "Only the reporter can edit this issue" };
  }

  const changes: { field: string; from: string | null; to: string | null }[] =
    [];
  if (issue.title !== title)
    changes.push({ field: "title", from: issue.title, to: title });
  if (issue.priority !== priority)
    changes.push({ field: "priority", from: issue.priority, to: priority });
  if ((issue.assignee_id ?? null) !== (assigneeId ?? null))
    changes.push({
      field: "assignee",
      from: issue.assignee_id,
      to: assigneeId,
    });
  if ((issue.due_date ?? null) !== (dueDate ?? null))
    changes.push({ field: "due_date", from: issue.due_date, to: dueDate });
  if ((issue.epic_id ?? null) !== (epicId ?? null))
    changes.push({ field: "epic", from: issue.epic_id, to: epicId });
  if ((issue.sprint_id ?? null) !== (sprintId ?? null))
    changes.push({ field: "sprint", from: issue.sprint_id, to: sprintId });
  if (editPermission && issue.edit_permission !== editPermission)
    changes.push({
      field: "edit_permission",
      from: issue.edit_permission,
      to: editPermission,
    });
  if ((issue.story_points ?? null) !== storyPoints)
    changes.push({
      field: "story_points",
      from: issue.story_points?.toString() ?? null,
      to: storyPoints?.toString() ?? null,
    });

  const now = new Date().toISOString();
  await db
    .updateTable("issues")
    .set({
      title,
      description,
      priority,
      assignee_id: assigneeId || null,
      due_date: dueDate,
      epic_id: epicId || null,
      sprint_id: sprintId,
      story_points: storyPoints,
      ...(editPermission ? { edit_permission: editPermission } : {}),
      updated_at: now,
    })
    .where("id", "=", issueId)
    .execute();

  await db.deleteFrom("issue_labels").where("issue_id", "=", issueId).execute();
  if (labelNames.length > 0) {
    const labelIds = await Promise.all(
      labelNames.map((name) =>
        ensureLabel(issue.organization_id, issue.project_id, name),
      ),
    );
    await db
      .insertInto("issue_labels")
      .values(
        labelIds.map((labelId) => ({
          id: randomUUID(),
          issue_id: issueId,
          label_id: labelId,
        })),
      )
      .execute();
  }

  after(async () => {
    if (changes.length === 0) return;
    await db
      .insertInto("activities")
      .values({
        id: randomUUID(),
        organization_id: issue.organization_id,
        project_id: issue.project_id,
        issue_id: issueId,
        user_id: session.user.id,
        type: "updated",
        payload: JSON.stringify({ changes }),
        created_at: new Date().toISOString(),
      })
      .execute();
  });

  // notify if asignee changes and it's not the current user
  if (
    assigneeId &&
    assigneeId !== issue.assignee_id &&
    assigneeId !== session.user.id
  ) {
    after(async () => {
      const [assigner, assignee, org] = await Promise.all([
        db
          .selectFrom("users")
          .where("id", "=", session.user.id)
          .select(["username"])
          .executeTakeFirst(),
        db
          .selectFrom("users")
          .where("id", "=", assigneeId)
          .select(["username"])
          .executeTakeFirst(),
        db
          .selectFrom("organizations")
          .where("id", "=", issue.organization_id)
          .select(["name"])
          .executeTakeFirst(),
      ]);

      const shortTitle = title.length > 55 ? title.slice(0, 55) + "…" : title;
      const workspace = org?.name ?? "Locus";

      await notify(assigneeId, issue.organization_id, {
        type: "task_assigned",
        title: `Task assigned to you — ${workspace}`,
        body: `Hi ${assignee?.username ?? "there"}, ${assigner?.username ?? "Someone"} assigned "${shortTitle}" to you`,
        url: `/project/${issue.project_id}/board?task=${issueId}`,
        entityType: "issue",
        entityId: issueId,
      });
    });
  }

  if (epicId && (issue.epic_id ?? null) !== epicId) {
    after(async () => {
      await db
        .insertInto("activities")
        .values({
          id: randomUUID(),
          organization_id: issue.organization_id,
          project_id: issue.project_id,
          issue_id: null,
          epic_id: epicId,
          user_id: session.user.id,
          type: "task_added",
          payload: JSON.stringify({
            issue_id: issueId,
            issue_number: issue.issue_number,
            title: issue.title,
          }),
          created_at: new Date().toISOString(),
        })
        .execute();
    });
  }

  if ((issue.sprint_id ?? null) !== (sprintId ?? null)) {
    if (sprintId) {
      after(async () => {
        const sprint = await db
          .selectFrom("sprints")
          .where("id", "=", sprintId)
          .select(["status"])
          .executeTakeFirst();
        if (sprint?.status === "active") {
          await db
            .insertInto("activities")
            .values({
              id: randomUUID(),
              organization_id: issue.organization_id,
              project_id: issue.project_id,
              issue_id: issueId,
              sprint_id: sprintId,
              user_id: session.user.id,
              type: "task_added_mid_sprint",
              payload: JSON.stringify({
                issue_number: issue.issue_number,
                title: issue.title,
              }),
              created_at: new Date().toISOString(),
            })
            .execute();
        }
      });
    }
    if (issue.sprint_id) {
      after(async () => {
        const oldSprint = await db
          .selectFrom("sprints")
          .where("id", "=", issue.sprint_id!)
          .select(["status"])
          .executeTakeFirst();
        if (oldSprint?.status === "active") {
          await db
            .insertInto("activities")
            .values({
              id: randomUUID(),
              organization_id: issue.organization_id,
              project_id: issue.project_id,
              issue_id: issueId,
              sprint_id: issue.sprint_id!,
              user_id: session.user.id,
              type: "task_removed_mid_sprint",
              payload: JSON.stringify({
                issue_number: issue.issue_number,
                title: issue.title,
              }),
              created_at: new Date().toISOString(),
            })
            .execute();
        }
      });
    }
  }

  revalidatePath(`/project/${issue.project_id}`);
  return undefined;
}

export async function deleteIssue(
  issueId: string,
): Promise<{ error?: string }> {
  await verifySession();

  const issue = await db
    .selectFrom("issues")
    .where("id", "=", issueId)
    .select(["project_id"])
    .executeTakeFirst();
  if (!issue) return { error: "Issue not found" };

  await db.deleteFrom("issues").where("id", "=", issueId).execute();

  revalidatePath(`/project/${issue.project_id}`);
  return {};
}

export async function archiveIssue(
  issueId: string,
): Promise<{ error?: string }> {
  const session = await verifySession();

  const issue = await db
    .selectFrom("issues")
    .where("id", "=", issueId)
    .select(["project_id", "organization_id", "sprint_id", "epic_id"])
    .executeTakeFirst();
  if (!issue) return { error: "Issue not found" };

  const membership = await db
    .selectFrom("project_members")
    .where("project_id", "=", issue.project_id)
    .where("user_id", "=", session.user.id)
    .where("role", "=", "manager")
    .select("id")
    .executeTakeFirst();

  if (!membership) return { error: "Only project managers can archive tasks" };

  if (issue.sprint_id) {
    return { error: "Remove this task from its sprint before archiving." };
  }
  if (issue.epic_id) {
    return { error: "Remove this task from its epic before archiving." };
  }

  await db
    .updateTable("issues")
    .set({ archived: 1, archived_at: new Date().toISOString() })
    .where("id", "=", issueId)
    .execute();

  after(async () => {
    await db
      .insertInto("activities")
      .values({
        id: randomUUID(),
        organization_id: issue.organization_id,
        project_id: issue.project_id,
        issue_id: issueId,
        user_id: session.user.id,
        type: "issue_archived",
        payload: "{}",
        created_at: new Date().toISOString(),
      })
      .execute();
  });

  revalidatePath(`/project/${issue.project_id}`);
  revalidatePath(`/project/${issue.project_id}/archived`);
  return {};
}
