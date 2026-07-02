"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspaceStore } from "@/stores/workspaceStore";

interface TopbarLayoutProps {
  children: React.ReactNode;
}

export function TopbarLayout({ children }: TopbarLayoutProps) {
  const router = useRouter();
  let workspaceName = "";
  try {
    workspaceName =
      (useWorkspaceStore as any)((s: any) => s?.workspaceName) || "";
  } catch {
    workspaceName = "";
  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <header className="h-16 border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between h-full px-6">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <div className="w-8 h-8 rounded-sm bg-primary text-primary-foreground flex items-center justify-center font-semibold">
              {(workspaceName || "W").charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-sm">
              {workspaceName || "Workspace"}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 pl-3 border-l border-border cursor-pointer rounded-sm px-2 py-1 transition-colors group">
                <div className="text-right">
                  <p className="text-sm font-medium group-hover:underline">
                    Sarah Johnson
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Project Manager
                  </p>
                </div>
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    SJ
                  </AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => router.push("/team/1")}
                className="cursor-pointer"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push("/login")}
                className="cursor-pointer text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
