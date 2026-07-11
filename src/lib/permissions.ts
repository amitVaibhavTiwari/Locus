import { db } from "@/lib/db";

export async function assertNotProjectViewer(
  projectId: string,
  userId: string,
): Promise<{ error: string } | null> {
  const membership = await db
    .selectFrom("project_members")
    .where("project_id", "=", projectId)
    .where("user_id", "=", userId)
    .select(["role"])
    .executeTakeFirst();

  if (membership?.role === "viewer")
    return { error: "Viewers cannot perform this action" };
  return null;
}
