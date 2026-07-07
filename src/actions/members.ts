"use server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { sendEmail } from "@/lib/email";
import { inviteEmailHtml, inviteEmailText } from "@/lib/templates";

export type InviteResult = { error?: string; successCount?: number };

export async function inviteTeammates(
  invites: { email: string; role: string }[],
): Promise<InviteResult> {
  const session = await verifySession();

  const prefs = await db
    .selectFrom("user_preferences")
    .where("user_id", "=", session.user.id)
    .select(["active_organization_id"])
    .executeTakeFirst();

  if (!prefs?.active_organization_id) return { error: "No active workspace" };

  const orgId = prefs.active_organization_id;

  const [callerMembership, workspacePrefs] = await Promise.all([
    db
      .selectFrom("organization_members")
      .where("organization_id", "=", orgId)
      .where("user_id", "=", session.user.id)
      .select(["role"])
      .executeTakeFirst(),
    db
      .selectFrom("workspace_preferences")
      .where("organization_id", "=", orgId)
      .select(["allow_admin_invite"])
      .executeTakeFirst(),
  ]);

  const isOwner = callerMembership?.role === "owner";
  const isAdmin = callerMembership?.role === "admin";
  const canInvite =
    isOwner || (isAdmin && workspacePrefs?.allow_admin_invite === 1);
  if (!canInvite)
    return { error: "You do not have permission to invite members" };

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nowStr = now.toISOString();

  const [org, inviter] = await Promise.all([
    db
      .selectFrom("organizations")
      .where("id", "=", orgId)
      .select(["name"])
      .executeTakeFirst(),
    db
      .selectFrom("users")
      .where("id", "=", session.user.id)
      .select(["username"])
      .executeTakeFirst(),
  ]);

  const appUrl = (process.env.AUTH_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const inviterName = inviter?.username ?? "Someone";
  const workspaceName = org?.name ?? "Locus Workspace";

  let successCount = 0;

  for (const invite of invites) {
    const email = invite.email.trim().toLowerCase();
    if (!email) continue;

    const existingUser = await db
      .selectFrom("users")
      .where("email", "=", email)
      .select(["id"])
      .executeTakeFirst();

    if (existingUser) {
      const isMember = await db
        .selectFrom("organization_members")
        .where("organization_id", "=", orgId)
        .where("user_id", "=", existingUser.id)
        .select(["id"])
        .executeTakeFirst();
      if (isMember) continue;
    }

    const existingInvite = await db
      .selectFrom("organization_invitations")
      .where("organization_id", "=", orgId)
      .where("email", "=", email)
      .where("accepted_at", "is", null)
      .select(["id"])
      .executeTakeFirst();

    if (!existingInvite) {
      const token = randomUUID();

      await db
        .insertInto("organization_invitations")
        .values({
          id: randomUUID(),
          organization_id: orgId,
          email,
          role: invite.role === "admin" ? "admin" : "member",
          token,
          invited_by: session.user.id,
          accepted_at: null,
          expires_at: expiresAt.toISOString(),
          created_at: nowStr,
        })
        .execute();

      const inviteUrl = `${appUrl}/invite/${token}`;
      await sendEmail({
        to: email,
        subject: `${inviterName} invited you to join ${workspaceName} on Locus`,
        html: inviteEmailHtml(inviterName, workspaceName, inviteUrl),
        text: inviteEmailText(inviterName, workspaceName, inviteUrl),
      });

      successCount++;
    }
  }

  revalidatePath("/invites");
  return { successCount };
}

export async function cancelInvite(
  inviteId: string,
): Promise<{ error?: string } | undefined> {
  const session = await verifySession();

  const prefs = await db
    .selectFrom("user_preferences")
    .where("user_id", "=", session.user.id)
    .select(["active_organization_id"])
    .executeTakeFirst();

  if (!prefs?.active_organization_id) return { error: "No active workspace" };

  const callerMembership = await db
    .selectFrom("organization_members")
    .where("organization_id", "=", prefs.active_organization_id)
    .where("user_id", "=", session.user.id)
    .select(["role"])
    .executeTakeFirst();

  if (callerMembership?.role !== "owner") {
    return { error: "Only workspace owners can cancel invitations" };
  }

  await db
    .deleteFrom("organization_invitations")
    .where("id", "=", inviteId)
    .where("organization_id", "=", prefs.active_organization_id)
    .where("accepted_at", "is", null)
    .execute();

  revalidatePath("/invites");
  return undefined;
}

export async function removeMember(
  memberId: string,
): Promise<{ error?: string } | undefined> {
  const session = await verifySession();

  const prefs = await db
    .selectFrom("user_preferences")
    .where("user_id", "=", session.user.id)
    .select(["active_organization_id"])
    .executeTakeFirst();

  if (!prefs?.active_organization_id) return { error: "No active workspace" };

  const callerMembership = await db
    .selectFrom("organization_members")
    .where("organization_id", "=", prefs.active_organization_id)
    .where("user_id", "=", session.user.id)
    .select(["role"])
    .executeTakeFirst();

  if (!callerMembership || callerMembership.role === "member") {
    return { error: "You do not have permission to remove members" };
  }

  const target = await db
    .selectFrom("organization_members")
    .where("id", "=", memberId)
    .where("organization_id", "=", prefs.active_organization_id)
    .select(["user_id"])
    .executeTakeFirst();

  if (target?.user_id === session.user.id) {
    return { error: "You cannot remove yourself from the workspace." };
  }

  await db
    .deleteFrom("organization_members")
    .where("id", "=", memberId)
    .where("organization_id", "=", prefs.active_organization_id)
    .execute();

  revalidatePath("/team");
  return undefined;
}

export async function updateMemberRole(
  memberId: string,
  role: "admin" | "member",
): Promise<{ error?: string } | undefined> {
  const session = await verifySession();

  const prefs = await db
    .selectFrom("user_preferences")
    .where("user_id", "=", session.user.id)
    .select(["active_organization_id"])
    .executeTakeFirst();

  if (!prefs?.active_organization_id) return { error: "No active workspace" };

  const callerMembership = await db
    .selectFrom("organization_members")
    .where("organization_id", "=", prefs.active_organization_id)
    .where("user_id", "=", session.user.id)
    .select(["role"])
    .executeTakeFirst();

  if (callerMembership?.role !== "owner") {
    return { error: "Only workspace owners can change member roles." };
  }

  const target = await db
    .selectFrom("organization_members")
    .where("id", "=", memberId)
    .where("organization_id", "=", prefs.active_organization_id)
    .select(["user_id", "role"])
    .executeTakeFirst();

  if (!target) return { error: "Member not found." };

  if (target.user_id === session.user.id) {
    return { error: "You cannot change your own role." };
  }

  if (target.role === "owner") {
    return { error: "The workspace owner's role cannot be changed." };
  }

  await db
    .updateTable("organization_members")
    .set({ role })
    .where("id", "=", memberId)
    .where("organization_id", "=", prefs.active_organization_id)
    .execute();

  revalidatePath("/team");
  return undefined;
}
