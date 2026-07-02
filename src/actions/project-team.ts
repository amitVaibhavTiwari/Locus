"use server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";

async function getProjectMembership(projectId: string, userId: string) {
  return db
    .selectFrom("project_members")
    .where("project_id", "=", projectId)
    .where("user_id", "=", userId)
    .select(["role"])
    .executeTakeFirst();
}

export async function addProjectMember(
  projectId: string,
  userId: string,
): Promise<{ error?: string }> {
  const session = await verifySession();

  const callerMembership = await getProjectMembership(
    projectId,
    session.user.id,
  );
  if (!callerMembership)
    return { error: "You are not a member of this project" };

  const existing = await getProjectMembership(projectId, userId);
  if (existing) return { error: "User is already a member of this project" };

  await db
    .insertInto("project_members")
    .values({
      id: randomUUID(),
      project_id: projectId,
      user_id: userId,
      role: "member",
      joined_at: new Date().toISOString(),
    })
    .execute();

  revalidatePath(`/project/${projectId}/team`);
  return {};
}

export async function removeProjectMember(
  projectId: string,
  userId: string,
  unassignTasks: boolean,
): Promise<{ error?: string }> {
  const session = await verifySession();

  const callerMembership = await getProjectMembership(
    projectId,
    session.user.id,
  );
  if (!callerMembership || callerMembership.role !== "manager") {
    return { error: "Only project managers can remove members" };
  }

  const targetMembership = await getProjectMembership(projectId, userId);
  if (!targetMembership)
    return { error: "User is not a member of this project" };

  if (targetMembership.role === "manager") {
    const managerCount = await db
      .selectFrom("project_members")
      .where("project_id", "=", projectId)
      .where("role", "=", "manager")
      .select((eb) => eb.fn.count<number>("id").as("count"))
      .executeTakeFirst();
    if ((managerCount?.count ?? 0) <= 1) {
      return { error: "Cannot remove the only manager from the project" };
    }
  }

  if (unassignTasks) {
    await db
      .updateTable("issues")
      .set({ assignee_id: null, updated_at: new Date().toISOString() })
      .where("project_id", "=", projectId)
      .where("assignee_id", "=", userId)
      .execute();
  }

  await db
    .deleteFrom("project_members")
    .where("project_id", "=", projectId)
    .where("user_id", "=", userId)
    .execute();

  revalidatePath(`/project/${projectId}/team`);
  return {};
}

export async function changeProjectMemberRole(
  projectId: string,
  userId: string,
  role: "manager" | "member",
): Promise<{ error?: string }> {
  const session = await verifySession();

  const callerMembership = await getProjectMembership(
    projectId,
    session.user.id,
  );
  if (!callerMembership || callerMembership.role !== "manager") {
    return { error: "Only project managers can change roles" };
  }

  if (role === "member") {
    const managerCount = await db
      .selectFrom("project_members")
      .where("project_id", "=", projectId)
      .where("role", "=", "manager")
      .select((eb) => eb.fn.count<number>("id").as("count"))
      .executeTakeFirst();
    const targetCurrent = await getProjectMembership(projectId, userId);
    if (targetCurrent?.role === "manager" && (managerCount?.count ?? 0) <= 1) {
      return { error: "Cannot demote the only manager" };
    }
  }

  await db
    .updateTable("project_members")
    .set({ role })
    .where("project_id", "=", projectId)
    .where("user_id", "=", userId)
    .execute();

  revalidatePath(`/project/${projectId}/team`);
  return {};
}
