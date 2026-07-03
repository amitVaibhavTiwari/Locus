"use client";
import { useState, useEffect, useTransition } from "react";
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

interface ProjectBoardClientProps {
  projectId: string;
  projectName: string;
  pinnedIds: string[];
  initialIssues: Task[];
  boardColumns: Array<{ id: string; title: string }>;
  memberNames: string[];
  activeSprintId: string | null;
}

export function ProjectBoardClient({
  projectId,
  projectName,
  pinnedIds: initialPinnedIds,
  initialIssues,
  boardColumns,
  memberNames,
  activeSprintId,
}: ProjectBoardClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const [isPinned, setIsPinned] = useState(() =>
    initialPinnedIds.includes(projectId),
  );
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [tasks, setTasks] = useState<Task[]>(initialIssues);

  // to sync when server re-fetches (after router.refresh())
  useEffect(() => {
    setTasks(initialIssues);
  }, [initialIssues]);

  const [sprintFilter, setSprintFilter] = useState<string>("current");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [reporterFilter, setReporterFilter] = useState<string>("all");
  const [subGroupBy, setSubGroupBy] = useState<SubGroupBy>("none");

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
        router.refresh(); // revert optimistic update
      }
    });
  };

  const handleStatusChange = (taskId: string, newStatus: Task["status"]) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );
  };

  const uniqueAssignees = memberNames;
  const uniqueReporters = memberNames;

  const filteredTasks = tasks.filter((task) => {
    const matchesSprint =
      sprintFilter === "all" ||
      (sprintFilter === "current" && activeSprintId
        ? task.sprintId === activeSprintId
        : true);
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;
    const matchesAssignee =
      assigneeFilter === "all" || task.assignee?.name === assigneeFilter;
    const matchesReporter =
      reporterFilter === "all" || task.reporter?.name === reporterFilter;
    return matchesSprint && matchesPriority && matchesAssignee && matchesReporter;
  });

  const viewTabs = [
    { id: "kanban" as ViewMode, label: "Kanban", icon: LayoutGrid },
    { id: "table" as ViewMode, label: "Table", icon: Table2 },
    { id: "calendar" as ViewMode, label: "Calendar", icon: CalendarDays },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <div className="flex-shrink-0 bg-background border-b border-border px-6 pt-4 pb-3">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate">
              {projectName}
            </h1>
          </div>

          <div className="flex items-center gap-2">
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
                  <Users className="w-4 h-4 mr-2" />
                  Team Members
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/backlog?projectId=${projectId}`)}>
                  <List className="w-4 h-4 mr-2" />
                  Backlog
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/project/${projectId}/sprints`)}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Sprints
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`/project/${projectId}/settings`)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleTogglePin}>
                  {isPinned ? (
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
                <SelectItem value="current">Current Sprint</SelectItem>
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
                ...uniqueAssignees.map((a) => ({ value: a, label: a })),
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
                ...uniqueReporters.map((r) => ({ value: r, label: r })),
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

            {viewMode !== "calendar" && (
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

      <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
        {viewMode === "kanban" && (
          <KanbanBoard
            projectId={projectId}
            projectName={projectName}
            externalTasks={filteredTasks}
            onTasksChange={setTasks}
            onMoveIssue={handleMoveIssue}
            subGroupBy={subGroupBy}
            boardColumns={boardColumns}
          />
        )}
        {viewMode === "table" && (
          <ProjectTableView
            tasks={filteredTasks}
            onStatusChange={handleStatusChange}
            subGroupBy={subGroupBy}
            boardStatuses={boardColumns.map((c) => ({
              key: c.id,
              name: c.title,
            }))}
          />
        )}
        {viewMode === "calendar" && (
          <ProjectCalendarView
            tasks={filteredTasks}
            boardStatuses={boardColumns.map((c) => ({
              key: c.id,
              name: c.title,
            }))}
          />
        )}
      </div>
    </div>
  );
}
