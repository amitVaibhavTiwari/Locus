"use client";
import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Folder,
  Users,
  Settings,
  Pin,
  ChevronDown,
  ChevronRight,
  Check,
  ChevronsUpDown,
  LogOut,
  User,
  Sun,
  Moon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { switchWorkspace } from "@/actions/organizations";
import { logoutUser } from "@/actions/auth";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getInitials } from "@/lib/utils";

const getMainNavigation = () => [
  { title: "Home", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", url: "/projects", icon: Folder },
  { title: "Team", url: "/team", icon: Users },
];

type SubMenuItem =
  | { title: string; url: string; children?: never }
  | { title: string; url?: never; children: { title: string; url: string }[] };

const getProjectSubMenu = (projectId: string): SubMenuItem[] => [
  { title: "Board", url: `/project/${projectId}` },
  { title: "Team", url: `/project/${projectId}/team` },
  { title: "Sprints", url: `/project/${projectId}/sprints` },
  { title: "Backlogs", url: `/project/${projectId}/backlog` },
  { title: "Epics", url: `/project/${projectId}/epics` },
  { title: "Settings", url: `/project/${projectId}/settings` },
];

interface AppSidebarProps {
  workspaceName: string;
  activeOrgId: string;
  userRole: "owner" | "admin" | "member" | "viewer";
  pinnedProjects: { id: string; name: string }[];
  workspaces: { id: string; name: string; brandColor: string | null }[];
  user: {
    id: string;
    email: string;
    username: string;
    avatar_url: string | null;
  } | null;
}

export function AppSidebar({
  workspaceName,
  activeOrgId,
  userRole,
  pinnedProjects,
  workspaces,
  user,
}: AppSidebarProps) {
  const currentPath = usePathname();
  const router = useRouter();
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({});
  const [openArchived, setOpenArchived] = useState<Record<string, boolean>>({});
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [, startTransition] = useTransition();

  const toggleProject = (projectId: string) => {
    setOpenProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const toggleArchived = (projectId: string) => {
    setOpenArchived((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const getNavClassName = (url: string) =>
    `transition-all duration-200 ${
      currentPath === url
        ? "bg-primary text-primary-foreground font-medium"
        : "hover:bg-secondary text-sidebar-foreground hover:text-sidebar-accent-foreground"
    }`;

  const getSubNavClassName = (url: string) =>
    `transition-all duration-200 text-sm ${
      currentPath === url
        ? "bg-primary/10 text-primary font-medium"
        : "hover:bg-secondary text-muted-foreground hover:text-sidebar-accent-foreground"
    }`;

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const displayName = user?.username ?? "User";
  const initials = getInitials(displayName);
  const workspaceLogo =
    mounted && theme === "dark"
      ? "/locus_dark_logo.png"
      : "/locus_light_logo.png";

  return (
    <Sidebar className="bg-accent/5 border-r dark:border-none border-border">
      <SidebarContent>
        <div className="p-4 border-b border-border">
          {workspaces.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full rounded-md hover:bg-secondary transition-colors px-2 py-1.5 -mx-2 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={workspaceLogo}
                    alt=""
                    className="w-8 h-8 shrink-0"
                  />
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium mb-0.5">
                      Workspace
                    </p>
                    <span className="font-bold text-base text-foreground truncate leading-tight block">
                      {workspaceName}
                    </span>
                  </div>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="start" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Switch workspace
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {workspaces.map((ws) => (
                  <DropdownMenuItem
                    key={ws.id}
                    className="cursor-pointer gap-2"
                    onClick={() => {
                      if (ws.id === activeOrgId) return;
                      startTransition(() => switchWorkspace(ws.id));
                    }}
                  >
                    <span className="flex-1 truncate">{ws.name}</span>
                    {ws.id === activeOrgId && (
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-3 px-2 py-1.5 -mx-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={workspaceLogo} alt="" className="w-8 h-8 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium mb-0.5">
                  Workspace
                </p>
                <span className="font-bold text-base text-foreground truncate leading-tight block">
                  {workspaceName}
                </span>
              </div>
            </div>
          )}
        </div>

        <SidebarGroup className="px-3 py-2">
          <SidebarGroupLabel className="text-muted-foreground text-xs font-medium mb-2">
            WORKSPACE
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {getMainNavigation().map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} className={getNavClassName(item.url)}>
                      <item.icon className="w-5 h-5 mr-3" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <SidebarGroupLabel className="text-muted-foreground text-xs font-medium">
              PINNED PROJECTS
            </SidebarGroupLabel>
            <Pin className="w-4 h-4 text-muted-foreground" />
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {pinnedProjects.map((project) => (
                <Collapsible
                  key={project.id}
                  open={openProjects[project.id]}
                  onOpenChange={() => toggleProject(project.id)}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="w-full hover:bg-secondary text-sidebar-foreground hover:text-sidebar-accent-foreground">
                        <div className="flex items-center w-full">
                          {openProjects[project.id] ? (
                            <ChevronDown className="w-4 h-4 mr-2" />
                          ) : (
                            <ChevronRight className="w-4 h-4 mr-2" />
                          )}
                          <span className="font-medium truncate">
                            {project.name}
                          </span>
                        </div>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-6 mt-1 space-y-1">
                        {getProjectSubMenu(project.id).map((subItem) =>
                          subItem.children ? (
                            <Collapsible
                              key={subItem.title}
                              open={openArchived[project.id]}
                              onOpenChange={() => toggleArchived(project.id)}
                            >
                              <CollapsibleTrigger asChild>
                                <SidebarMenuButton className="w-full hover:bg-secondary text-muted-foreground hover:text-sidebar-accent-foreground text-sm">
                                  <div className="flex items-center w-full">
                                    {openArchived[project.id] ? (
                                      <ChevronDown className="w-3.5 h-3.5 mr-2 shrink-0" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 mr-2 shrink-0" />
                                    )}
                                    <span>{subItem.title}</span>
                                  </div>
                                </SidebarMenuButton>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="ml-5 mt-1 space-y-1">
                                  {subItem.children.map((child) => (
                                    <SidebarMenuButton
                                      key={child.title}
                                      asChild
                                    >
                                      <Link
                                        href={child.url}
                                        className={getSubNavClassName(
                                          child.url,
                                        )}
                                      >
                                        <span>{child.title}</span>
                                      </Link>
                                    </SidebarMenuButton>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          ) : (
                            <SidebarMenuButton key={subItem.title} asChild>
                              <Link
                                href={subItem.url}
                                className={getSubNavClassName(subItem.url)}
                              >
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          ),
                        )}
                      </div>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
              {pinnedProjects.length === 0 && (
                <p className="text-xs text-muted-foreground px-2 py-1">
                  No pinned projects
                </p>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto border-t border-borde dark:border-none">
          <div className="px-3 py-3">
            <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full rounded-md hover:bg-secondary transition-colors px-2 py-2 -mx-2 group">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-sm font-medium truncate leading-tight">
                      {displayName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email ?? ""}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem
                  onClick={() => router.push(`/team/${user?.id}`)}
                  className="cursor-pointer"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-sm">Theme</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setTheme("light");
                        setUserMenuOpen(false);
                      }}
                      className={`p-1.5 rounded transition-colors ${theme === "light" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Sun className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setTheme("dark");
                        setUserMenuOpen(false);
                      }}
                      className={`p-1.5 rounded transition-colors ${theme === "dark" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Moon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {userRole === "owner" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => router.push("/settings")}
                      className="cursor-pointer"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Workspace Settings
                    </DropdownMenuItem>
                  </>
                )}
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
      </SidebarContent>
    </Sidebar>
  );
}
