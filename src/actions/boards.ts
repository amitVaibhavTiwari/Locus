"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";

async function getProjectIdForColumn(columnId: string): Promise<string | null> {
  const column = await db
    .selectFrom("columns")
    .where("id", "=", columnId)
    .select(["board_id"])
    .executeTakeFirst();
  if (!column) return null;

  const board = await db
    .selectFrom("boards")
    .where("id", "=", column.board_id)
    .select(["project_id"])
    .executeTakeFirst();
  return board?.project_id ?? null;
}

async function verifyBoardAccess(boardId: string, userId: string) {
  const board = await db
    .selectFrom("boards")
    .where("id", "=", boardId)
    .select(["project_id"])
    .executeTakeFirst();
  if (!board) return null;

  const project = await db
    .selectFrom("projects")
    .where("id", "=", board.project_id)
    .select(["organization_id"])
    .executeTakeFirst();
  if (!project) return null;

  const member = await db
    .selectFrom("organization_members")
    .where("organization_id", "=", project.organization_id)
    .where("user_id", "=", userId)
    .select(["role"])
    .executeTakeFirst();

  return member
    ? { ...board, organizationId: project.organization_id, role: member.role }
    : null;
}

export async function reorderColumns(
  boardId: string,
  columnIds: string[],
): Promise<{ error?: string }> {
  const session = await verifySession();

  const access = await verifyBoardAccess(boardId, session.user.id);
  if (!access) return { error: "Board not found or access denied" };

  for (let i = 0; i < columnIds.length; i++) {
    await db
      .updateTable("columns")
      .set({ order_index: i })
      .where("id", "=", columnIds[i])
      .where("board_id", "=", boardId)
      .execute();
  }

  revalidatePath(`/project/${access.project_id}`);
  return {};
}

export async function updateColumn(
  columnId: string,
  data: { name?: string; wip_limit?: number | null },
): Promise<{ error?: string }> {
  const session = await verifySession();

  const projectId = await getProjectIdForColumn(columnId);
  if (!projectId) return { error: "Column not found" };

  const project = await db
    .selectFrom("projects")
    .where("id", "=", projectId)
    .select(["organization_id"])
    .executeTakeFirst();
  if (!project) return { error: "Project not found" };

  const member = await db
    .selectFrom("organization_members")
    .where("organization_id", "=", project.organization_id)
    .where("user_id", "=", session.user.id)
    .select(["role"])
    .executeTakeFirst();

  if (!member || !["owner", "admin"].includes(member.role))
    return { error: "Insufficient permissions" };

  const updates: Record<string, string | number | null> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.wip_limit !== undefined) updates.wip_limit = data.wip_limit;

  if (Object.keys(updates).length > 0) {
    await db
      .updateTable("columns")
      .set(updates)
      .where("id", "=", columnId)
      .execute();
  }

  revalidatePath(`/project/${projectId}`);
  return {};
}
