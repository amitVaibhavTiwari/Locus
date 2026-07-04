"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  MoreHorizontal,
  ChevronDown,
  Loader2,
} from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface EpicsClientProps {
  projectId: string;
  projectName: string;
  initialEpics: Epic[];
  initialHasMore: boolean;
  initialTotal: number;
}

interface Filters {
  search: string;
  priority: string;
  status: string;
  ownerId: string;
}

const PRIORITY_DOT: Record<string, string> = {
  highest: "bg-destructive",
  high: "bg-destructive",
  medium: "bg-warning",
  low: "bg-success",
  none: "bg-muted-foreground",
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function OwnerFilter({
  value,
  selectedLabel,
  projectId,
  onChange,
}: {
  value: string;
  selectedLabel: string;
  projectId: string;
  onChange: (userId: string, label: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<
    Array<{ id: string; username: string; avatar_url: string | null }>
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        const res = await fetch(
          `/api/projects/${projectId}/backlog/users?${params}`,
        );
        if (res.ok) setUsers(await res.json());
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [open, query, projectId]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const isActive = !!value;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-40 justify-between text-sm font-normal h-10 ${isActive ? "border-primary/60 bg-primary/5" : ""}`}
        >
          <span className="truncate">
            {isActive ? selectedLabel : "All Owners"}
          </span>
          <ChevronDown className="w-3 h-3 ml-1 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <Input
          placeholder="Search owner..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 mb-2 text-sm"
          autoFocus
        />
        <div className="space-y-0.5 max-h-52 overflow-y-auto">
          {isActive && (
            <button
              className="w-full text-left px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted rounded-sm"
              onClick={() => {
                onChange("", "");
                setOpen(false);
              }}
            >
              ✕ Clear filter
            </button>
          )}
          <button
            className={`w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-muted flex items-center gap-2 transition-colors ${value === "none" ? "bg-primary/10 text-primary font-medium" : ""}`}
            onClick={() => {
              onChange("none", "No owner");
              setOpen(false);
            }}
          >
            <div className="w-5 h-5 rounded-full border border-dashed border-muted-foreground flex items-center justify-center shrink-0">
              <span className="text-[9px]">–</span>
            </div>
            No owner
          </button>
          {loading ? (
            <div className="flex justify-center py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">
              No users found
            </p>
          ) : (
            users.map((user) => (
              <button
                key={user.id}
                className={`w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-muted flex items-center gap-2 transition-colors ${value === user.id ? "bg-primary/10 text-primary font-medium" : ""}`}
                onClick={() => {
                  onChange(user.id, user.username);
                  setOpen(false);
                }}
              >
                <Avatar className="w-5 h-5 shrink-0">
                  {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                  <AvatarFallback className="text-[9px]">
                    {getInitials(user.username)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{user.username}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function EpicsClient({
  projectId,
  projectName,
  initialEpics,
  initialHasMore,
  initialTotal,
}: EpicsClientProps) {
  const router = useRouter();

  const [searchInput, setSearchInput] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerId, setOwnerId] = useState("");
  const [ownerLabel, setOwnerLabel] = useState("");

  const [epics, setEpics] = useState<Epic[]>(initialEpics);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);

  const filtersRef = useRef<Filters>({
    search: "",
    priority: "all",
    status: "all",
    ownerId: "",
  });
  const offsetRef = useRef(initialEpics.length);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(initialHasMore);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchInitRef = useRef(false);

  hasMoreRef.current = hasMore;
  loadingRef.current = loading;

  const fetchEpics = useCallback(
    async (reset: boolean) => {
      if (loadingRef.current) return;
      if (reset) offsetRef.current = 0;
      loadingRef.current = true;
      setLoading(true);
      try {
        const f = filtersRef.current;
        const params = new URLSearchParams({
          offset: String(offsetRef.current),
        });
        if (f.search) params.set("search", f.search);
        if (f.priority !== "all") params.set("priority", f.priority);
        if (f.status !== "all") params.set("status", f.status);
        if (f.ownerId) params.set("ownerId", f.ownerId);

        const res = await fetch(`/api/projects/${projectId}/epics?${params}`);
        if (!res.ok) return;
        const data: { epics: Epic[]; hasMore: boolean; total: number } =
          await res.json();

        if (reset) {
          setEpics(data.epics);
          setTotal(data.total);
        } else {
          setEpics((prev) => [...prev, ...data.epics]);
        }
        hasMoreRef.current = data.hasMore;
        setHasMore(data.hasMore);
        offsetRef.current += data.epics.length;
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [projectId],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreRef.current &&
          !loadingRef.current
        ) {
          fetchEpics(false);
        }
      },
      { threshold: 0.1, rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchEpics]);

  useEffect(() => {
    if (!searchInitRef.current) {
      searchInitRef.current = true;
      return;
    }
    const t = setTimeout(() => {
      filtersRef.current = { ...filtersRef.current, search: searchInput };
      fetchEpics(true);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, fetchEpics]);

  const applyFilter = useCallback(
    (patch: Partial<Filters>) => {
      filtersRef.current = { ...filtersRef.current, ...patch };
      fetchEpics(true);
    },
    [fetchEpics],
  );

  return (
    <div className="w-full max-w-full p-6 space-y-8">
      <div className="flex items-end justify-between border-b border-border pb-6 flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70 mb-2">
            Roadmap
          </p>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Epics
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {projectName} &bull; Group related work into product themes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="gap-2"
            onClick={() => router.push(`/epics/new?projectId=${projectId}`)}
          >
            <Plus className="w-4 h-4" />
            Create Epic
          </Button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search epics..."
            className="pl-10"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select
          value={priorityFilter}
          onValueChange={(v) => {
            setPriorityFilter(v);
            applyFilter({ priority: v });
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="highest">Highest</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            applyFilter({ status: v });
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
        <OwnerFilter
          value={ownerId}
          selectedLabel={ownerLabel}
          projectId={projectId}
          onChange={(id, label) => {
            setOwnerId(id);
            setOwnerLabel(label);
            applyFilter({ ownerId: id });
          }}
        />
      </div>

      {!loading && epics.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No epics yet</p>
          <p className="text-sm mt-1">
            Create your first epic to organize related work.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border border border-border rounded-md bg-card overflow-hidden">
          {epics.map((epic) => {
            const pct =
              epic.totalIssues > 0
                ? Math.round((epic.doneIssues / epic.totalIssues) * 100)
                : 0;
            const dotClass =
              PRIORITY_DOT[epic.priority] ?? "bg-muted-foreground";
            return (
              <div
                key={epic.id}
                className="group flex items-center gap-6 px-6 py-5 hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => router.push(`/epics/${epic.id}`)}
              >
                <div className="relative w-12 h-12 flex-shrink-0">
                  <svg className="w-12 h-12 -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      className="text-muted"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - pct / 100)}`}
                      className="text-primary transition-all"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-semibold tabular-nums">
                      {pct}%
                    </span>
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
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {epic.description}
                    </p>
                  )}
                </div>

                <div className="hidden md:flex items-center gap-6 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                      Status
                    </div>
                    <div className="text-sm capitalize text-foreground">
                      {epic.status.replace("_", " ")}
                    </div>
                  </div>
                  <div className="text-right tabular-nums">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                      Issues
                    </div>
                    <div className="text-sm text-foreground">
                      {epic.doneIssues}/{epic.totalIssues}
                    </div>
                  </div>
                  {epic.owner && (
                    <div className="flex flex-col items-start gap-1">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                        Owner
                      </div>
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Avatar className="w-7 h-7 ring-2 ring-card cursor-pointer">
                              {epic.owner.avatar_url && (
                                <AvatarImage src={epic.owner.avatar_url} />
                              )}
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
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/epics/${epic.id}`);
                      }}
                    >
                      View Issues
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />
    </div>
  );
}
