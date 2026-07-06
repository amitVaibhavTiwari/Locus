"use server";
import { db } from "@/lib/db";
import { signIn, signOut } from "@/lib/auth";
import { randomUUID, randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { generateOtp, hashOtp, verifyOtp } from "@/lib/otp";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import {
  otpEmailHtml,
  otpEmailText,
  loginOtpEmailHtml,
  loginOtpEmailText,
  passwordResetEmailHtml,
  passwordResetEmailText,
} from "@/lib/templates";

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
        root?: string[];
      };
    }
  | undefined;

export async function registerUser(
  state: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password } = parsed.data;
  const inviteToken = formData.get("invite")?.toString() || null;

  const existing = await db
    .selectFrom("users")
    .where("email", "=", email)
    .select("id")
    .executeTakeFirst();

  if (existing) {
    return {
      errors: { email: ["An account with this email already exists."] },
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const otp = generateOtp();
  const otpHash = hashOtp(otp, email);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

  await db
    .deleteFrom("pending_verifications")
    .where("email", "=", email)
    .execute();

  await db
    .insertInto("pending_verifications")
    .values({
      id: randomUUID(),
      email,
      name,
      password_hash: passwordHash,
      otp_hash: otpHash,
      invite_token: inviteToken,
      expires_at: expiresAt.toISOString(),
      created_at: now.toISOString(),
    })
    .execute();

  const emailResult = await sendEmail({
    to: email,
    subject: `Your Locus verification code: ${otp}`,
    html: otpEmailHtml(name, otp),
    text: otpEmailText(name, otp),
  });

  if (!emailResult.success && isEmailConfigured()) {
    await db
      .deleteFrom("pending_verifications")
      .where("email", "=", email)
      .execute();
    return {
      errors: {
        root: ["Failed to send verification email. Please try again."],
      },
    };
  }

  const params = new URLSearchParams({ email });
  if (inviteToken) params.set("invite", inviteToken);
  redirect(`/verify-email?${params.toString()}`);
}

export type LoginState = { error?: string } | undefined;

export async function loginUser(
  state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const redirectTo = formData.get("redirect")?.toString();
  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/dashboard";

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  const user = await db
    .selectFrom("users")
    .where("email", "=", email)
    .select(["id", "username", "password_hash"])
    .executeTakeFirst();

  if (!user?.password_hash) {
    return { error: "Invalid email or password." };
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  if (process.env.DISABLE_LOGIN_OTP === "true") {
    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: safeRedirect,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        return { error: "Something went wrong. Please try again." };
      }
      throw err;
    }
    return;
  }

  // OTP thing
  const otp = generateOtp();
  const otpHash = hashOtp(otp, email);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const now = new Date().toISOString();

  await db.deleteFrom("login_otps").where("email", "=", email).execute();

  await db
    .insertInto("login_otps")
    .values({
      id: randomUUID(),
      user_id: user.id,
      email,
      otp_hash: otpHash,
      expires_at: expiresAt.toISOString(),
      created_at: now,
    })
    .execute();

  // sending email after response so login page loads immediately
  after(async () => {
    await sendEmail({
      to: email,
      subject: `Your Locus login code: ${otp}`,
      html: loginOtpEmailHtml(user.username, otp),
      text: loginOtpEmailText(user.username, otp),
    });
  });

  const params = new URLSearchParams({ email });
  if (redirectTo && safeRedirect !== "/dashboard")
    params.set("redirect", safeRedirect);
  redirect(`/verify-login?${params.toString()}`);
}

export type VerifyLoginState = { error?: string } | undefined;

export async function verifyLoginOtp(
  state: VerifyLoginState,
  formData: FormData,
): Promise<VerifyLoginState> {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const otp = formData.get("otp")?.toString().replace(/\s/g, "");
  const redirectTo = formData.get("redirect")?.toString();
  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/dashboard";

  if (!email) return { error: "Missing email. Please sign in again." };
  if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    return { error: "Please enter a valid 6-digit code." };
  }

  const record = await db
    .selectFrom("login_otps")
    .where("email", "=", email)
    .selectAll()
    .executeTakeFirst();

  if (!record) {
    return { error: "Session not found. Please sign in again." };
  }

  if (new Date(record.expires_at) < new Date()) {
    await db.deleteFrom("login_otps").where("email", "=", email).execute();
    return { error: "Code expired. Please sign in again." };
  }

  if (!verifyOtp(otp, email, record.otp_hash)) {
    return { error: "Incorrect code. Please check and try again." };
  }

  await db.deleteFrom("login_otps").where("email", "=", email).execute();

  await signIn("credentials", {
    type: "login-otp-verified",
    userId: record.user_id,
    redirectTo: safeRedirect,
  });
}

export type ResendLoginOtpState =
  | { error?: string; success?: boolean }
  | undefined;

export async function resendLoginOtp(
  state: ResendLoginOtpState,
  formData: FormData,
): Promise<ResendLoginOtpState> {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  if (!email) return { error: "Missing email." };

  const record = await db
    .selectFrom("login_otps")
    .where("email", "=", email)
    .select(["user_id"])
    .executeTakeFirst();

  if (!record) {
    return { error: "Session not found. Please sign in again." };
  }

  const user = await db
    .selectFrom("users")
    .where("id", "=", record.user_id)
    .select(["username"])
    .executeTakeFirst();

  const otp = generateOtp();
  const otpHash = hashOtp(otp, email);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db
    .updateTable("login_otps")
    .set({ otp_hash: otpHash, expires_at: expiresAt.toISOString() })
    .where("email", "=", email)
    .execute();

  after(async () => {
    await sendEmail({
      to: email,
      subject: `Your new Locus login code: ${otp}`,
      html: loginOtpEmailHtml(user?.username ?? "there", otp),
      text: loginOtpEmailText(user?.username ?? "there", otp),
    });
  });

  return { success: true };
}

export type ForgotPasswordState =
  | { error?: string; success?: boolean }
  | undefined;

export async function requestPasswordReset(
  state: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  if (!email || !z.string().email().safeParse(email).success) {
    return { error: "Please enter a valid email address." };
  }

  const user = await db
    .selectFrom("users")
    .where("email", "=", email)
    .select(["id", "username"])
    .executeTakeFirst();

  // This is to prevent email numeration attacks.
  if (!user) return { success: true };

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  const now = new Date().toISOString();

  // invalidating previous reset tokens for this user
  await db
    .deleteFrom("password_reset_tokens")
    .where("user_id", "=", user.id)
    .execute();

  await db
    .insertInto("password_reset_tokens")
    .values({
      id: randomUUID(),
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      used: 0,
      created_at: now,
    })
    .execute();

  const base =
    process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000";
  const resetUrl = `${base}/reset-password?token=${rawToken}`;

  // Sending email after response (kinda bg-task)
  after(async () => {
    await sendEmail({
      to: email,
      subject: "Reset your Locus password",
      html: passwordResetEmailHtml(user.username, resetUrl),
      text: passwordResetEmailText(user.username, resetUrl),
    });
  });

  return { success: true };
}

export type ResetPasswordState =
  | { error?: string; success?: boolean }
  | undefined;

export async function resetPassword(
  state: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = formData.get("token")?.toString();
  const password = formData.get("password")?.toString();
  const confirm = formData.get("confirm")?.toString();

  if (!token) return { error: "Invalid or missing reset token." };
  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");

  const record = await db
    .selectFrom("password_reset_tokens")
    .where("token_hash", "=", tokenHash)
    .where("used", "=", 0)
    .selectAll()
    .executeTakeFirst();

  if (!record) {
    return { error: "This link is invalid or has already been used." };
  }

  if (new Date(record.expires_at) < new Date()) {
    return { error: "This link has expired. Please request a new one." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date().toISOString();

  await db
    .updateTable("users")
    .set({ password_hash: passwordHash, updated_at: now })
    .where("id", "=", record.user_id)
    .execute();

  await db
    .updateTable("password_reset_tokens")
    .set({ used: 1 })
    .where("id", "=", record.id)
    .execute();

  redirect("/login?reset=1");
}

export async function logoutUser() {
  await signOut({ redirectTo: "/login" });
}
