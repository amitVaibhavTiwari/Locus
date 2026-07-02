"use client";
import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Calendar,
  Search,
  MoreVertical,
  Pin,
  PinOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { pinProject, unpinProject } from "@/actions/projects";

interface Project {
  id: string;
  name: string;
  description: string | null;
  visibility: "public" | "private";
  created_at: string;
  updated_at: string;
}

interface ProjectsClientProps {
  projects: Project[];
  pinnedIds: string[];
}

const PROJECTS_PER_PAGE = 10;

export function ProjectsClient({
  projects,
  pinnedIds: initialPinnedIds,
}: ProjectsClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(
    new Set(initialPinnedIds),
  );

  const handleProjectClick = (projectId: string) => {
    router.push(`/project/${projectId}`);
  };

  const handlePinToggle = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    const isPinned = pinnedIds.has(projectId);

    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (isPinned) next.delete(projectId);
      else next.add(projectId);
      return next;
    });

    startTransition(async () => {
      if (isPinned) await unpinProject(projectId);
      else await pinProject(projectId);
      router.refresh();
    });
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
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

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search projects by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">No projects yet.</p>
          <p className="text-muted-foreground text-sm mt-1">
            Create your first project to get started.
          </p>
          <Button className="mt-4" onClick={() => router.push("/projects/new")}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedProjects.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-all duration-200 cursor-pointer group"
              onClick={() => handleProjectClick(project.id)}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-3 h-3 rounded-full bg-primary/60" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(project.updated_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
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
                      onClick={(e) => handlePinToggle(e, project.id)}
                    >
                      {pinnedIds.has(project.id) ? (
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
      )}

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
}
