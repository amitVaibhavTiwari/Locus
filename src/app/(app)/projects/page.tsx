"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Calendar,
  Users,
  Search,
  MoreVertical,
  Pin,
  PinOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const projects = [
  {
    id: "1",
    name: "E-commerce Platform",
    description: "Complete e-commerce solution with payment integration",
    progress: 75,
    status: "In Progress",
    team: ["SJ", "RK", "AM"],
    dueDate: "Dec 15, 2024",
    priority: "High",
    color: "todo",
  },
  {
    id: "2",
    name: "Mobile App Redesign",
    description: "Modernizing the mobile app interface and user experience",
    progress: 45,
    status: "In Progress",
    team: ["MH", "LT"],
    dueDate: "Jan 20, 2025",
    priority: "Medium",
    color: "in-progress",
  },
  {
    id: "3",
    name: "Dashboard Analytics",
    description: "Business intelligence dashboard with advanced analytics",
    progress: 90,
    status: "QA Review",
    team: ["SJ", "NK", "PL"],
    dueDate: "Dec 10, 2024",
    priority: "High",
    color: "qa",
  },
  {
    id: "4",
    name: "Marketing Website",
    description: "Corporate website redesign with modern branding",
    progress: 100,
    status: "Completed",
    team: ["AM", "RK"],
    dueDate: "Nov 30, 2024",
    priority: "Low",
    color: "done",
  },
  {
    id: "5",
    name: "Customer Portal",
    description: "Self-service portal for customers",
    progress: 30,
    status: "In Progress",
    team: ["SJ", "MH"],
    dueDate: "Feb 10, 2025",
    priority: "Medium",
    color: "in-progress",
  },
  {
    id: "6",
    name: "Internal CRM",
    description: "Customer relationship management tool",
    progress: 60,
    status: "In Progress",
    team: ["LT", "RK", "AM"],
    dueDate: "Jan 15, 2025",
    priority: "High",
    color: "todo",
  },
  {
    id: "7",
    name: "Payment Gateway",
    description: "Multi-currency payment integration",
    progress: 85,
    status: "QA Review",
    team: ["NK", "PL"],
    dueDate: "Dec 28, 2024",
    priority: "High",
    color: "qa",
  },
  {
    id: "8",
    name: "Email Marketing Tool",
    description: "Automated email campaign manager",
    progress: 20,
    status: "In Progress",
    team: ["SJ"],
    dueDate: "Mar 01, 2025",
    priority: "Medium",
    color: "in-progress",
  },
  {
    id: "9",
    name: "Analytics Engine",
    description: "Real-time data analytics service",
    progress: 50,
    status: "In Progress",
    team: ["MH", "RK"],
    dueDate: "Feb 20, 2025",
    priority: "High",
    color: "in-progress",
  },
  {
    id: "10",
    name: "Onboarding Flow",
    description: "New user onboarding redesign",
    progress: 70,
    status: "In Progress",
    team: ["LT", "AM"],
    dueDate: "Jan 05, 2025",
    priority: "Medium",
    color: "todo",
  },
  {
    id: "11",
    name: "Help Center",
    description: "Documentation and support center",
    progress: 40,
    status: "In Progress",
    team: ["NK"],
    dueDate: "Feb 14, 2025",
    priority: "Low",
    color: "in-progress",
  },
  {
    id: "12",
    name: "Mobile SDK",
    description: "Native SDK for iOS and Android",
    progress: 25,
    status: "In Progress",
    team: ["PL", "SJ"],
    dueDate: "Mar 15, 2025",
    priority: "High",
    color: "in-progress",
  },
  {
    id: "13",
    name: "Admin Dashboard",
    description: "Internal admin tools and controls",
    progress: 90,
    status: "QA Review",
    team: ["RK", "MH", "LT"],
    dueDate: "Dec 22, 2024",
    priority: "Medium",
    color: "qa",
  },
  {
    id: "14",
    name: "Search Service",
    description: "Elasticsearch-powered search",
    progress: 65,
    status: "In Progress",
    team: ["AM"],
    dueDate: "Jan 28, 2025",
    priority: "Medium",
    color: "in-progress",
  },
  {
    id: "15",
    name: "Notification System",
    description: "Cross-channel notification delivery",
    progress: 55,
    status: "In Progress",
    team: ["SJ", "NK"],
    dueDate: "Feb 05, 2025",
    priority: "High",
    color: "todo",
  },
];

const PROJECTS_PER_PAGE = 10;

const Projects = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { pinProject, unpinProject, isProjectPinned } = useWorkspaceStore();

  const handleProjectClick = (projectId: string) => {
    router.push(`/project/${projectId}`);
  };

  const handlePinToggle = (
    e: React.MouseEvent,
    project: (typeof projects)[0],
  ) => {
    e.stopPropagation();
    if (isProjectPinned(project.id)) {
      unpinProject(project.id);
    } else {
      pinProject({ id: project.id, name: project.name, color: project.color });
    }
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE),
  );
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * PROJECTS_PER_PAGE,
    currentPage * PROJECTS_PER_PAGE,
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage all your projects and track their progress
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => router.push("/projects/new")}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search projects by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Projects List */}
      <div className="space-y-3">
        {paginatedProjects.map((project) => (
          <div
            key={project.id}
            className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-all duration-200 cursor-pointer group"
            onClick={() => handleProjectClick(project.id)}
          >
            <div className="flex items-center gap-4 flex-1">
              <div
                className={`w-3 h-3 rounded-full bg-kanban-${project.color}`}
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {project.name}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {project.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{project.team.length} members</span>
              </div>

              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{project.dueDate}</span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => handlePinToggle(e, project)}
                  >
                    {isProjectPinned(project.id) ? (
                      <>
                        <PinOff className="w-4 h-4 mr-2" />
                        Unpin from Sidebar
                      </>
                    ) : (
                      <>
                        <Pin className="w-4 h-4 mr-2" />
                        Pin to Sidebar
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length > PROJECTS_PER_PAGE && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * PROJECTS_PER_PAGE + 1}–
            {Math.min(currentPage * PROJECTS_PER_PAGE, filteredProjects.length)}{" "}
            of {filteredProjects.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
