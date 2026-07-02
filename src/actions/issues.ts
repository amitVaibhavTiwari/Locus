"use server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";

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
  const dueDate = formData.get("due_date")?.toString() || null;

  const project = await db
    .selectFrom("projects")
    .where("id", "=", projectId)
    .select(["organization_id"])
    .executeTakeFirst();
  if (!project) return { error: "Project not found" };

  const board = await getProjectBoard(projectId);
  if (!board) return { error: "No board found for this project" };

  const [columnId, issueNumber] = await Promise.all([
    getColumnIdForStatus(board.id, status),
    nextIssueNumber(projectId),
  ]);

  const issueId = randomUUID();
  const now = new Date().toISOString();

  await db
    .insertInto("issues")
    .values({
      id: issueId,
      organization_id: project.organization_id,
      project_id: projectId,
      board_id: board.id,
      column_id: columnId,
      parent_issue_id: null,
      issue_number: issueNumber,
      title,
      description,
      type: type as "task" | "story" | "bug" | "subtask",
      status,
      priority,
      reporter_id: session.user.id,
      assignee_id: assigneeId || null,
      due_date: dueDate,
      completed_at: null,
      created_at: now,
      updated_at: now,
    })
    .execute();

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

  const now = new Date().toISOString();
  await db
    .updateTable("issues")
    .set({ status: newStatus, column_id: columnId, updated_at: now })
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

  const issue = await db
    .selectFrom("issues")
    .where("id", "=", issueId)
    .select(["project_id", "organization_id"])
    .executeTakeFirst();
  if (!issue) return { error: "Issue not found" };

  const now = new Date().toISOString();
  await db
    .updateTable("issues")
    .set({
      title,
      description,
      priority,
      assignee_id: assigneeId || null,
      due_date: dueDate,
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
        type: "updated",
        payload: JSON.stringify({ title }),
        created_at: new Date().toISOString(),
      })
      .execute();
  });

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
