"use server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";

export type EpicActionState = { error?: string; epicId?: string } | undefined;

async function assertManager(epicId: string, userId: string) {
  const epic = await db
    .selectFrom("epics")
    .where("id", "=", epicId)
    .select(["project_id", "status"])
    .executeTakeFirst();
  if (!epic) return { error: "Epic not found" as const, epic: null };

  const membership = await db
    .selectFrom("project_members")
    .where("project_id", "=", epic.project_id)
    .where("user_id", "=", userId)
    .where("role", "=", "manager")
    .select("id")
    .executeTakeFirst();
  if (!membership)
    return {
      error: "Only project managers can perform this action" as const,
      epic: null,
    };

  return { error: null, epic };
}

export async function createEpic(
  state: EpicActionState,
  formData: FormData,
): Promise<EpicActionState> {
  const session = await verifySession();

  const projectId = formData.get("project_id")?.toString();
  if (!projectId) return { error: "Missing project" };

  const name = formData.get("name")?.toString().trim();
  if (!name) return { error: "Name is required" };

  const description = formData.get("description")?.toString().trim() || null;
  const priority = formData.get("priority")?.toString() || "medium";
  const status = formData.get("status")?.toString() || "planned";
  const ownerId = formData.get("owner_id")?.toString() || null;
  const startDate = formData.get("start_date")?.toString() || null;
  const endDate = formData.get("end_date")?.toString() || null;

  const project = await db
    .selectFrom("projects")
    .where("id", "=", projectId)
    .select(["organization_id"])
    .executeTakeFirst();
  if (!project) return { error: "Project not found" };

  const epicId = randomUUID();
  const now = new Date().toISOString();

  await db
    .insertInto("epics")
    .values({
      id: epicId,
      project_id: projectId,
      organization_id: project.organization_id,
      name,
      description,
      priority,
      status,
      owner_id: ownerId || null,
      start_date: startDate,
      end_date: endDate,
      archived: 0,
      archived_at: null,
      created_by: session.user.id,
      created_at: now,
      updated_at: now,
    })
    .execute();

  revalidatePath(`/project/${projectId}/epics`);
  return { epicId };
}

export async function updateEpicStatus(
  epicId: string,
  status: string,
): Promise<{ error?: string }> {
  await verifySession();

  const epic = await db
    .selectFrom("epics")
    .where("id", "=", epicId)
    .select("project_id")
    .executeTakeFirst();

  await db
    .updateTable("epics")
    .set({ status, updated_at: new Date().toISOString() })
    .where("id", "=", epicId)
    .execute();

  if (epic) revalidatePath(`/project/${epic.project_id}/epics`);
  revalidatePath(`/epics/${epicId}`);
  return {};
}

export async function updateEpic(
  epicId: string,
  data: {
    name: string;
    description: string | null;
    priority: string;
    status: string;
    owner_id: string | null;
    end_date: string | null;
  },
): Promise<{ error?: string }> {
  const session = await verifySession();
  const { error, epic } = await assertManager(epicId, session.user.id);
  if (error) return { error };

  await db
    .updateTable("epics")
    .set({ ...data, updated_at: new Date().toISOString() })
    .where("id", "=", epicId)
    .execute();

  revalidatePath(`/epics/${epicId}`);
  revalidatePath(`/project/${epic!.project_id}/epics`);
  return {};
}

export async function archiveEpic(epicId: string): Promise<{ error?: string }> {
  const session = await verifySession();
  const { error, epic } = await assertManager(epicId, session.user.id);
  if (error) return { error };

  if (epic!.status !== "done") {
    return { error: "Epic must be marked as done before it can be archived" };
  }

  const now = new Date().toISOString();
  await db
    .updateTable("epics")
    .set({ archived: 1, archived_at: now, updated_at: now })
    .where("id", "=", epicId)
    .execute();

  revalidatePath(`/epics/${epicId}`);
  revalidatePath(`/project/${epic!.project_id}/epics`);
  return {};
}
