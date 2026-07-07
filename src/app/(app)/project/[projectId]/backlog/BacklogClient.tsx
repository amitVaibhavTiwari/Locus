"use client";
import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ChevronDown,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Archive,
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
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ViewTaskDialog } from "@/components/dialogs/ViewTaskDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { moveIssueToSprint } from "@/actions/sprints";
import { formatDateTime, formatDate } from "@/lib/date";

interface Issue {
  id: string;
  issue_number: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  type: string;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  labels: string[];
  epic_name: string | null;
  assignee: { id: string; username: string; avatar_url: string | null } | null;
  reporter: { id: string; username: string; avatar_url: string | null } | null;
}

interface Sprint {
  id: string;
  name: string;
  status: "active" | "planned";
}

interface BacklogClientProps {
  projectId: string;
  projectName: string;
  initialIssues: Issue[];
  initialHasMore: boolean;
  initialTotal: number;
  sprints: Sprint[];
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

type SortOption = "created_at_desc" | "created_at_asc";

interface Filters {
  search: string;
  priority: string;
  assigneeId: string;
  reporterId: string;
  sort: SortOption;
}

function UserFilter({
  value,
  selectedLabel,
  placeholder,
  projectId,
  showUnassigned,
  onChange,
}: {
  value: string;
  selectedLabel: string;
  placeholder: string;
  projectId: string;
  showUnassigned?: boolean;
  onChange: (userId: string, label: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<
    Array<{ id: string; username: string; avatar_url: string | null }>
  >([]);
  const [userLoading, setUserLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUserLoading(true);
    const t = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        const res = await fetch(
          `/api/projects/${projectId}/backlog/users?${params}`,
        );
        if (res.ok) setUsers(await res.json());
      } finally {
        setUserLoading(false);
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
            {isActive ? selectedLabel : `All ${placeholder}s`}
          </span>
          <ChevronDown className="w-3 h-3 ml-1 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <Input
          placeholder={`Search ${placeholder.toLowerCase()}...`}
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
          {showUnassigned && (
            <button
              className={`w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-muted flex items-center gap-2 transition-colors ${value === "none" ? "bg-primary/10 text-primary font-medium" : ""}`}
              onClick={() => {
                onChange("none", "Unassigned");
                setOpen(false);
              }}
            >
              <div className="w-5 h-5 rounded-full border border-dashed border-muted-foreground flex items-center justify-center shrink-0">
                <span className="text-[9px]">–</span>
              </div>
              Unassigned
            </button>
          )}
          {userLoading ? (
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

export function BacklogClient({
  projectId,
  projectName,
  initialIssues,
  initialHasMore,
  initialTotal,
  sprints,
}: BacklogClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [searchInput, setSearchInput] = useState("");
  const [priority, setPriority] = useState("all");
  const [assigneeId, setAssigneeId] = useState("");
  const [assigneeLabel, setAssigneeLabel] = useState("");
  const [reporterId, setReporterId] = useState("");
  const [reporterLabel, setReporterLabel] = useState("");
  const [sort, setSort] = useState<SortOption>("created_at_desc");

  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);

  const filtersRef = useRef<Filters>({
    search: "",
    priority: "all",
    assigneeId: "",
    reporterId: "",
    sort: "created_at_desc",
  });
  const offsetRef = useRef(initialIssues.length);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(initialHasMore);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchInitRef = useRef(false);

  hasMoreRef.current = hasMore;
  loadingRef.current = loading;

  const fetchIssues = useCallback(
    async (reset: boolean) => {
      if (loadingRef.current) return;
      if (reset) offsetRef.current = 0;
      loadingRef.current = true;
      setLoading(true);
      try {
        const f = filtersRef.current;
        const params = new URLSearchParams({
          sort: f.sort,
          offset: String(offsetRef.current),
        });
        if (f.search) params.set("search", f.search);
        if (f.priority !== "all") params.set("priority", f.priority);
        if (f.assigneeId) params.set("assigneeId", f.assigneeId);
        if (f.reporterId) params.set("reporterId", f.reporterId);

        const res = await fetch(`/api/projects/${projectId}/backlog?${params}`);
        if (!res.ok) return;
        const data: { issues: Issue[]; hasMore: boolean; total: number } =
          await res.json();

        if (reset) {
          setIssues(data.issues);
          setTotal(data.total);
        } else {
          setIssues((prev) => [...prev, ...data.issues]);
        }
        hasMoreRef.current = data.hasMore;
        setHasMore(data.hasMore);
        offsetRef.current += data.issues.length;
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
        if (entries[0].isIntersecting) fetchIssues(false);
      },
      { threshold: 0.1, rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchIssues]);

  useEffect(() => {
    if (!searchInitRef.current) {
      searchInitRef.current = true;
      return;
    }
    const t = setTimeout(() => {
      filtersRef.current = { ...filtersRef.current, search: searchInput };
      fetchIssues(true);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, fetchIssues]);

  const applyFilter = useCallback(
    (patch: Partial<Filters>) => {
      const next = { ...filtersRef.current, ...patch };
      filtersRef.current = next;
      fetchIssues(true);
    },
    [fetchIssues],
  );

  const handlePriorityChange = (v: string) => {
    setPriority(v);
    applyFilter({ priority: v });
  };

  const handleSortChange = (v: SortOption) => {
    setSort(v);
    applyFilter({ sort: v });
  };

  const handleAssigneeChange = (userId: string, label: string) => {
    setAssigneeId(userId);
    setAssigneeLabel(label);
    applyFilter({ assigneeId: userId });
  };

  const handleReporterChange = (userId: string, label: string) => {
    setReporterId(userId);
    setReporterLabel(label);
    applyFilter({ reporterId: userId });
  };

  const handleMoveToSprint = (
    issueId: string,
    sprintId: string,
    sprintName: string,
  ) => {
    startTransition(async () => {
      const result = await moveIssueToSprint(issueId, sprintId);
      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      setIssues((prev) => prev.filter((i) => i.id !== issueId));
      toast({ title: `Moved to ${sprintName}` });
    });
  };

  const activeSprints = sprints.filter((s) => s.status === "active");
  const plannedSprints = sprints.filter((s) => s.status === "planned");

  return (
    <div className="w-full max-w-full p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">Backlog</h1>
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs -mb-2 font-semibold">
              {total}
            </span>
          </div>
          <p className="text-muted-foreground mt-2">
            {projectName} &bull; Unscheduled issues waiting to be pulled into a
            sprint
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => router.push(`/project/${projectId}/archived`)}
        >
          <Archive className="w-4 h-4" />
          Archived Tasks
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search backlog..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={priority} onValueChange={handlePriorityChange}>
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

        <UserFilter
          value={assigneeId}
          selectedLabel={assigneeLabel}
          placeholder="Assignee"
          projectId={projectId}
          showUnassigned
          onChange={handleAssigneeChange}
        />

        <UserFilter
          value={reporterId}
          selectedLabel={reporterLabel}
          placeholder="Reporter"
          projectId={projectId}
          onChange={handleReporterChange}
        />

        <Select
          value={sort}
          onValueChange={(v) => handleSortChange(v as SortOption)}
        >
          <SelectTrigger className="w-44">
            <ArrowUpDown className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at_desc">
              <span className="flex items-center gap-2">
                <ArrowDown className="w-3 h-3" /> Newest first
              </span>
            </SelectItem>
            <SelectItem value="created_at_asc">
              <span className="flex items-center gap-2">
                <ArrowUp className="w-3 h-3" /> Oldest first
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!loading && issues.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">Backlog is empty</p>
          <p className="text-sm mt-1">
            All issues are assigned to sprints, or no issues exist yet.
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-border bg-card overflow-hidden">
          <div className="flex">
            <div className="min-w-[320px] max-w-[320px] border-r border-border bg-card z-10">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80 h-11 px-5">
                      Title
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues.map((issue) => (
                    <ViewTaskDialog
                      key={issue.id}
                      issueId={issue.id}
                      trigger={
                        <TableRow className="border-b border-border/60 last:border-0 hover:bg-muted/30 h-14 cursor-pointer transition-colors">
                          <TableCell className="h-14 py-0 px-5">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium text-foreground line-clamp-1">
                                {issue.title}
                              </span>
                              <span className="text-[11px] text-muted-foreground font-mono">
                                TASK-{issue.issue_number}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      }
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex-1 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80 min-w-[110px] h-11 px-5">
                      Priority
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80 min-w-[90px] h-11 px-5">
                      Type
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80 min-w-[160px] h-11 px-5">
                      Assignee
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80 min-w-[160px] h-11 px-5">
                      Reporter
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80 min-w-[120px] h-11 px-5">
                      Created
                    </TableHead>
                    {sprints.length > 0 && (
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80 min-w-[160px] h-11 px-5">
                        Sprint
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues.map((issue) => (
                    <TableRow
                      key={issue.id}
                      className="border-b border-border/60 last:border-0 hover:bg-muted/30 h-14 transition-colors"
                    >
                      <TableCell className="h-14 py-0 px-5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[issue.priority] ?? "bg-muted-foreground"}`}
                          />
                          <span className="text-sm capitalize text-foreground">
                            {issue.priority}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="h-14 py-0 px-5">
                        <Badge variant="outline" className="text-xs capitalize">
                          {issue.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="h-14 py-0 px-5">
                        {issue.assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              {issue.assignee.avatar_url && (
                                <AvatarImage src={issue.assignee.avatar_url} />
                              )}
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {getInitials(issue.assignee.username)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-foreground">
                              {issue.assignee.username}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm italic">
                            Unassigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="h-14 py-0 px-5">
                        {issue.reporter ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              {issue.reporter.avatar_url && (
                                <AvatarImage src={issue.reporter.avatar_url} />
                              )}
                              <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                                {getInitials(issue.reporter.username)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-foreground">
                              {issue.reporter.username}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="h-14 py-0 px-5">
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {formatDateTime(issue.created_at, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </TableCell>
                      {sprints.length > 0 && (
                        <TableCell className="h-14 py-0 px-5">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                disabled={isPending}
                              >
                                Add to sprint
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-52">
                              {activeSprints.length > 0 && (
                                <>
                                  <DropdownMenuLabel className="text-[11px] text-muted-foreground uppercase tracking-wide">
                                    Current Sprint
                                  </DropdownMenuLabel>
                                  {activeSprints.map((s) => (
                                    <DropdownMenuItem
                                      key={s.id}
                                      onClick={() =>
                                        handleMoveToSprint(
                                          issue.id,
                                          s.id,
                                          s.name,
                                        )
                                      }
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-success mr-2 shrink-0" />
                                      {s.name}
                                    </DropdownMenuItem>
                                  ))}
                                  {plannedSprints.length > 0 && (
                                    <DropdownMenuSeparator />
                                  )}
                                </>
                              )}
                              {plannedSprints.length > 0 && (
                                <>
                                  <DropdownMenuLabel className="text-[11px] text-muted-foreground uppercase tracking-wide">
                                    Upcoming Sprints
                                  </DropdownMenuLabel>
                                  {plannedSprints.map((s) => (
                                    <DropdownMenuItem
                                      key={s.id}
                                      onClick={() =>
                                        handleMoveToSprint(
                                          issue.id,
                                          s.id,
                                          s.name,
                                        )
                                      }
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mr-2 shrink-0" />
                                      {s.name}
                                    </DropdownMenuItem>
                                  ))}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
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
