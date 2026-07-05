"use client";
import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { KanbanBoard, Task } from "@/components/kanban/KanbanBoard";
import { ProjectTableView } from "@/components/project/ProjectTableView";
import { ProjectCalendarView } from "@/components/project/ProjectCalendarView";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Users,
  Settings,
  List,
  Calendar,
  LayoutGrid,
  Table2,
  CalendarDays,
  Plus,
  Pin,
  PinOff,
  Layers,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SubGroupBy, subGroupOptions } from "@/lib/subGroup";
import { pinProject, unpinProject } from "@/actions/projects";
import { moveIssue } from "@/actions/issues";

type ViewMode = "kanban" | "table" | "calendar";

type ColumnState = {
  tasks: Task[];
  hasMore: boolean;
  loading: boolean;
};

interface ProjectBoardClientProps {
  projectId: string;
  projectName: string;
  pinnedIds: string[];
  boardColumns: Array<{ id: string; title: string }>;
  projectMembers: Array<{ id: string; username: string }>;
  activeSprintId: string | null;
}

export function ProjectBoardClient({
  projectId,
  projectName,
  pinnedIds: initialPinnedIds,
  boardColumns,
  projectMembers,
  activeSprintId,
}: ProjectBoardClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const [isPinned, setIsPinned] = useState(() =>
    initialPinnedIds.includes(projectId),
  );
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [subGroupBy, setSubGroupBy] = useState<SubGroupBy>("none");

  const [sprintFilter, setSprintFilter] = useState(
    activeSprintId ? "current" : "all",
  );
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [reporterFilter, setReporterFilter] = useState("all");
  const [tableSort, setTableSort] = useState("created_at:desc");

  const [kanbanData, setKanbanData] = useState<Record<string, ColumnState>>({});

  const [tableData, setTableData] = useState<{
    tasks: Task[];
    hasMore: boolean;
    loading: boolean;
  }>({ tasks: [], hasMore: false, loading: false });
  const tableOffsetRef = useRef(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const kanbanSentinelRef = useRef<HTMLDivElement>(null);

  const buildFilterParams = useCallback(
    (extra: Record<string, string> = {}) => {
      const p: Record<string, string> = { sprintFilter };
      if (sprintFilter === "current" && activeSprintId) {
        p.activeSprintId = activeSprintId;
      }
      if (priorityFilter !== "all") p.priority = priorityFilter;
      if (assigneeFilter !== "all") p.assigneeId = assigneeFilter;
      if (reporterFilter !== "all") p.reporterId = reporterFilter;
      return new URLSearchParams({ ...p, ...extra });
    },
    [
      sprintFilter,
      activeSprintId,
      priorityFilter,
      assigneeFilter,
      reporterFilter,
    ],
  );

  useEffect(() => {
    if (viewMode !== "kanban" || boardColumns.length === 0) return;
    let cancelled = false;

    setKanbanData(
      Object.fromEntries(
        boardColumns.map((col) => [
          col.id,
          { tasks: [], hasMore: false, loading: true },
        ]),
      ),
    );

    boardColumns.forEach(async (col) => {
      const p = buildFilterParams({
        view: "kanban",
        status: col.id,
        offset: "0",
      });
      try {
        const res = await fetch(`/api/projects/${projectId}/board?${p}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) {
          setKanbanData((prev) => ({
            ...prev,
            [col.id]: {
              tasks: data.tasks ?? [],
              hasMore: !!data.hasMore,
              loading: false,
            },
          }));
        }
      } catch {
        if (!cancelled) {
          setKanbanData((prev) => ({
            ...prev,
            [col.id]: { tasks: [], hasMore: false, loading: false },
          }));
        }
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    viewMode,
    projectId,
    sprintFilter,
    activeSprintId,
    priorityFilter,
    assigneeFilter,
    reporterFilter,
  ]);

  const handleLoadMoreColumn = useCallback(
    async (columnId: string) => {
      const current = kanbanData[columnId];
      if (!current || current.loading || !current.hasMore) return;

      setKanbanData((prev) => ({
        ...prev,
        [columnId]: { ...prev[columnId], loading: true },
      }));

      const offset = current.tasks.length;
      const p = buildFilterParams({
        view: "kanban",
        status: columnId,
        offset: String(offset),
      });

      try {
        const res = await fetch(`/api/projects/${projectId}/board?${p}`);
        const data = await res.json();
        setKanbanData((prev) => ({
          ...prev,
          [columnId]: {
            tasks: [...(prev[columnId]?.tasks ?? []), ...(data.tasks ?? [])],
            hasMore: !!data.hasMore,
            loading: false,
          },
        }));
      } catch {
        setKanbanData((prev) => ({
          ...prev,
          [columnId]: { ...prev[columnId], loading: false },
        }));
      }
    },
    [kanbanData, buildFilterParams, projectId],
  );

  const loadMoreColumnRef = useRef(handleLoadMoreColumn);
  useEffect(() => {
    loadMoreColumnRef.current = handleLoadMoreColumn;
  }, [handleLoadMoreColumn]);

  useEffect(() => {
    if (viewMode !== "kanban") return;
    const sentinel = kanbanSentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        boardColumns.forEach((col) => loadMoreColumnRef.current(col.id));
      },
      { root: container, rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [viewMode, boardColumns]);

  const handleKanbanTasksChange = useCallback((updatedTasks: Task[]) => {
    setKanbanData((prev) => {
      const tasksByStatus = new Map<string, Task[]>();
      updatedTasks.forEach((t) => {
        const arr = tasksByStatus.get(t.status) ?? [];
        arr.push(t);
        tasksByStatus.set(t.status, arr);
      });
      const updated = { ...prev };
      for (const colId of Object.keys(prev)) {
        updated[colId] = {
          ...prev[colId],
          tasks: tasksByStatus.get(colId) ?? [],
        };
      }
      return updated;
    });
  }, []);

  useEffect(() => {
    if (viewMode !== "table") return;
    let cancelled = false;

    tableOffsetRef.current = 0;
    setTableData({ tasks: [], hasMore: false, loading: true });

    const p = buildFilterParams({
      view: "table",
      offset: "0",
      sort: tableSort,
    });
    fetch(`/api/projects/${projectId}/board?${p}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        tableOffsetRef.current = data.tasks?.length ?? 0;
        setTableData({
          tasks: data.tasks ?? [],
          hasMore: !!data.hasMore,
          loading: false,
        });
      })
      .catch(() => {
        if (!cancelled)
          setTableData({ tasks: [], hasMore: false, loading: false });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    viewMode,
    projectId,
    sprintFilter,
    activeSprintId,
    priorityFilter,
    assigneeFilter,
    reporterFilter,
    tableSort,
  ]);

  const handleTableLoadMore = useCallback(async () => {
    if (tableData.loading || !tableData.hasMore) return;

    setTableData((prev) => ({ ...prev, loading: true }));
    const offset = tableOffsetRef.current;
    const p = buildFilterParams({
      view: "table",
      offset: String(offset),
      sort: tableSort,
    });

    try {
      const res = await fetch(`/api/projects/${projectId}/board?${p}`);
      const data = await res.json();
      tableOffsetRef.current = offset + (data.tasks?.length ?? 0);
      setTableData((prev) => ({
        tasks: [...prev.tasks, ...(data.tasks ?? [])],
        hasMore: !!data.hasMore,
        loading: false,
      }));
    } catch {
      setTableData((prev) => ({ ...prev, loading: false }));
    }
  }, [
    tableData.loading,
    tableData.hasMore,
    buildFilterParams,
    projectId,
    tableSort,
  ]);

  const handleTableStatusChange = useCallback(
    (taskId: string, newStatus: Task["status"]) => {
      setTableData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId ? { ...t, status: newStatus } : t,
        ),
      }));
    },
    [],
  );

  const handleTogglePin = () => {
    const wasPin = !isPinned;
    setIsPinned(wasPin);
    startTransition(async () => {
      if (wasPin) await pinProject(projectId);
      else await unpinProject(projectId);
      router.refresh();
      toast({
        title: wasPin ? "Project pinned" : "Project unpinned",
        description: wasPin
          ? `${projectName} has been added to your sidebar.`
          : `${projectName} has been removed from your sidebar.`,
      });
    });
  };

  const handleMoveIssue = (issueId: string, newStatus: Task["status"]) => {
    startTransition(async () => {
      const result = await moveIssue(issueId, newStatus);
      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  const allKanbanTasks = Object.values(kanbanData).flatMap((c) => c.tasks);
  const columnHasMore: Record<string, boolean> = {};
  const columnLoading: Record<string, boolean> = {};
  for (const [id, state] of Object.entries(kanbanData)) {
    columnHasMore[id] = state.hasMore;
    columnLoading[id] = state.loading;
  }

  const viewTabs = [
    { id: "kanban" as ViewMode, label: "Kanban", icon: LayoutGrid },
    { id: "table" as ViewMode, label: "Table", icon: Table2 },
    { id: "calendar" as ViewMode, label: "Calendar", icon: CalendarDays },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <div className="flex-shrink-0 bg-background border-b border-border px-6 pt-4 pb-3">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground truncate">
            {projectName}
          </h1>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Settings className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => router.push(`/project/${projectId}/team`)}
              >
                <Users className="w-4 h-4 mr-2" /> Team Members
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/backlog?projectId=${projectId}`)}
              >
                <List className="w-4 h-4 mr-2" /> Backlog
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/project/${projectId}/sprints`)}
              >
                <Calendar className="w-4 h-4 mr-2" /> Sprints
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/project/${projectId}/settings`)}
              >
                <Settings className="w-4 h-4 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleTogglePin}>
                {isPinned ? (
                  <>
                    <PinOff className="w-4 h-4 mr-2" /> Unpin from Sidebar
                  </>
                ) : (
                  <>
                    <Pin className="w-4 h-4 mr-2" /> Pin to Sidebar
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <TooltipProvider>
            <div className="flex items-center bg-muted/30 dark:bg-muted/20 rounded-lg p-1">
              {viewTabs.map((tab) => (
                <Tooltip key={tab.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setViewMode(tab.id)}
                      className={`flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 ${
                        viewMode === tab.id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tab.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>

          <div className="flex items-center gap-2 flex-wrap">
            <Select value={sprintFilter} onValueChange={setSprintFilter}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Sprint" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current" disabled={!activeSprintId}>
                  Current Sprint
                </SelectItem>
                <SelectItem value="all">All Tasks</SelectItem>
              </SelectContent>
            </Select>

            <SearchableSelect
              value={assigneeFilter}
              onValueChange={setAssigneeFilter}
              placeholder="Assignee"
              searchPlaceholder="Search assignees..."
              triggerClassName="w-40 h-9"
              options={[
                { value: "all", label: "All Assignees" },
                ...projectMembers.map((m) => ({
                  value: m.id,
                  label: m.username,
                })),
              ]}
            />

            <SearchableSelect
              value={reporterFilter}
              onValueChange={setReporterFilter}
              placeholder="Reporter"
              searchPlaceholder="Search reporters..."
              triggerClassName="w-40 h-9"
              options={[
                { value: "all", label: "All Reporters" },
                ...projectMembers.map((m) => ({
                  value: m.id,
                  label: m.username,
                })),
              ]}
            />

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-36 h-9">
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

            {viewMode === "kanban" && (
              <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-border">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <Select
                  value={subGroupBy}
                  onValueChange={(v) => setSubGroupBy(v as SubGroupBy)}
                >
                  <SelectTrigger className="w-40 h-9">
                    <SelectValue placeholder="Sub-group by" />
                  </SelectTrigger>
                  <SelectContent>
                    {subGroupOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.value === "none"
                          ? "No sub-group"
                          : `Group by ${opt.label}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {viewMode === "table" && (
              <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-border">
                <Select value={tableSort} onValueChange={setTableSort}>
                  <SelectTrigger className="w-48 h-9">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at:desc">
                      Created (Newest first)
                    </SelectItem>
                    <SelectItem value="created_at:asc">
                      Created (Oldest first)
                    </SelectItem>
                    <SelectItem value="due_date:asc">
                      Deadline (Earliest first)
                    </SelectItem>
                    <SelectItem value="due_date:desc">
                      Deadline (Latest first)
                    </SelectItem>
                    <SelectItem value="priority:asc">
                      Priority (Highest first)
                    </SelectItem>
                    <SelectItem value="priority:desc">
                      Priority (Lowest first)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => router.push(`/tasks/new?projectId=${projectId}`)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-auto px-6 pb-6"
      >
        {viewMode === "kanban" && (
          <>
            <KanbanBoard
              projectId={projectId}
              projectName={projectName}
              externalTasks={allKanbanTasks}
              onTasksChange={handleKanbanTasksChange}
              onMoveIssue={handleMoveIssue}
              subGroupBy={subGroupBy}
              boardColumns={boardColumns}
              columnHasMore={columnHasMore}
              columnLoading={columnLoading}
            />
            <div ref={kanbanSentinelRef} className="h-1" />
          </>
        )}

        {viewMode === "table" && (
          <ProjectTableView
            tasks={tableData.tasks}
            onStatusChange={handleTableStatusChange}
            boardStatuses={boardColumns.map((c) => ({
              key: c.id,
              name: c.title,
            }))}
            hasMore={tableData.hasMore}
            isLoading={tableData.loading}
            onLoadMore={handleTableLoadMore}
            scrollRoot={scrollContainerRef}
          />
        )}

        {viewMode === "calendar" && (
          <ProjectCalendarView
            projectId={projectId}
            activeSprintId={activeSprintId}
            sprintFilter={sprintFilter}
            priorityFilter={priorityFilter}
            assigneeFilter={assigneeFilter}
            reporterFilter={reporterFilter}
          />
        )}
      </div>
    </div>
  );
}
