"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/AuthShell";
import { Lock, ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import { resetPassword } from "@/actions/auth";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, action, pending] = useActionState(resetPassword, undefined);

  if (!token) {
    return (
      <AuthShell>
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-sm bg-destructive/10 text-destructive">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h1 className="text-[26px] leading-tight font-semibold tracking-tight">
            Invalid link
          </h1>
          <p className="text-sm text-muted-foreground">
            This password reset link is invalid or missing. Please request a new
            one.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block text-sm text-primary hover:underline"
          >
            Request new link
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <form action={action} className="space-y-7">
        <input type="hidden" name="token" value={token} />

        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-sm bg-primary/10 text-primary">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-[26px] leading-tight font-semibold tracking-tight">
            Set new password
          </h1>
          <p className="text-sm text-muted-foreground">
            Choose a strong password for your account.
          </p>
        </div>

        {state?.error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-sm">
            {state.error}
          </p>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Min. 8 characters"
              className="h-11"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              placeholder="Repeat your password"
              className="h-11"
              required
            />
          </div>
        </div>

        <Button type="submit" disabled={pending} className="w-full h-11 gap-2">
          {pending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Update password <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
