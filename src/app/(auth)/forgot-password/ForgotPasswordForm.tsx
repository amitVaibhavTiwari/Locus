"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/AuthShell";
import { ArrowRight, Loader2 } from "lucide-react";
import { requestPasswordReset } from "@/actions/auth";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    undefined,
  );
  const [email, setEmail] = useState("");

  if (state?.success) {
    return (
      <AuthShell>
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Check your email
            </h1>
            <p className="text-sm text-muted-foreground">
              A reset password link has been sent to{" "}
              <span className="font-medium text-foreground">{email}</span>. It
              expires in 1 hr.
            </p>
          </div>
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
      <form action={action} className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Forgot password?
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@company.com"
            className="h-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
        </div>

        <Button type="submit" disabled={pending} className="w-full h-10 gap-2">
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
            className="text-foreground font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
