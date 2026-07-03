"use server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";

export type EpicActionState = { error?: string; epicId?: string } | undefined;

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
      created_by: session.user.id,
      created_at: now,
      updated_at: now,
    })
    .execute();

  revalidatePath("/epics");
  return { epicId };
}

export async function updateEpicStatus(
  epicId: string,
  status: string,
): Promise<{ error?: string }> {
  await verifySession();

  await db
    .updateTable("epics")
    .set({ status, updated_at: new Date().toISOString() })
    .where("id", "=", epicId)
    .execute();

  revalidatePath("/epics");
  revalidatePath(`/epics/${epicId}`);
  return {};
}
