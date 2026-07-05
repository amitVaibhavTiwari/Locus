"use client";
import { useState, useEffect, useRef, useTransition } from "react";
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
  Loader2,
  Archive,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { pinProject, unpinProject } from "@/actions/projects";
import { formatDateTime } from "@/lib/date";

interface Project {
  id: string;
  name: string;
  description: string | null;
  visibility: "public" | "private";
  created_at: string;
  updated_at: string;
}

interface ProjectsClientProps {
  initialProjects: Project[];
  initialHasMore: boolean;
  initialTotal: number;
  pinnedIds: string[];
  userRole: "owner" | "admin" | "member";
}

export function ProjectsClient({
  initialProjects,
  initialHasMore,
  initialTotal,
  pinnedIds: initialPinnedIds,
  userRole,
}: ProjectsClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(
    new Set(initialPinnedIds),
  );

  const offsetRef = useRef(initialProjects.length);
  const searchRef = useRef("");
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(initialHasMore);
  const sentinelRef = useRef<HTMLDivElement>(null);

  hasMoreRef.current = hasMore;
  loadingRef.current = loading;

  useEffect(() => {
    const t = setTimeout(async () => {
      const q = searchQuery;
      searchRef.current = q;
      offsetRef.current = 0;
      setLoading(true);
      loadingRef.current = true;
      try {
        const params = new URLSearchParams({ offset: "0" });
        if (q) params.set("search", q);
        const res = await fetch(`/api/projects?${params}`);
        if (!res.ok) return;
        const data: { projects: Project[]; hasMore: boolean; total: number } =
          await res.json();
        setProjects(data.projects);
        setHasMore(data.hasMore);
        setTotal(data.total);
        hasMoreRef.current = data.hasMore;
        offsetRef.current = data.projects.length;
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const loadMore = async () => {
      if (loadingRef.current || !hasMoreRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const params = new URLSearchParams({
          offset: String(offsetRef.current),
        });
        if (searchRef.current) params.set("search", searchRef.current);
        const res = await fetch(`/api/projects?${params}`);
        if (!res.ok) return;
        const data: { projects: Project[]; hasMore: boolean } =
          await res.json();
        setProjects((prev) => [...prev, ...data.projects]);
        setHasMore(data.hasMore);
        hasMoreRef.current = data.hasMore;
        offsetRef.current += data.projects.length;
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1, rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">Projects</h1>
            <span className="flex items-center justify-center min-w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold px-2">
              {total}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">
            Manage all your projects and track their progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          {userRole === "owner" && (
            <Button variant="outline" asChild>
              <Link href="/projects/archived">
                <Archive className="w-4 h-4 mr-2" />
                See Archived Projects
              </Link>
            </Button>
          )}
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => router.push("/projects/new")}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search projects by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-3">
        {projects.map((project) => (
          <div
            key={project.id}
            className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-all duration-200 cursor-pointer group"
            onClick={() => router.push(`/project/${project.id}`)}
          >
            <div className="flex items-center gap-4 flex-1">
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
                  {formatDateTime(project.updated_at, {
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

        {!loading && projects.length === 0 && (
          <div className="text-center py-20">
            {searchQuery ? (
              <p className="text-muted-foreground">
                No projects match &ldquo;{searchQuery}&rdquo;.
              </p>
            ) : (
              <>
                <p className="text-muted-foreground text-lg">
                  No projects yet.
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Create your first project to get started.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => router.push("/projects/new")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />
    </div>
  );
}
