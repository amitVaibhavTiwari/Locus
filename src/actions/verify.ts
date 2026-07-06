"use server";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { generateOtp, hashOtp, verifyOtp } from "@/lib/otp";
import { sendEmail } from "@/lib/email";
import { otpEmailHtml, otpEmailText } from "@/lib/templates";

export type VerifyState =
  | {
      error?: string;
      expired?: boolean;
    }
  | undefined;

export async function verifyEmailOtp(
  state: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const otp = formData.get("otp")?.toString().replace(/\s/g, "");
  const inviteToken = formData.get("invite")?.toString() || null;

  if (!email) return { error: "Missing email. Please sign up again." };
  if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    return { error: "Please enter a valid 6-digit code." };
  }

  const pending = await db
    .selectFrom("pending_verifications")
    .where("email", "=", email)
    .selectAll()
    .executeTakeFirst();

  if (!pending) {
    return { error: "Verification session not found. Please sign up again." };
  }

  if (new Date(pending.expires_at) < new Date()) {
    await db
      .deleteFrom("pending_verifications")
      .where("email", "=", email)
      .execute();
    return {
      error: "Code expired. Please sign up again to get a new code.",
      expired: true,
    };
  }

  if (!verifyOtp(otp, email, pending.otp_hash)) {
    return { error: "Incorrect code. Please check and try again." };
  }

  // Create the user
  const userId = randomUUID();
  const now = new Date().toISOString();

  await db.transaction().execute(async (trx) => {
    await trx
      .insertInto("users")
      .values({
        id: userId,
        email: pending.email,
        username: pending.name,
        password_hash: pending.password_hash,
        avatar_url: null,
        email_verified_at: now,
        created_at: now,
        updated_at: now,
      })
      .execute();

    await trx
      .insertInto("user_preferences")
      .values({
        id: randomUUID(),
        user_id: userId,
        pinned_project_ids: "[]",
        active_organization_id: null,
        updated_at: now,
      })
      .execute();
  });

  // Accept invite if one is pending
  const effectiveInviteToken = pending.invite_token ?? inviteToken;
  let joinedOrgId: string | null = null;

  if (effectiveInviteToken) {
    const invite = await db
      .selectFrom("organization_invitations")
      .where("token", "=", effectiveInviteToken)
      .where("accepted_at", "is", null)
      .select(["id", "organization_id", "expires_at"])
      .executeTakeFirst();

    if (invite && new Date(invite.expires_at) > new Date()) {
      await db.transaction().execute(async (trx) => {
        await trx
          .insertInto("organization_members")
          .values({
            id: randomUUID(),
            organization_id: invite.organization_id,
            user_id: userId,
            role: "member",
            joined_at: now,
            last_active_at: now,
          })
          .execute();

        await trx
          .updateTable("organization_invitations")
          .set({ accepted_at: now })
          .where("id", "=", invite.id)
          .execute();

        await trx
          .updateTable("user_preferences")
          .set({
            active_organization_id: invite.organization_id,
            updated_at: now,
          })
          .where("user_id", "=", userId)
          .execute();
      });
      joinedOrgId = invite.organization_id;
    }
  }

  await db
    .deleteFrom("pending_verifications")
    .where("email", "=", email)
    .execute();

  // Auto sign-in using the verified user id bypass in auth.ts
  await signIn("credentials", {
    type: "verified",
    userId,
    redirectTo: joinedOrgId ? "/dashboard" : "/onboarding/workspace",
  });
}

export type ResendState = { error?: string; success?: boolean } | undefined;

export async function resendOtp(
  state: ResendState,
  formData: FormData,
): Promise<ResendState> {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  if (!email) return { error: "Missing email." };

  const pending = await db
    .selectFrom("pending_verifications")
    .where("email", "=", email)
    .select(["id", "name", "email"])
    .executeTakeFirst();

  if (!pending) {
    return { error: "Verification session not found. Please sign up again." };
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp, email);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db
    .updateTable("pending_verifications")
    .set({ otp_hash: otpHash, expires_at: expiresAt.toISOString() })
    .where("email", "=", email)
    .execute();

  const emailResult = await sendEmail({
    to: email,
    subject: `Your new Locus verification code: ${otp}`,
    html: otpEmailHtml(pending.name, otp),
    text: otpEmailText(pending.name, otp),
  });

  if (!emailResult.success && process.env.SMTP_URL) {
    return { error: "Failed to resend. Please try again." };
  }

  return { success: true };
}
