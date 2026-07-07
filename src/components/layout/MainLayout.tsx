"use client";
import React, { useEffect, useRef, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { SplashScreen } from "./SplashScreen";
import { PushNotificationManager } from "./PushNotificationManager";
import { useTheme } from "@/contexts/ThemeContext";

type SessionUser = {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
} | null;

interface MainLayoutProps {
  children: React.ReactNode;
  user: SessionUser;
  orgName: string;
  activeOrgId: string;
  brandColor: string | null;
  userRole: "owner" | "admin" | "member";
  pinnedProjects: { id: string; name: string }[];
  workspaces: { id: string; name: string; brandColor: string | null }[];
}

export function MainLayout({
  children,
  user,
  orgName,
  activeOrgId,
  brandColor,
  userRole,
  pinnedProjects,
  workspaces,
}: MainLayoutProps) {
  const { theme } = useTheme();
  const [splashKey, setSplashKey] = useState(0);
  const prevTheme = useRef(theme);

  useEffect(() => {
    if (prevTheme.current !== theme) {
      prevTheme.current = theme;
      setSplashKey((k) => k + 1);
    }
  }, [theme]);

  useEffect(() => {
    if (!brandColor) return;
    const hsl = brandColor
      .replace(/^hsl\(/, "")
      .replace(/\)$/, "")
      .trim();
    document.documentElement.style.setProperty("--primary", hsl);
    document.documentElement.style.setProperty("--ring", hsl);
    document.documentElement.style.setProperty("--sidebar-ring", hsl);
  }, [brandColor]);

  return (
    <>
      <SplashScreen key={splashKey} />
      <SidebarProvider defaultOpen={true}>
        <AppSidebar
          workspaceName={orgName}
          activeOrgId={activeOrgId}
          userRole={userRole}
          pinnedProjects={pinnedProjects}
          workspaces={workspaces}
          user={user}
        />
        <div
          style={{ paddingLeft: "var(--sidebar-width)" }}
          className="flex flex-col min-h-svh w-full bg-background"
        >
          <main className="flex-1 overflow-auto">{children}</main>
          <PushNotificationManager activeOrgId={activeOrgId} />
        </div>
      </SidebarProvider>
    </>
  );
}
