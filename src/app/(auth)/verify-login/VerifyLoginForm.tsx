"use client";
import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/AuthShell";
import { ArrowRight, Loader2, RotateCcw } from "lucide-react";
import { verifyLoginOtp, resendLoginOtp } from "@/actions/auth";
import { cn } from "@/lib/utils";

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${local[0]}${"*".repeat(Math.max(local.length - 1, 3))}@${domain}`;
}

interface VerifyLoginFormProps {
  email: string;
  redirectTo: string;
}

export function VerifyLoginForm({ email, redirectTo }: VerifyLoginFormProps) {
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyLoginOtp,
    undefined,
  );
  const [resendState, resendAction, resendPending] = useActionState(
    resendLoginOtp,
    undefined,
  );
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const otp = digits.join("");

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const newDigits = [...digits];
    pasted.split("").forEach((char, i) => {
      newDigits[i] = char;
    });
    setDigits(newDigits);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  }

  if (!email) {
    return (
      <AuthShell>
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Session expired. Please sign in again.
          </p>
          <Link href="/login" className="text-primary text-sm hover:underline">
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit login code to{" "}
            <span className="font-medium text-foreground">
              {maskEmail(email)}
            </span>
            . Enter it below to sign in.
          </p>
        </div>

        <form action={verifyAction} className="space-y-6">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="otp" value={otp} />
          {redirectTo && (
            <input type="hidden" name="redirect" value={redirectTo} />
          )}

          <div className="space-y-3">
            <div className="flex gap-2" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  autoFocus={i === 0}
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  className={cn(
                    "w-full h-12 text-center text-xl font-semibold rounded-sm border bg-background outline-none transition-colors",
                    "focus:border-primary",
                    verifyState?.error ? "border-destructive" : "border-input",
                  )}
                />
              ))}
            </div>
            {verifyState?.error && (
              <p className="text-sm text-destructive">{verifyState.error}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={verifyPending || otp.length < 6}
            className="w-full h-10 gap-2"
          >
            {verifyPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Sign in <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        <div className="flex items-center justify-between">
          <form action={resendAction}>
            <input type="hidden" name="email" value={email} />
            <button
              type="submit"
              disabled={resendPending}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {resendPending ? "Sending…" : "Resend code"}
            </button>
          </form>

          {resendState?.success && (
            <span className="text-xs text-success">Code sent!</span>
          )}
          {resendState?.error && (
            <span className="text-xs text-destructive">
              {resendState.error}
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Wrong account?{" "}
          <Link
            href="/login"
            className="text-foreground font-medium hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
