"use server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";

export async function acceptInvite(
  token: string,
): Promise<{ error?: string } | undefined> {
  const session = await verifySession();

  const invite = await db
    .selectFrom("organization_invitations")
    .where("token", "=", token)
    .where("accepted_at", "is", null)
    .select(["id", "organization_id", "expires_at", "email", "role"])
    .executeTakeFirst();

  if (!invite)
    return {
      error: "This invitation is invalid or has already been accepted.",
    };

  if (new Date(invite.expires_at) < new Date())
    return { error: "This invitation has expired." };

  const sessionUser = await db
    .selectFrom("users")
    .where("id", "=", session.user.id)
    .select(["email"])
    .executeTakeFirst();

  if (!sessionUser) return { error: "User not found." };

  if (invite.email !== sessionUser.email)
    return { error: "This invitation was sent to a different email address." };

  // Check if already a member
  const existing = await db
    .selectFrom("organization_members")
    .where("organization_id", "=", invite.organization_id)
    .where("user_id", "=", session.user.id)
    .select(["id"])
    .executeTakeFirst();

  if (existing) {
    redirect("/dashboard");
  }

  const now = new Date().toISOString();

  await db.transaction().execute(async (trx) => {
    await trx
      .insertInto("organization_members")
      .values({
        id: randomUUID(),
        organization_id: invite.organization_id,
        user_id: session.user.id,
        role: (invite.role as "admin" | "member" | "viewer") ?? "member",
        joined_at: now,
        last_active_at: now,
      })
      .execute();

    await trx
      .updateTable("organization_invitations")
      .set({ accepted_at: now })
      .where("id", "=", invite.id)
      .execute();

    const prefs = await trx
      .selectFrom("user_preferences")
      .where("user_id", "=", session.user.id)
      .select(["active_organization_id"])
      .executeTakeFirst();

    if (!prefs?.active_organization_id) {
      await trx
        .updateTable("user_preferences")
        .set({
          active_organization_id: invite.organization_id,
          updated_at: now,
        })
        .where("user_id", "=", session.user.id)
        .execute();
    }
  });

  const jar = await cookies();
  jar.set("active-org-id", invite.organization_id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
