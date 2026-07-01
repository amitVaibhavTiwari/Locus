"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

const Auth = () => {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    // simulating sending OTP [will add real stuff soon]
    toast({
      title: "OTP Sent",
      description: `A 6-digit code has been sent to ${email}`,
    });
    setStep("otp");
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    // Simulate OTP verification
    if (otp === "123456") {
      toast({
        title: "Success",
        description: isLogin
          ? "Welcome back!"
          : "Account created successfully!",
      });
      router.push("/");
    } else {
      toast({
        title: "Error",
        description: "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setOtp("");
  };

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-border shadow-custom-lg">
          <CardHeader className="text-center space-y-2">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
              {step === "email" ? (
                <Mail className="w-6 h-6 text-primary" />
              ) : (
                <Shield className="w-6 h-6 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold">
              {step === "email"
                ? isLogin
                  ? "Welcome Back"
                  : "Create Account"
                : "Verify Your Email"}
            </CardTitle>
            <p className="text-muted-foreground">
              {step === "email"
                ? isLogin
                  ? "Sign in to your account"
                  : "Create a new account to get started"
                : `Enter the 6-digit code sent to ${email}`}
            </p>
          </CardHeader>

          <CardContent>
            {step === "email" ? (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-primary text-white"
                >
                  {isLogin ? "Send Login Code" : "Send Verification Code"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-primary hover:underline"
                  >
                    {isLogin
                      ? "Don't have an account? Sign up"
                      : "Already have an account? Sign in"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="Enter 6-digit code"
                    className="w-full text-center text-lg tracking-wider"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    For demo purposes, use:{" "}
                    <span className="font-mono bg-muted px-1 rounded">
                      123456
                    </span>
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-primary text-white"
                >
                  Verify & Continue
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={handleBackToEmail}
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Back to email
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      toast({
                        title: "Code Resent",
                        description: "New code sent to your email",
                      })
                    }
                    className="text-primary hover:underline"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
