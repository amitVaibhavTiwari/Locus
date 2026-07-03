"use server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";

export type SprintActionState = { error?: string; sprintId?: string } | undefined;

export async function createSprint(
  state: SprintActionState,
  formData: FormData,
): Promise<SprintActionState> {
  const session = await verifySession();

  const projectId = formData.get("project_id")?.toString();
  if (!projectId) return { error: "Missing project" };

  const name = formData.get("name")?.toString().trim();
  if (!name) return { error: "Sprint name is required" };

  const goal = formData.get("goal")?.toString().trim() || null;
  const startDate = formData.get("start_date")?.toString() || null;
  const endDate = formData.get("end_date")?.toString() || null;

  const project = await db
    .selectFrom("projects")
    .where("id", "=", projectId)
    .select(["organization_id"])
    .executeTakeFirst();
  if (!project) return { error: "Project not found" };

  const sprintId = randomUUID();
  const now = new Date().toISOString();

  await db
    .insertInto("sprints")
    .values({
      id: sprintId,
      project_id: projectId,
      organization_id: project.organization_id,
      name,
      goal,
      start_date: startDate,
      end_date: endDate,
      status: "planned",
      velocity: null,
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
        user_id: session.user.id,
        type: "sprint_created",
        payload: JSON.stringify({ name }),
        created_at: new Date().toISOString(),
      })
      .execute();
  });

  revalidatePath(`/project/${projectId}/sprints`);
  return { sprintId };
}

export async function startSprint(
  sprintId: string,
): Promise<{ error?: string }> {
  const session = await verifySession();

  const sprint = await db
    .selectFrom("sprints")
    .where("id", "=", sprintId)
    .select(["project_id", "organization_id", "status", "name"])
    .executeTakeFirst();
  if (!sprint) return { error: "Sprint not found" };
  if (sprint.status !== "planned") return { error: "Sprint is not in planned status" };

  const existingActive = await db
    .selectFrom("sprints")
    .where("project_id", "=", sprint.project_id)
    .where("status", "=", "active")
    .select(["id"])
    .executeTakeFirst();
  if (existingActive) return { error: "A sprint is already active. Complete it before starting a new one." };

  const now = new Date().toISOString();
  await db
    .updateTable("sprints")
    .set({ status: "active", updated_at: now })
    .where("id", "=", sprintId)
    .execute();

  after(async () => {
    await db
      .insertInto("activities")
      .values({
        id: randomUUID(),
        organization_id: sprint.organization_id,
        project_id: sprint.project_id,
        issue_id: null,
        user_id: session.user.id,
        type: "sprint_started",
        payload: JSON.stringify({ name: sprint.name }),
        created_at: new Date().toISOString(),
      })
      .execute();
  });

  revalidatePath(`/project/${sprint.project_id}/sprints`);
  revalidatePath(`/project/${sprint.project_id}/sprints/${sprintId}`);
  revalidatePath(`/project/${sprint.project_id}`);
  return {};
}

export async function completeSprint(
  sprintId: string,
  incompleteAction: "backlog" | "next",
): Promise<{ error?: string }> {
  const session = await verifySession();

  const sprint = await db
    .selectFrom("sprints")
    .where("id", "=", sprintId)
    .select(["project_id", "organization_id", "status", "name"])
    .executeTakeFirst();
  if (!sprint) return { error: "Sprint not found" };
  if (sprint.status !== "active") return { error: "Sprint is not active" };

  const now = new Date().toISOString();

  let targetSprintId: string | null = null;
  if (incompleteAction === "next") {
    const nextSprint = await db
      .selectFrom("sprints")
      .where("project_id", "=", sprint.project_id)
      .where("status", "=", "planned")
      .select(["id"])
      .orderBy("created_at", "asc")
      .executeTakeFirst();
    targetSprintId = nextSprint?.id ?? null;
  }

  await db
    .updateTable("issues")
    .set({ sprint_id: targetSprintId, updated_at: now })
    .where("sprint_id", "=", sprintId)
    .where("status", "!=", "done")
    .execute();

  await db
    .updateTable("sprints")
    .set({ status: "completed", updated_at: now })
    .where("id", "=", sprintId)
    .execute();

  after(async () => {
    await db
      .insertInto("activities")
      .values({
        id: randomUUID(),
        organization_id: sprint.organization_id,
        project_id: sprint.project_id,
        issue_id: null,
        user_id: session.user.id,
        type: "sprint_completed",
        payload: JSON.stringify({ name: sprint.name, incompleteAction }),
        created_at: new Date().toISOString(),
      })
      .execute();
  });

  revalidatePath(`/project/${sprint.project_id}/sprints`);
  revalidatePath(`/project/${sprint.project_id}/sprints/${sprintId}`);
  revalidatePath(`/project/${sprint.project_id}`);
  revalidatePath(`/backlog`);
  return {};
}

export async function moveIssueToSprint(
  issueId: string,
  sprintId: string,
): Promise<{ error?: string }> {
  await verifySession();

  const issue = await db
    .selectFrom("issues")
    .where("id", "=", issueId)
    .select(["project_id"])
    .executeTakeFirst();
  if (!issue) return { error: "Issue not found" };

  await db
    .updateTable("issues")
    .set({ sprint_id: sprintId, updated_at: new Date().toISOString() })
    .where("id", "=", issueId)
    .execute();

  revalidatePath(`/project/${issue.project_id}`);
  revalidatePath(`/backlog`);
  return {};
}

export async function removeIssueFromSprint(
  issueId: string,
): Promise<{ error?: string }> {
  await verifySession();

  const issue = await db
    .selectFrom("issues")
    .where("id", "=", issueId)
    .select(["project_id"])
    .executeTakeFirst();
  if (!issue) return { error: "Issue not found" };

  await db
    .updateTable("issues")
    .set({ sprint_id: null, updated_at: new Date().toISOString() })
    .where("id", "=", issueId)
    .execute();

  revalidatePath(`/project/${issue.project_id}`);
  revalidatePath(`/backlog`);
  return {};
}
