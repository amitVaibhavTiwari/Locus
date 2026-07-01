import React from "react";
import { TopbarLayout } from "@/components/layout/TopbarLayout";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TopbarLayout>{children}</TopbarLayout>;
}
