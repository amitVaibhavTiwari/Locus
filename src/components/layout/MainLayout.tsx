"use client";
import React, { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { SplashScreen } from "./SplashScreen";
import { LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutUser } from "@/actions/auth";

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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function AppContent({
  children,
  user,
}: {
  children: React.ReactNode;
  user: SessionUser;
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const [, startTransition] = useTransition();

  const displayName = user?.username ?? "User";
  const initials = getInitials(displayName);

  return (
    <div
      style={{ paddingLeft: open ? "var(--sidebar-width)" : "0" }}
      className="flex flex-col min-h-svh w-full bg-background transition-[padding-left] duration-200 ease-linear"
    >
      <header className="h-16 border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="hover:bg-secondary" />
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 pl-3 border-l border-border cursor-pointer rounded-sm px-2 py-1 transition-colors group">
                  <div className="text-right">
                    <p className="text-sm font-medium group-hover:underline">
                      {displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email ?? ""}
                    </p>
                  </div>
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() => router.push(`/team/${user?.id}`)}
                  className="cursor-pointer"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    startTransition(() => {
                      logoutUser();
                    })
                  }
                  className="cursor-pointer text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
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
      <SplashScreen />
      <SidebarProvider defaultOpen={true}>
        <AppSidebar
          workspaceName={orgName}
          activeOrgId={activeOrgId}
          userRole={userRole}
          pinnedProjects={pinnedProjects}
          workspaces={workspaces}
        />
        <AppContent user={user}>{children}</AppContent>
      </SidebarProvider>
    </>
  );
}
