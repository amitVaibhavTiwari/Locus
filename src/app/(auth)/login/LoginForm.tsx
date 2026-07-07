"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/AuthShell";
import { ArrowRight, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { loginUser } from "@/actions/auth";

export function LoginForm({
  redirectTo,
  passwordReset,
}: {
  redirectTo: string;
  passwordReset?: boolean;
}) {
  const [state, action, pending] = useActionState(loginUser, undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AuthShell>
      <form action={action} className="space-y-6">
        {redirectTo && (
          <input type="hidden" name="redirect" value={redirectTo} />
        )}

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to continue to your workspace.
          </p>
        </div>

        {passwordReset && (
          <p className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Password updated. Sign in with your new password.
          </p>
        )}

        <div className="space-y-4">
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
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="h-10 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
              Continue <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>

        <p className="text-sm text-muted-foreground text-center">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-foreground font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
