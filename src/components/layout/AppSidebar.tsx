"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Folder,
  Users,
  Settings,
  Pin,
  KanbanSquare,
  ChevronDown,
  ChevronRight,
  Send,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { switchWorkspace } from "@/actions/organizations";
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

const getMainNavigation = (role: "owner" | "admin" | "member") => [
  { title: "Home", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", url: "/projects", icon: Folder },
  { title: "Team", url: "/team", icon: Users },
  ...(role === "owner"
    ? [{ title: "Sent Invites", url: "/invites", icon: Send }]
    : []),
];

const settingsNavigation = [
  { title: "Settings", url: "/settings", icon: Settings },
];

const getProjectSubMenu = (projectId: string) => [
  { title: "Board", url: `/project/${projectId}` },
  { title: "Team", url: `/project/${projectId}/team` },
  { title: "Sprints", url: `/project/${projectId}/sprints` },
  { title: "Backlogs", url: `/project/${projectId}/backlog` },
  { title: "Epics", url: `/epics` },
  { title: "Settings", url: `/project/${projectId}/settings` },
];

interface AppSidebarProps {
  workspaceName: string;
  activeOrgId: string;
  userRole: "owner" | "admin" | "member";
  pinnedProjects: { id: string; name: string }[];
  workspaces: { id: string; name: string; brandColor: string | null }[];
}

export function AppSidebar({
  workspaceName,
  activeOrgId,
  userRole,
  pinnedProjects,
  workspaces,
}: AppSidebarProps) {
  const currentPath = usePathname();
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({});
  const [, startTransition] = useTransition();

  const toggleProject = (projectId: string) => {
    setOpenProjects((prev) => ({
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

  return (
    <Sidebar className="bg-accent/5 border-r border-border">
      <SidebarContent>
        {/* Header / Workspace Switcher */}
        <div className="p-4 border-b border-border">
          {workspaces.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full rounded-lg hover:bg-secondary transition-colors p-1 -m-1 group">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <KanbanSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <h1 className="font-bold text-sm text-foreground truncate">
                      {workspaceName}
                    </h1>
                    <p className="text-xs text-muted-foreground">Workspace</p>
                  </div>
                  <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0 opacity-60 group-hover:opacity-100" />
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
                    <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <KanbanSquare className="w-3 h-3 text-primary" />
                    </div>
                    <span className="flex-1 truncate">{ws.name}</span>
                    {ws.id === activeOrgId && (
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <KanbanSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-base text-foreground">
                  {workspaceName}
                </h1>
                <p className="text-xs text-muted-foreground">Workspace</p>
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
              {getMainNavigation(userRole).map((item) => (
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
                          <div className="w-3 h-3 rounded-full mr-2 bg-primary/60" />
                          <span className="font-medium truncate">
                            {project.name}
                          </span>
                        </div>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-6 mt-1 space-y-1">
                        {getProjectSubMenu(project.id).map((subItem) => (
                          <SidebarMenuButton key={subItem.title} asChild>
                            <Link
                              href={subItem.url}
                              className={getSubNavClassName(subItem.url)}
                            >
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        ))}
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

        {userRole === "owner" && (
          <div className="mt-auto border-t border-border">
            <SidebarGroup className="px-3 py-2">
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {settingsNavigation.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link
                          href={item.url}
                          className={getNavClassName(item.url)}
                        >
                          <item.icon className="w-5 h-5 mr-3" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
