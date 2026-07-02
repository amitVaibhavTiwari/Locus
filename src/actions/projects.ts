"use server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";

export type ProjectActionState =
  | { error?: string; projectId?: string }
  | undefined;

async function getActiveOrgId(userId: string): Promise<string | null> {
  const prefs = await db
    .selectFrom("user_preferences")
    .where("user_id", "=", userId)
    .select(["active_organization_id"])
    .executeTakeFirst();
  return prefs?.active_organization_id ?? null;
}

async function getOrgMembership(orgId: string, userId: string) {
  return db
    .selectFrom("organization_members")
    .where("organization_id", "=", orgId)
    .where("user_id", "=", userId)
    .select(["role"])
    .executeTakeFirst();
}

export async function createProject(
  state: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const session = await verifySession();

  const orgId = await getActiveOrgId(session.user.id);
  if (!orgId) return { error: "No active organization" };

  const name = formData.get("name")?.toString().trim();
  if (!name) return { error: "Project name is required" };

  const description = formData.get("description")?.toString().trim() || null;
  const visibility =
    formData.get("visibility")?.toString() === "public" ? "public" : "private";
  const priority = formData.get("priority")?.toString() || null;
  const allowDeleteTickets = formData.get("allowDeleteTickets") === "1" ? 1 : 0;
  const allowManageSprint = formData.get("allowManageSprint") === "0" ? 0 : 1;
  const allowMembersEdit = formData.get("allowMembersEdit") === "1" ? 1 : 0;

  const memberIds: string[] = (() => {
    try {
      const raw = formData.get("memberIds")?.toString();
      const parsed = JSON.parse(raw ?? "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const labelNames: string[] = (() => {
    try {
      const raw = formData.get("labels")?.toString();
      const parsed = JSON.parse(raw ?? "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const workflowNames: string[] = (() => {
    try {
      const raw = formData.get("workflow")?.toString();
      const parsed = JSON.parse(raw ?? "[]");
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [];
    } catch {
      return [];
    }
  })();

  const columnDefs =
    workflowNames.length > 0
      ? workflowNames.map((statusName) => ({
          name: statusName,
          key: statusName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
        }))
      : [
          { name: "Todo", key: "todo" },
          { name: "In Progress", key: "in-progress" },
          { name: "In QA", key: "qa" },
          { name: "Pending Deployment", key: "pending" },
          { name: "Done", key: "done" },
        ];

  const key =
    name
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 5) || "P";

  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const existing = await db
    .selectFrom("projects")
    .where("organization_id", "=", orgId)
    .where("slug", "=", baseSlug)
    .select(["id"])
    .executeTakeFirst();

  const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;

  const projectId = randomUUID();
  const now = new Date().toISOString();

  await db
    .insertInto("projects")
    .values({
      id: projectId,
      organization_id: orgId,
      name,
      key,
      slug,
      description,
      visibility,
      priority,
      archived: 0,
      allow_delete_tickets: allowDeleteTickets,
      allow_manage_sprint: allowManageSprint,
      allow_members_edit: allowMembersEdit,
      created_by: session.user.id,
      created_at: now,
      updated_at: now,
    })
    .execute();

  await db
    .insertInto("project_members")
    .values({
      id: randomUUID(),
      project_id: projectId,
      user_id: session.user.id,
      role: "manager",
      joined_at: now,
    })
    .execute();

  for (const memberId of memberIds) {
    if (memberId === session.user.id) continue;
    await db
      .insertInto("project_members")
      .values({
        id: randomUUID(),
        project_id: projectId,
        user_id: memberId,
        role: "member",
        joined_at: now,
      })
      .execute();
  }

  for (const labelName of labelNames) {
    await db
      .insertInto("labels")
      .values({
        id: randomUUID(),
        organization_id: orgId,
        project_id: projectId,
        name: labelName,
        color: "#6b7280",
        created_at: now,
      })
      .execute();
  }

  const boardId = randomUUID();
  await db
    .insertInto("boards")
    .values({
      id: boardId,
      project_id: projectId,
      name: "Main Board",
      created_at: now,
    })
    .execute();

  for (let i = 0; i < columnDefs.length; i++) {
    await db
      .insertInto("columns")
      .values({
        id: randomUUID(),
        board_id: boardId,
        name: columnDefs[i].name,
        key: columnDefs[i].key,
        order_index: i,
        wip_limit: null,
        created_at: now,
      })
      .execute();
  }

  revalidatePath("/projects");
  revalidatePath("/", "layout");
  return { projectId };
}

export async function updateProject(
  state: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const session = await verifySession();

  const projectId = formData.get("project_id")?.toString();
  if (!projectId) return { error: "Missing project ID" };

  const name = formData.get("name")?.toString().trim();
  if (!name) return { error: "Project name is required" };

  const description = formData.get("description")?.toString().trim() || null;
  const visibility =
    formData.get("visibility")?.toString() === "public" ? "public" : "private";

  const project = await db
    .selectFrom("projects")
    .where("id", "=", projectId)
    .select(["organization_id"])
    .executeTakeFirst();

  if (!project) return { error: "Project not found" };

  const member = await getOrgMembership(
    project.organization_id,
    session.user.id,
  );
  if (!member || !["owner", "admin"].includes(member.role))
    return { error: "Insufficient permissions" };

  await db
    .updateTable("projects")
    .set({
      name,
      description,
      visibility,
      updated_at: new Date().toISOString(),
    })
    .where("id", "=", projectId)
    .execute();

  revalidatePath(`/project/${projectId}/settings`);
  revalidatePath(`/project/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/", "layout");
  return undefined;
}

export async function archiveProject(
  projectId: string,
): Promise<{ error?: string }> {
  const session = await verifySession();

  const project = await db
    .selectFrom("projects")
    .where("id", "=", projectId)
    .select(["organization_id", "archived"])
    .executeTakeFirst();

  if (!project) return { error: "Project not found" };

  const member = await getOrgMembership(
    project.organization_id,
    session.user.id,
  );
  if (!member || !["owner", "admin"].includes(member.role))
    return { error: "Insufficient permissions" };

  await db
    .updateTable("projects")
    .set({
      archived: project.archived ? 0 : 1,
      updated_at: new Date().toISOString(),
    })
    .where("id", "=", projectId)
    .execute();

  revalidatePath("/projects");
  revalidatePath("/", "layout");
  return {};
}

export async function deleteProject(
  projectId: string,
): Promise<{ error?: string }> {
  const session = await verifySession();

  const project = await db
    .selectFrom("projects")
    .where("id", "=", projectId)
    .select(["organization_id"])
    .executeTakeFirst();

  if (!project) return { error: "Project not found" };

  const member = await getOrgMembership(
    project.organization_id,
    session.user.id,
  );
  if (!member || member.role !== "owner")
    return { error: "Only workspace owners can delete projects" };

  await db.deleteFrom("projects").where("id", "=", projectId).execute();

  revalidatePath("/projects");
  revalidatePath("/", "layout");
  return {};
}

export async function pinProject(
  projectId: string,
): Promise<{ error?: string }> {
  const session = await verifySession();

  const prefs = await db
    .selectFrom("user_preferences")
    .where("user_id", "=", session.user.id)
    .select(["pinned_project_ids"])
    .executeTakeFirst();

  const pinned: string[] = JSON.parse(prefs?.pinned_project_ids ?? "[]");
  if (!pinned.includes(projectId)) {
    pinned.push(projectId);
    await db
      .updateTable("user_preferences")
      .set({
        pinned_project_ids: JSON.stringify(pinned),
        updated_at: new Date().toISOString(),
      })
      .where("user_id", "=", session.user.id)
      .execute();
  }

  revalidatePath("/", "layout");
  return {};
}

export async function unpinProject(
  projectId: string,
): Promise<{ error?: string }> {
  const session = await verifySession();

  const prefs = await db
    .selectFrom("user_preferences")
    .where("user_id", "=", session.user.id)
    .select(["pinned_project_ids"])
    .executeTakeFirst();

  const pinned: string[] = JSON.parse(prefs?.pinned_project_ids ?? "[]");
  const updated = pinned.filter((id) => id !== projectId);

  await db
    .updateTable("user_preferences")
    .set({
      pinned_project_ids: JSON.stringify(updated),
      updated_at: new Date().toISOString(),
    })
    .where("user_id", "=", session.user.id)
    .execute();

  revalidatePath("/", "layout");
  return {};
}
