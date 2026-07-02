"use client";
import React from "react";
import { useRouter } from "next/navigation";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MainLayoutProps {
  children: React.ReactNode;
}

function AppContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { open } = useSidebar();

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
        </div>
      </header>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <AppContent>{children}</AppContent>
    </SidebarProvider>
  );
}
