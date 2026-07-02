"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
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
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useToast } from "@/hooks/use-toast";
import { SubGroupBy, subGroupOptions } from "@/lib/subGroup";

const projectNames: Record<string, string> = {
  "1": "E-commerce Platform",
  "2": "Mobile App Redesign",
  "3": "Dashboard Analytics",
  "4": "Marketing Website",
};

type ViewMode = "kanban" | "table" | "calendar";

// Shared initial tasks for all views
const initialTasks: Task[] = [
  {
    id: "1",
    title: "User Authentication System",
    description: `<p><strong>Implementation Requirements:</strong></p>
      <ul>
        <li>JWT-based authentication with refresh tokens</li>
        <li>OAuth integration for <span style="color: #FF6B00">Google</span> and GitHub</li>
        <li>Two-factor authentication support</li>
        <li>Password reset functionality via email</li>
      </ul>`,
    status: "todo",
    priority: "high",
    assignee: { name: "Sarah Johnson", initials: "SJ" },
    reporter: { name: "Mike Harrison", initials: "MH" },
    labels: ["Backend", "Security"],
    dueDate: "2024-12-15",
    comments: 3,
  },
  {
    id: "2",
    title: "Dashboard UI Components",
    description: `<p>Create reusable components for the admin dashboard</p>`,
    status: "in-progress",
    priority: "medium",
    assignee: { name: "Mike Harrison", initials: "MH" },
    reporter: { name: "Lisa Thompson", initials: "LT" },
    labels: ["Frontend", "UI"],
    dueDate: "2024-12-20",
    comments: 5,
    attachments: 2,
  },
  {
    id: "3",
    title: "API Documentation",
    description: `<p>Document all REST API endpoints with examples</p>`,
    status: "qa",
    priority: "low",
    assignee: { name: "Lisa Thompson", initials: "LT" },
    reporter: { name: "Robert Kim", initials: "RK" },
    labels: ["Documentation"],
    dueDate: "2025-01-05",
    comments: 1,
  },
  {
    id: "4",
    title: "Performance Optimization",
    description: `<p>Optimize database queries and frontend bundle</p>`,
    status: "pending",
    priority: "high",
    assignee: { name: "Robert Kim", initials: "RK" },
    reporter: { name: "Sarah Johnson", initials: "SJ" },
    labels: ["Backend", "Performance"],
    dueDate: "2024-12-10",
    comments: 2,
  },
  {
    id: "5",
    title: "User Onboarding Flow",
    description: "Design and implement step-by-step user onboarding",
    status: "done",
    priority: "medium",
    assignee: { name: "Anna Miller", initials: "AM" },
    reporter: { name: "Mike Harrison", initials: "MH" },
    labels: ["Frontend", "UX"],
    dueDate: "2024-12-08",
    comments: 4,
  },
  {
    id: "6",
    title: "Mobile Responsive Design",
    description: "Ensure all pages work perfectly on mobile devices",
    status: "in-progress",
    priority: "high",
    assignee: { name: "Lisa Thompson", initials: "LT" },
    reporter: { name: "Anna Miller", initials: "AM" },
    labels: ["Frontend", "UI"],
    dueDate: "2024-12-18",
    comments: 8,
  },
  {
    id: "7",
    title: "Email Notification System",
    description: "Set up automated email notifications for key events",
    status: "todo",
    priority: "medium",
    assignee: { name: "Robert Kim", initials: "RK" },
    reporter: { name: "Sarah Johnson", initials: "SJ" },
    labels: ["Backend"],
    dueDate: "2024-12-22",
    comments: 2,
  },
  {
    id: "8",
    title: "Search Functionality",
    description: "Implement global search across all entities",
    status: "todo",
    priority: "low",
    assignee: { name: "Mike Harrison", initials: "MH" },
    reporter: { name: "Lisa Thompson", initials: "LT" },
    labels: ["Frontend", "Backend"],
    dueDate: "2025-01-10",
    comments: 0,
  },
  {
    id: "9",
    title: "Data Export Feature",
    description: "Allow users to export data in CSV and PDF formats",
    status: "qa",
    priority: "medium",
    assignee: { name: "Sarah Johnson", initials: "SJ" },
    reporter: { name: "Robert Kim", initials: "RK" },
    labels: ["Backend"],
    dueDate: "2024-12-25",
    comments: 3,
  },
  {
    id: "10",
    title: "Real-time Notifications",
    description: "Implement WebSocket-based real-time notifications",
    status: "pending",
    priority: "high",
    assignee: { name: "Robert Kim", initials: "RK" },
    reporter: { name: "Mike Harrison", initials: "MH" },
    labels: ["Backend", "Frontend"],
    dueDate: "2024-12-28",
    comments: 5,
  },
];

const statuses: Task["status"][] = [
  "todo",
  "in-progress",
  "qa",
  "pending",
  "done",
];
const priorities: Task["priority"][] = ["high", "medium", "low"];
const people = [
  { name: "Sarah Johnson", initials: "SJ" },
  { name: "Mike Harrison", initials: "MH" },
  { name: "Lisa Thompson", initials: "LT" },
  { name: "Robert Kim", initials: "RK" },
  { name: "Anna Miller", initials: "AM" },
];
const titlePool = [
  "Refactor settings module",
  "Improve onboarding copy",
  "Fix billing webhook",
  "Add audit log table",
  "Migrate to new icon set",
  "Investigate slow dashboard query",
  "Add dark mode polish",
  "Empty-state illustrations",
  "Add keyboard shortcuts",
  "Improve error toasts",
  "Add file preview",
  "Profile page redesign",
  "SSO with Okta",
  "Add CSV import",
  "Add CSV export",
  "Rate-limit public API",
  "Audit npm dependencies",
  "Pagination on activity feed",
  "Bulk edit tasks",
  "Sticky table headers",
  "Avatar upload cropper",
  "Drag-and-drop reordering",
  "Add timezone settings",
  "Localization pass (FR)",
  "Localization pass (ES)",
  "Improve sprint burndown",
  "Project archive flow",
  "Restore deleted tasks",
  "Add webhook settings",
  "Slack integration",
  "MS Teams integration",
  "Add custom fields",
  "Improve search relevance",
  "Add task templates",
  "Markdown shortcuts in editor",
  "Add inline code styling",
  "Empty board CTA",
  "Add quick-add input",
  "Improve focus rings",
  "Audit accessibility (WCAG AA)",
  "Add tooltips to actions",
  "Performance: virtualize lists",
  "Reduce bundle size",
  "Lazy load charts",
  "Add reaction emojis",
  "Comment editing",
  "Comment threading",
  "Mention notifications",
  "Add @here mentions",
  "Improve mobile nav",
];
const labelPool = [
  ["Frontend"],
  ["Backend"],
  ["Frontend", "UI"],
  ["Backend", "Performance"],
  ["Documentation"],
  ["Bug"],
  ["Feature"],
  ["Security"],
];

for (let i = 11; i <= 65; i++) {
  const t = titlePool[(i - 11) % titlePool.length];
  const a = people[i % people.length];
  const r = people[(i + 2) % people.length];
  initialTasks.push({
    id: String(i),
    title: t,
    description: `<p>${t}.</p>`,
    status: statuses[i % statuses.length],
    priority: priorities[i % priorities.length],
    assignee: a,
    reporter: r,
    labels: labelPool[i % labelPool.length],
    sprint: `Sprint ${(i % 3) + 4}`,
    dueDate: `2024-12-${String((i % 27) + 1).padStart(2, "0")}`,
    comments: i % 6,
  });
}

initialTasks.slice(0, 10).forEach((t, idx) => {
  if (!t.sprint) t.sprint = `Sprint ${(idx % 3) + 4}`;
});

const ProjectBoard = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { pinnedProjects, pinProject, unpinProject, isProjectPinned } =
    useWorkspaceStore();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  // Filter states
  const [sprintFilter, setSprintFilter] = useState<string>("current");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [reporterFilter, setReporterFilter] = useState<string>("all");
  const [subGroupBy, setSubGroupBy] = useState<SubGroupBy>("none");

  if (!projectId || !projectNames[projectId]) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Project Not Found
          </h1>
          <p className="text-muted-foreground mt-2">
            The requested project could not be found.
          </p>
        </div>
      </div>
    );
  }

  const projectName = projectNames[projectId];
  const isPinned = isProjectPinned(projectId);

  const handleTogglePin = () => {
    if (isPinned) {
      unpinProject(projectId);
      toast({
        title: "Project unpinned",
        description: `${projectName} has been removed from your sidebar.`,
      });
    } else {
      pinProject({ id: projectId, name: projectName, color: "todo" });
      toast({
        title: "Project pinned",
        description: `${projectName} has been added to your sidebar.`,
      });
    }
  };

  const handleStatusChange = (taskId: string, newStatus: Task["status"]) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task,
      ),
    );
  };

  const uniqueAssignees = Array.from(
    new Set(tasks.map((t) => t.assignee?.name).filter(Boolean)),
  ) as string[];
  const uniqueReporters = Array.from(
    new Set(tasks.map((t) => t.reporter?.name).filter(Boolean)),
  ) as string[];

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;
    const matchesAssignee =
      assigneeFilter === "all" || task.assignee?.name === assigneeFilter;
    const matchesReporter =
      reporterFilter === "all" || task.reporter?.name === reporterFilter;

    return matchesPriority && matchesAssignee && matchesReporter;
  });

  const viewTabs = [
    { id: "kanban" as ViewMode, label: "Kanban", icon: LayoutGrid },
    { id: "table" as ViewMode, label: "Table", icon: Table2 },
    { id: "calendar" as ViewMode, label: "Calendar", icon: CalendarDays },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <div className="flex-shrink-0 bg-background border-b border-border px-6 pt-4 pb-3">
        {/* Project Header */}
        <div className="mb-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate">
              {projectName}
            </h1>
            <span className="text-sm text-muted-foreground">·</span>
            <span className="text-sm font-medium text-foreground">
              Sprint 5
            </span>
            <span className="text-sm text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">
              Ends Dec 30, 2024
            </span>
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
                <DropdownMenuItem
                  onClick={() => router.push(`/project/${projectId}/sprints`)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Sprints
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/backlog`)}>
                  <List className="w-4 h-4 mr-2" />
                  Backlog
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/epics`)}>
                  <List className="w-4 h-4 mr-2" />
                  Epics
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

        {/* Filters - Shared across all views */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* View Mode Tabs */}
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
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
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
              onClick={() => router.push("/tasks/new")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>
      </div>

      {/* View Content */}
      <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
        {viewMode === "kanban" && (
          <KanbanBoard
            projectId={projectId}
            projectName={projectName}
            externalTasks={filteredTasks}
            onTasksChange={setTasks}
            subGroupBy={subGroupBy}
          />
        )}
        {viewMode === "table" && (
          <ProjectTableView
            tasks={filteredTasks}
            onStatusChange={handleStatusChange}
            subGroupBy={subGroupBy}
          />
        )}
        {viewMode === "calendar" && (
          <ProjectCalendarView tasks={filteredTasks} />
        )}
      </div>
    </div>
  );
};

export default ProjectBoard;
