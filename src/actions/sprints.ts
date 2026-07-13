"use server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { assertNotProjectViewer } from "@/lib/permissions";

export type SprintActionState =
  | { error?: string; sprintId?: string }
  | undefined;

export async function createSprint(
  state: SprintActionState,
  formData: FormData,
): Promise<SprintActionState> {
  const session = await verifySession();

  const projectId = formData.get("project_id")?.toString();
  if (!projectId) return { error: "Missing project" };

  const name = formData.get("name")?.toString().trim();
  if (!name) return { error: "Sprint name is required" };

  const goal = formData.get("goal")?.toString().trim();
  if (!goal) return { error: "Sprint goal is required" };

  const startDate = formData.get("start_date")?.toString() || null;
  if (!startDate) return { error: "Start date is required" };

  const endDate = formData.get("end_date")?.toString() || null;
  if (!endDate) return { error: "End date is required" };

  if (endDate < startDate)
    return { error: "End date must be after start date" };

  const project = await db
    .selectFrom("projects")
    .where("id", "=", projectId)
    .select(["organization_id"])
    .executeTakeFirst();
  if (!project) return { error: "Project not found" };

  const viewerErr = await assertNotProjectViewer(projectId, session.user.id);
  if (viewerErr) return viewerErr;

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
        sprint_id: sprintId,
        user_id: session.user.id,
        type: "sprint_created",
        payload: JSON.stringify({
          name,
          goal,
          start_date: startDate,
          end_date: endDate,
        }),
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

  const viewerErr = await assertNotProjectViewer(
    sprint.project_id,
    session.user.id,
  );
  if (viewerErr) return viewerErr;

  if (sprint.status !== "planned")
    return { error: "Sprint is not in planned status" };

  const existingActive = await db
    .selectFrom("sprints")
    .where("project_id", "=", sprint.project_id)
    .where("status", "=", "active")
    .select(["id"])
    .executeTakeFirst();
  if (existingActive)
    return {
      error:
        "A sprint is already active. Complete it before starting a new one.",
    };

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
        sprint_id: sprintId,
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
  moveTarget: "backlog" | string,
): Promise<{ error?: string }> {
  const session = await verifySession();

  const sprint = await db
    .selectFrom("sprints")
    .where("id", "=", sprintId)
    .select(["project_id", "organization_id", "status", "name"])
    .executeTakeFirst();
  if (!sprint) return { error: "Sprint not found" };

  const viewerErr = await assertNotProjectViewer(
    sprint.project_id,
    session.user.id,
  );
  if (viewerErr) return viewerErr;

  if (sprint.status !== "active") return { error: "Sprint is not active" };

  const now = new Date().toISOString();
  const targetSprintId: string | null =
    moveTarget === "backlog" ? null : moveTarget;

  const incompleteIssues = await db
    .selectFrom("issues")
    .where("sprint_id", "=", sprintId)
    .where("completed_at", "is", null)
    .select(["id"])
    .execute();

  await db
    .updateTable("issues")
    .set({ sprint_id: targetSprintId, updated_at: now })
    .where("sprint_id", "=", sprintId)
    .where("completed_at", "is", null)
    .execute();

  await db
    .updateTable("sprints")
    .set({ status: "completed", updated_at: now })
    .where("id", "=", sprintId)
    .execute();

  let moveTargetName = "Backlog";
  if (moveTarget !== "backlog") {
    const targetSprint = await db
      .selectFrom("sprints")
      .where("id", "=", moveTarget)
      .select(["name"])
      .executeTakeFirst();
    moveTargetName = targetSprint?.name ?? "another sprint";
  }

  after(async () => {
    await db
      .insertInto("activities")
      .values({
        id: randomUUID(),
        organization_id: sprint.organization_id,
        project_id: sprint.project_id,
        issue_id: null,
        sprint_id: sprintId,
        user_id: session.user.id,
        type: "sprint_completed",
        payload: JSON.stringify({
          name: sprint.name,
          moveTarget,
          moveTargetName,
          incompleteCount: incompleteIssues.length,
        }),
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
  const session = await verifySession();

  const issue = await db
    .selectFrom("issues")
    .where("id", "=", issueId)
    .select(["project_id", "organization_id", "issue_number", "title"])
    .executeTakeFirst();
  if (!issue) return { error: "Issue not found" };

  const viewerErr = await assertNotProjectViewer(
    issue.project_id,
    session.user.id,
  );
  if (viewerErr) return viewerErr;

  const sprint = await db
    .selectFrom("sprints")
    .where("id", "=", sprintId)
    .select(["status", "organization_id"])
    .executeTakeFirst();

  await db
    .updateTable("issues")
    .set({ sprint_id: sprintId, updated_at: new Date().toISOString() })
    .where("id", "=", issueId)
    .execute();

  if (sprint?.status === "active") {
    after(async () => {
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
    });
  }

  revalidatePath(`/project/${issue.project_id}`);
  revalidatePath(`/backlog`);
  return {};
}

export async function removeIssueFromSprint(
  issueId: string,
): Promise<{ error?: string }> {
  const session = await verifySession();

  const issue = await db
    .selectFrom("issues")
    .where("id", "=", issueId)
    .select([
      "project_id",
      "organization_id",
      "sprint_id",
      "issue_number",
      "title",
    ])
    .executeTakeFirst();
  if (!issue) return { error: "Issue not found" };

  const viewerErr = await assertNotProjectViewer(
    issue.project_id,
    session.user.id,
  );
  if (viewerErr) return viewerErr;

  let sprintWasActive = false;
  if (issue.sprint_id) {
    const sprint = await db
      .selectFrom("sprints")
      .where("id", "=", issue.sprint_id)
      .select(["status"])
      .executeTakeFirst();
    sprintWasActive = sprint?.status === "active";
  }

  const oldSprintId = issue.sprint_id;

  await db
    .updateTable("issues")
    .set({ sprint_id: null, updated_at: new Date().toISOString() })
    .where("id", "=", issueId)
    .execute();

  if (sprintWasActive && oldSprintId) {
    after(async () => {
      await db
        .insertInto("activities")
        .values({
          id: randomUUID(),
          organization_id: issue.organization_id,
          project_id: issue.project_id,
          issue_id: issueId,
          sprint_id: oldSprintId,
          user_id: session.user.id,
          type: "task_removed_mid_sprint",
          payload: JSON.stringify({
            issue_number: issue.issue_number,
            title: issue.title,
          }),
          created_at: new Date().toISOString(),
        })
        .execute();
    });
  }

  revalidatePath(`/project/${issue.project_id}`);
  revalidatePath(`/backlog`);
  return {};
}

export async function updateSprint(
  sprintId: string,
  data: {
    name?: string;
    goal?: string | null;
    start_date?: string | null;
    end_date?: string | null;
  },
): Promise<{ error?: string }> {
  const session = await verifySession();

  const sprint = await db
    .selectFrom("sprints")
    .where("id", "=", sprintId)
    .select([
      "project_id",
      "organization_id",
      "status",
      "name",
      "goal",
      "start_date",
      "end_date",
    ])
    .executeTakeFirst();

  if (!sprint) return { error: "Sprint not found" };

  const viewerErr = await assertNotProjectViewer(
    sprint.project_id,
    session.user.id,
  );
  if (viewerErr) return viewerErr;

  if (sprint.status === "completed")
    return { error: "Completed sprints cannot be edited" };

  const now = new Date().toISOString();

  if (sprint.status === "planned") {
    const changes: { field: string; from: string | null; to: string | null }[] =
      [];

    if (data.name !== undefined && sprint.name !== data.name)
      changes.push({ field: "name", from: sprint.name, to: data.name ?? null });
    if (
      data.goal !== undefined &&
      (sprint.goal ?? null) !== (data.goal ?? null)
    )
      changes.push({ field: "goal", from: sprint.goal, to: data.goal ?? null });
    if (
      data.start_date !== undefined &&
      (sprint.start_date ?? null) !== (data.start_date ?? null)
    )
      changes.push({
        field: "start_date",
        from: sprint.start_date,
        to: data.start_date ?? null,
      });
    if (
      data.end_date !== undefined &&
      (sprint.end_date ?? null) !== (data.end_date ?? null)
    )
      changes.push({
        field: "end_date",
        from: sprint.end_date,
        to: data.end_date ?? null,
      });

    await db
      .updateTable("sprints")
      .set({
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.goal !== undefined ? { goal: data.goal } : {}),
        ...(data.start_date !== undefined
          ? { start_date: data.start_date }
          : {}),
        ...(data.end_date !== undefined ? { end_date: data.end_date } : {}),
        updated_at: now,
      })
      .where("id", "=", sprintId)
      .execute();

    if (changes.length > 0) {
      after(async () => {
        await db
          .insertInto("activities")
          .values({
            id: randomUUID(),
            organization_id: sprint.organization_id,
            project_id: sprint.project_id,
            issue_id: null,
            sprint_id: sprintId,
            user_id: session.user.id,
            type: "sprint_updated",
            payload: JSON.stringify({ changes }),
            created_at: new Date().toISOString(),
          })
          .execute();
      });
    }
  } else if (sprint.status === "active") {
    const changes: { field: string; from: string | null; to: string | null }[] =
      [];

    if (data.name !== undefined && sprint.name !== data.name)
      changes.push({ field: "name", from: sprint.name, to: data.name ?? null });
    if (
      data.goal !== undefined &&
      (sprint.goal ?? null) !== (data.goal ?? null)
    )
      changes.push({ field: "goal", from: sprint.goal, to: data.goal ?? null });
    if (
      data.end_date !== undefined &&
      (sprint.end_date ?? null) !== (data.end_date ?? null)
    )
      changes.push({
        field: "end_date",
        from: sprint.end_date,
        to: data.end_date ?? null,
      });

    await db
      .updateTable("sprints")
      .set({
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.goal !== undefined ? { goal: data.goal } : {}),
        ...(data.end_date !== undefined ? { end_date: data.end_date } : {}),
        updated_at: now,
      })
      .where("id", "=", sprintId)
      .execute();

    if (changes.length > 0) {
      after(async () => {
        await db
          .insertInto("activities")
          .values({
            id: randomUUID(),
            organization_id: sprint.organization_id,
            project_id: sprint.project_id,
            issue_id: null,
            sprint_id: sprintId,
            user_id: session.user.id,
            type: "sprint_updated",
            payload: JSON.stringify({ changes }),
            created_at: new Date().toISOString(),
          })
          .execute();
      });
    }
  }

  revalidatePath(`/project/${sprint.project_id}/sprints/${sprintId}`);
  revalidatePath(`/project/${sprint.project_id}/sprints`);
  return {};
}
