"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { AuthShell } from "@/components/auth/AuthShell";
import { Mail, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Signup() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const sendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("Please enter your email");
    toast.success(`Verification code sent to ${email}`);
    setStep("otp");
  };

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("Enter the 6-digit code");
    toast.success("Email verified");
    router.push("/onboarding/workspace");
  };

  return (
    <AuthShell>
      {step === "email" ? (
        <form onSubmit={sendOtp} className="space-y-7">
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-sm bg-primary/10 text-primary">
              <Mail className="w-5 h-5" />
            </div>
            <h1 className="text-[26px] leading-tight font-semibold tracking-tight">
              Create your account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your work email to get started. We&apos;ll send you a
              verification code.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="h-11"
            />
          </div>

          <Button type="submit" className="w-full h-11 gap-2">
            Continue <ArrowRight className="w-4 h-4" />
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
      ) : (
        <form onSubmit={verify} className="space-y-7">
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-sm bg-primary/10 text-primary">
              <Mail className="w-5 h-5" />
            </div>
            <h1 className="text-[26px] leading-tight font-semibold tracking-tight">
              Check your email
            </h1>
            <p className="text-sm text-muted-foreground">
              We sent a 6-digit code to{" "}
              <span className="text-foreground font-medium">{email}</span>
            </p>
          </div>

          <div className="space-y-3">
            <Label className="sr-only">Verification code</Label>
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              containerClassName="justify-between"
            >
              <InputOTPGroup className="gap-2 w-full justify-between">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="h-14 w-12 text-xl font-semibold rounded-sm border first:rounded-sm last:rounded-sm border-input data-[active=true]:border-primary data-[active=true]:ring-0"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <p className="text-xs text-muted-foreground text-center">
              For demo use any 6 digits
            </p>
          </div>

          <Button type="submit" className="w-full h-11">
            Verify &amp; continue
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Didn&apos;t get the code?{" "}
            <button
              type="button"
              onClick={() => toast.success("Code resent")}
              className="text-primary font-medium hover:underline"
            >
              Resend
            </button>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
