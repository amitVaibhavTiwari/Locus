"use client";
import { useState } from "react";
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
} from "lucide-react";
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
import { useWorkspaceStore } from "@/stores/workspaceStore";

const mainNavigation = [
  { title: "Home", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", url: "/projects", icon: Folder },
  { title: "Team", url: "/team", icon: Users },
];

const settingsNavigation = [
  { title: "Settings", url: "/settings", icon: Settings },
];

const getProjectSubMenu = (projectId: string) => [
  { title: "Board", url: `/project/${projectId}` },
  { title: "Team", url: `/project/${projectId}/team` },
  { title: "Sprints", url: `/project/${projectId}/sprints` },
  { title: "Backlogs", url: `/backlog` },
  { title: "Epics", url: `/epics` },
  { title: "Settings", url: `/project/${projectId}/settings` },
];

interface AppSidebarProps {
  workspaceName: string;
  userRole: "owner" | "admin" | "member";
}

export function AppSidebar({ workspaceName, userRole }: AppSidebarProps) {
  const currentPath = usePathname();
  const { pinnedProjects } = useWorkspaceStore();

  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({});

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
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <KanbanSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">
                {workspaceName}
              </h1>
              <p className="text-xs text-muted-foreground">Workspace</p>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup className="px-3 py-2">
          <SidebarGroupLabel className="text-muted-foreground text-xs font-medium mb-2">
            WORKSPACE
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainNavigation.map((item) => (
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

        {/* Pinned Projects */}
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
                          <div
                            className={`w-3 h-3 rounded-full mr-2 bg-kanban-${project.color}`}
                          />
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
