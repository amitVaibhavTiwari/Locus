"use server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { assertNotProjectViewer } from "@/lib/permissions";

export type EpicActionState = { error?: string; epicId?: string } | undefined;

async function assertManager(epicId: string, userId: string) {
  const epic = await db
    .selectFrom("epics")
    .where("id", "=", epicId)
    .select([
      "project_id",
      "organization_id",
      "status",
      "name",
      "description",
      "priority",
      "owner_id",
      "start_date",
      "end_date",
    ])
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

  const viewerErr = await assertNotProjectViewer(projectId, session.user.id);
  if (viewerErr) return viewerErr;

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

  after(async () => {
    await db
      .insertInto("activities")
      .values({
        id: randomUUID(),
        organization_id: project.organization_id,
        project_id: projectId,
        issue_id: null,
        epic_id: epicId,
        user_id: session.user.id,
        type: "epic_created",
        payload: JSON.stringify({ name }),
        created_at: now,
      })
      .execute();
  });

  revalidatePath(`/project/${projectId}/epics`);
  return { epicId };
}

export async function updateEpicStatus(
  epicId: string,
  status: string,
): Promise<{ error?: string }> {
  const session = await verifySession();

  const epic = await db
    .selectFrom("epics")
    .where("id", "=", epicId)
    .select(["project_id", "organization_id", "status"])
    .executeTakeFirst();

  const oldStatus = epic?.status ?? null;

  await db
    .updateTable("epics")
    .set({ status, updated_at: new Date().toISOString() })
    .where("id", "=", epicId)
    .execute();

  if (epic) {
    after(async () => {
      await db
        .insertInto("activities")
        .values({
          id: randomUUID(),
          organization_id: epic.organization_id,
          project_id: epic.project_id,
          issue_id: null,
          epic_id: epicId,
          user_id: session.user.id,
          type: "status_changed",
          payload: JSON.stringify({ from: oldStatus, to: status }),
          created_at: new Date().toISOString(),
        })
        .execute();
    });

    revalidatePath(`/project/${epic.project_id}/epics`);
  }
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
    start_date: string | null;
    end_date: string | null;
  },
): Promise<{ error?: string }> {
  const session = await verifySession();
  const { error, epic } = await assertManager(epicId, session.user.id);
  if (error) return { error };

  const changes: { field: string; from: string | null; to: string | null }[] =
    [];

  if (epic!.name !== data.name)
    changes.push({ field: "name", from: epic!.name, to: data.name });
  if ((epic!.description ?? null) !== (data.description ?? null))
    changes.push({
      field: "description",
      from: epic!.description,
      to: data.description,
    });
  if (epic!.priority !== data.priority)
    changes.push({
      field: "priority",
      from: epic!.priority,
      to: data.priority,
    });
  if (epic!.status !== data.status)
    changes.push({ field: "status", from: epic!.status, to: data.status });
  if ((epic!.owner_id ?? null) !== (data.owner_id ?? null))
    changes.push({ field: "owner", from: epic!.owner_id, to: data.owner_id });
  if ((epic!.start_date ?? null) !== (data.start_date ?? null))
    changes.push({
      field: "start_date",
      from: epic!.start_date,
      to: data.start_date,
    });
  if ((epic!.end_date ?? null) !== (data.end_date ?? null))
    changes.push({
      field: "end_date",
      from: epic!.end_date,
      to: data.end_date,
    });

  await db
    .updateTable("epics")
    .set({ ...data, updated_at: new Date().toISOString() })
    .where("id", "=", epicId)
    .execute();

  if (changes.length > 0) {
    after(async () => {
      await db
        .insertInto("activities")
        .values({
          id: randomUUID(),
          organization_id: epic!.organization_id,
          project_id: epic!.project_id,
          issue_id: null,
          epic_id: epicId,
          user_id: session.user.id,
          type: "epic_updated",
          payload: JSON.stringify({ changes }),
          created_at: new Date().toISOString(),
        })
        .execute();
    });
  }

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
