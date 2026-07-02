"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/AuthShell";
import { ShieldCheck, ArrowRight, Loader2, RotateCcw } from "lucide-react";
import { verifyEmailOtp, resendOtp } from "@/actions/verify";
import { cn } from "@/lib/utils";

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${local[0]}${"*".repeat(Math.max(local.length - 1, 3))}@${domain}`;
}

interface VerifyEmailFormProps {
  email: string;
  inviteToken: string;
}

export function VerifyEmailForm({ email, inviteToken }: VerifyEmailFormProps) {
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyEmailOtp,
    undefined,
  );
  const [resendState, resendAction, resendPending] = useActionState(
    resendOtp,
    undefined,
  );

  if (!email) {
    return (
      <AuthShell>
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            No email found. Please sign up again.
          </p>
          <Link href="/signup" className="text-primary text-sm hover:underline">
            Back to sign up
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-sm bg-primary/10 text-primary">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="text-[26px] leading-tight font-semibold tracking-tight">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-foreground">
              {maskEmail(email)}
            </span>
            . Enter it below to verify your account.
          </p>
        </div>

        <form action={verifyAction} className="space-y-4">
          <input type="hidden" name="email" value={email} />
          {inviteToken && (
            <input type="hidden" name="invite" value={inviteToken} />
          )}

          <div className="space-y-2">
            <input
              name="otp"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="000000"
              autoComplete="one-time-code"
              autoFocus
              className={cn(
                "w-full h-14 text-center text-3xl font-bold tracking-[0.5em] rounded-sm border bg-background outline-none transition-colors",
                "focus:border-primary",
                verifyState?.error ? "border-destructive" : "border-input",
              )}
            />
            {verifyState?.error && (
              <p className="text-xs text-destructive">{verifyState.error}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={verifyPending}
            className="w-full h-11 gap-2"
          >
            {verifyPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Verify email <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        <div className="flex items-center justify-between text-sm">
          <form action={resendAction}>
            <input type="hidden" name="email" value={email} />
            <button
              type="submit"
              disabled={resendPending}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {resendPending ? "Sending…" : "Resend code"}
            </button>
          </form>

          {resendState?.success && (
            <span className="text-xs text-green-600">New code sent!</span>
          )}
          {resendState?.error && (
            <span className="text-xs text-destructive">
              {resendState.error}
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Wrong email?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Back to sign up
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
