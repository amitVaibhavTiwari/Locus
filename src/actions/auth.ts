"use server";
import { db } from "@/lib/db";
import { signIn, signOut } from "@/lib/auth";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { generateOtp, hashOtp } from "@/lib/otp";
import { sendEmail, otpEmailHtml, otpEmailText } from "@/lib/email";

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

  // This is to remove any previous pending verification for this email
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

  if (!emailResult.success && process.env.SMTP_URL) {
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

  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: safeRedirect,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.type === "CredentialsSignin") {
        return { error: "Invalid email or password." };
      }
      return { error: "Something went wrong. Please try again." };
    }
    throw err;
  }
}

export async function logoutUser() {
  await signOut({ redirectTo: "/login" });
}
