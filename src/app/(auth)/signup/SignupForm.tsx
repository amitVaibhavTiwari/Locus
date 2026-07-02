"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/AuthShell";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { registerUser } from "@/actions/auth";

export function SignupForm({ inviteToken }: { inviteToken: string }) {
  const [state, action, pending] = useActionState(registerUser, undefined);

  return (
    <AuthShell>
      <form action={action} className="space-y-5">
        {inviteToken && (
          <input type="hidden" name="invite" value={inviteToken} />
        )}

        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-sm bg-primary/10 text-primary">
            <Mail className="w-5 h-5" />
          </div>
          <h1 className="text-[26px] leading-tight font-semibold tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground">
            {inviteToken
              ? "Create an account to accept your workspace invitation."
              : "Get started with your workspace in seconds."}
          </p>
        </div>

        {state?.errors?.root && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-sm">
            {state.errors.root[0]}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Sarah Johnson"
            className="h-11"
            required
          />
          {state?.errors?.name && (
            <p className="text-xs text-destructive">{state.errors.name[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@company.com"
            className="h-11"
            required
          />
          {state?.errors?.email && (
            <p className="text-xs text-destructive">{state.errors.email[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Min. 8 characters"
            className="h-11"
            required
          />
          {state?.errors?.password && (
            <p className="text-xs text-destructive">
              {state.errors.password[0]}
            </p>
          )}
        </div>

        <Button type="submit" disabled={pending} className="w-full h-11 gap-2">
          {pending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Continue <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground tracking-wider">
              or
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>

        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          By continuing you agree to our{" "}
          <span className="underline">Terms</span> and{" "}
          <span className="underline">Privacy Policy</span>.
        </p>
      </form>
    </AuthShell>
  );
}
