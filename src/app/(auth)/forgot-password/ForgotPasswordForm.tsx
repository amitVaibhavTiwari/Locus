"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/AuthShell";
import { Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { requestPasswordReset } from "@/actions/auth";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    undefined,
  );

  if (state?.success) {
    return (
      <AuthShell>
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-sm bg-success/10 text-success">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h1 className="text-[26px] leading-tight font-semibold tracking-tight">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground">
            If an account exists for that email, we&apos;ve sent a password
            reset link. It expires in 1 hour.
          </p>
          <Link
            href="/login"
            className="inline-block text-sm text-primary hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <form action={action} className="space-y-7">
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-sm bg-primary/10 text-primary">
            <Mail className="w-5 h-5" />
          </div>
          <h1 className="text-[26px] leading-tight font-semibold tracking-tight">
            Forgot password?
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {state?.error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-sm">
            {state.error}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@company.com"
            className="h-11"
            required
            autoFocus
          />
        </div>

        <Button type="submit" disabled={pending} className="w-full h-11 gap-2">
          {pending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Send reset link <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>

        <p className="text-sm text-muted-foreground text-center">
          Remember it?{" "}
          <Link
            href="/login"
            className="text-primary font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
