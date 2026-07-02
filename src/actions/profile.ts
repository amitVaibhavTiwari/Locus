"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";

export type UpdateProfileState = { error?: string } | undefined;

export async function updateProfile(
  state: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const session = await verifySession();

  const userId = formData.get("user_id")?.toString();
  if (userId !== session.user.id)
    return { error: "You can only edit your own profile." };

  const username = formData.get("username")?.toString().trim();
  if (!username) return { error: "Display name is required." };
  if (username.length > 50)
    return { error: "Display name must be 50 characters or less." };

  await db
    .updateTable("users")
    .set({ username, updated_at: new Date().toISOString() })
    .where("id", "=", session.user.id)
    .execute();

  revalidatePath(`/team/${session.user.id}`);
  revalidatePath("/", "layout");
  return undefined;
}
