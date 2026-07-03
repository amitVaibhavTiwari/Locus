"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Epic {
  id: string;
  name: string;
  description: string | null;
  priority: string;
  status: string;
  totalIssues: number;
  doneIssues: number;
  owner: { id: string; username: string; avatar_url: string | null } | null;
}

interface Project {
  id: string;
  name: string;
}

interface EpicsClientProps {
  projects: Project[];
  selectedProjectId: string | null;
  epics: Epic[];
}

function getInitials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const PRIORITY_DOT: Record<string, string> = {
  highest: "bg-destructive",
  high: "bg-destructive",
  medium: "bg-warning",
  low: "bg-success",
  none: "bg-muted-foreground",
};

export function EpicsClient({ projects, selectedProjectId, epics }: EpicsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = epics.filter((e) => {
    const ms = e.name.toLowerCase().includes(search.toLowerCase());
    const mp = priorityFilter === "all" || e.priority === priorityFilter;
    const mst = statusFilter === "all" || e.status === statusFilter;
    return ms && mp && mst;
  });

  const handleProjectChange = (id: string) => {
    router.push(`/epics?projectId=${id}`);
  };

  return (
    <div className="w-full max-w-full p-6 space-y-8">
      <div className="flex items-end justify-between border-b border-border pb-6 flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70 mb-2">Roadmap</p>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Epics</h1>
          <p className="text-muted-foreground mt-1 text-sm">Group related work into product themes</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {projects.length > 1 && (
            <Select value={selectedProjectId ?? ""} onValueChange={handleProjectChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            className="gap-2"
            onClick={() =>
              router.push(selectedProjectId ? `/epics/new?projectId=${selectedProjectId}` : "/epics/new")
            }
            disabled={!selectedProjectId}
          >
            <Plus className="w-4 h-4" />
            Create Epic
          </Button>
        </div>
      </div>

      {!selectedProjectId ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No projects found. Create a project first.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search epics..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="highest">Highest</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg font-medium">No epics yet</p>
              <p className="text-sm mt-1">Create your first epic to organize related work.</p>
            </div>
          ) : (
            <div className="divide-y divide-border border border-border rounded-md bg-card overflow-hidden">
              {filtered.map((epic) => {
                const pct = epic.totalIssues > 0
                  ? Math.round((epic.doneIssues / epic.totalIssues) * 100)
                  : 0;
                const dotClass = PRIORITY_DOT[epic.priority] ?? "bg-muted-foreground";
                return (
                  <div
                    key={epic.id}
                    className="group flex items-center gap-6 px-6 py-5 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => router.push(`/epics/${epic.id}`)}
                  >
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <svg className="w-12 h-12 -rotate-90">
                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" fill="none" className="text-muted" />
                        <circle
                          cx="24" cy="24" r="20"
                          stroke="currentColor" strokeWidth="3" fill="none"
                          strokeDasharray={`${2 * Math.PI * 20}`}
                          strokeDashoffset={`${2 * Math.PI * 20 * (1 - pct / 100)}`}
                          className="text-primary transition-all"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-semibold tabular-nums">{pct}%</span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                        <h3 className="text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {epic.name}
                        </h3>
                      </div>
                      {epic.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{epic.description}</p>
                      )}
                    </div>

                    <div className="hidden md:flex items-center gap-6 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Status</div>
                        <div className="text-sm capitalize text-foreground">
                          {epic.status.replace("_", " ")}
                        </div>
                      </div>
                      <div className="text-right tabular-nums">
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Issues</div>
                        <div className="text-sm text-foreground">{epic.doneIssues}/{epic.totalIssues}</div>
                      </div>
                      {epic.owner && (
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Owner</div>
                          <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Avatar className="w-7 h-7 ring-2 ring-card cursor-pointer">
                                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
                                    {getInitials(epic.owner.username)}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent>{epic.owner.username}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/epics/${epic.id}`); }}>
                          View Issues
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
