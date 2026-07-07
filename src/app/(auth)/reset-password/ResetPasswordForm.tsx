"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/AuthShell";
import { ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { resetPassword } from "@/actions/auth";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, action, pending] = useActionState(resetPassword, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!token) {
    return (
      <AuthShell>
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Invalid link
            </h1>
            <p className="text-sm text-muted-foreground">
              This password reset link is invalid or missing. Please request a
              new one.
            </p>
          </div>
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
      <form action={action} className="space-y-6">
        <input type="hidden" name="token" value={token} />

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Set new password
          </h1>
          <p className="text-sm text-muted-foreground">
            Choose a strong password for your account.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                className="h-10 pr-10"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <div className="relative">
              <Input
                id="confirm"
                name="confirm"
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat your password"
                className="h-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
          </div>
        </div>

        <Button type="submit" disabled={pending} className="w-full h-10 gap-2">
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
