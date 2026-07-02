"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart3,
  Clock,
  Users,
  CheckCircle,
  Flag,
  Calendar,
  Search,
} from "lucide-react";
import { NotesSection } from "@/components/dashboard/NotesSection";
import { ViewTaskDialog } from "@/components/dialogs/ViewTaskDialog";
import { Task } from "@/components/kanban/KanbanBoard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";

const allUserTasks: Task[] = [
  {
    id: "1",
    title: "User Authentication System",
    description: "Implement secure login and registration functionality",
    status: "in-progress",
    priority: "high",
    assignee: { name: "Sarah Johnson", initials: "SJ" },
    reporter: { name: "Mike Harrison", initials: "MH" },
    project: "E-commerce Platform",
    labels: ["Backend", "Security"],
    dueDate: "2024-12-15",
    comments: 3,
  },
  {
    id: "2",
    title: "Dashboard UI Components",
    description: "Create reusable components for the admin dashboard",
    status: "todo",
    priority: "medium",
    assignee: { name: "Sarah Johnson", initials: "SJ" },
    reporter: { name: "Lisa Thompson", initials: "LT" },
    project: "Dashboard Analytics",
    labels: ["Frontend", "UI"],
    dueDate: "2024-12-20",
    comments: 5,
  },
  {
    id: "3",
    title: "API Documentation",
    description: "Document all REST API endpoints with examples",
    status: "qa",
    priority: "low",
    assignee: { name: "Sarah Johnson", initials: "SJ" },
    reporter: { name: "Robert Kim", initials: "RK" },
    project: "E-commerce Platform",
    labels: ["Documentation"],
    dueDate: "2024-12-18",
    comments: 1,
  },
  {
    id: "4",
    title: "Performance Optimization",
    description: "Optimize database queries and improve load times",
    status: "pending",
    priority: "high",
    assignee: { name: "Sarah Johnson", initials: "SJ" },
    reporter: { name: "Mike Harrison", initials: "MH" },
    project: "E-commerce Platform",
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
    assignee: { name: "Sarah Johnson", initials: "SJ" },
    reporter: { name: "Lisa Thompson", initials: "LT" },
    project: "Mobile App Redesign",
    labels: ["Frontend", "UX"],
    dueDate: "2024-12-08",
    comments: 4,
  },
  {
    id: "6",
    title: "Email Notification System",
    description: "Set up automated email notifications for key events",
    status: "todo",
    priority: "medium",
    assignee: { name: "Sarah Johnson", initials: "SJ" },
    reporter: { name: "Robert Kim", initials: "RK" },
    project: "Marketing Website",
    labels: ["Backend"],
    dueDate: "2024-12-22",
    comments: 0,
  },
  {
    id: "7",
    title: "Mobile Responsive Design",
    description: "Make the dashboard fully responsive for mobile devices",
    status: "in-progress",
    priority: "high",
    assignee: { name: "Sarah Johnson", initials: "SJ" },
    reporter: { name: "Mike Harrison", initials: "MH" },
    project: "Mobile App Redesign",
    labels: ["Frontend", "UI"],
    dueDate: "2024-12-16",
    comments: 7,
  },
  {
    id: "8",
    title: "Database Backup System",
    description: "Implement automated daily database backups",
    status: "todo",
    priority: "low",
    assignee: { name: "Sarah Johnson", initials: "SJ" },
    reporter: { name: "Lisa Thompson", initials: "LT" },
    project: "E-commerce Platform",
    labels: ["Backend", "DevOps"],
    dueDate: "2024-12-25",
    comments: 1,
  },
];

export function DashboardOverview() {
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [reporterFilter, setReporterFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("none");
  const [sortByDeadline, setSortByDeadline] = useState<string>("none");
  const [displayedTasks, setDisplayedTasks] = useState(5);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-destructive text-destructive";
      case "medium":
        return "border-warning text-warning";
      case "low":
        return "border-success text-success";
      default:
        return "border-muted-foreground text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-todo/10 text-todo border-todo";
      case "in-progress":
        return "bg-in-progress/10 text-in-progress border-in-progress";
      case "qa":
        return "bg-qa/10 text-qa border-qa";
      case "pending":
        return "bg-pending/10 text-pending border-pending";
      case "done":
        return "bg-done/10 text-done border-done";
      default:
        return "bg-muted text-muted-foreground border-muted";
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "in-progress":
        return "In Progress";
      case "qa":
        return "QA Review";
      case "pending":
        return "Pending";
      case "done":
        return "Done";
      case "todo":
        return "To Do";
      default:
        return status;
    }
  };

  const getFilteredAndSortedTasks = () => {
    let filtered = allUserTasks;

    if (projectFilter !== "all") {
      filtered = filtered.filter((task) => task.project === projectFilter);
    }

    if (reporterFilter !== "all") {
      filtered = filtered.filter(
        (task) => task.reporter?.name === reporterFilter,
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    // Sort tasks
    let sorted = [...filtered];

    // Priority sorting
    if (sortBy === "priority-high") {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      sorted = sorted.sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
      );
    } else if (sortBy === "priority-low") {
      const priorityOrder = { high: 2, medium: 1, low: 0 };
      sorted = sorted.sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
      );
    }

    // Deadline sorting
    if (sortByDeadline === "deadline-asc") {
      sorted = sorted.sort(
        (a, b) =>
          new Date(a.dueDate || "").getTime() -
          new Date(b.dueDate || "").getTime(),
      );
    } else if (sortByDeadline === "deadline-desc") {
      sorted = sorted.sort(
        (a, b) =>
          new Date(b.dueDate || "").getTime() -
          new Date(a.dueDate || "").getTime(),
      );
    }

    return sorted;
  };

  const filteredTasks = getFilteredAndSortedTasks();
  const visibleTasks = filteredTasks.slice(0, displayedTasks);
  const hasMoreTasks = filteredTasks.length > displayedTasks;

  const taskCounts = {
    total: allUserTasks.length,
    todo: allUserTasks.filter((t) => t.status === "todo").length,
    inProgress: allUserTasks.filter((t) => t.status === "in-progress").length,
    qa: allUserTasks.filter((t) => t.status === "qa").length,
    pending: allUserTasks.filter((t) => t.status === "pending").length,
    done: allUserTasks.filter((t) => t.status === "done").length,
  };

  const uniqueProjects = Array.from(
    new Set(allUserTasks.map((t) => t.project).filter(Boolean)),
  ) as string[];
  const uniqueReporters = Array.from(
    new Set(allUserTasks.map((t) => t.reporter?.name).filter(Boolean)),
  ) as string[];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, Sarah!
        </h1>
      </div>

      <div className="w-full">
        {/* Your Work */}
        <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-4 border-b border-border/60">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4 flex-wrap">
                <CardTitle className="text-xl font-semibold tracking-tight">
                  Your Work
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs font-medium text-foreground">
                    Total{" "}
                    <span className="font-semibold">{taskCounts.total}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-todo/10 text-xs font-medium text-todo">
                    To Do{" "}
                    <span className="font-semibold">{taskCounts.todo}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-in-progress/10 text-xs font-medium text-in-progress">
                    In Progress{" "}
                    <span className="font-semibold">
                      {taskCounts.inProgress}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-done/10 text-xs font-medium text-done">
                    Done{" "}
                    <span className="font-semibold">{taskCounts.done}</span>
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {/* Search Bar */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Search tickets..." className="pl-10" />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground">
                  Filters:
                </span>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {uniqueProjects.map((project) => (
                      <SelectItem key={project} value={project}>
                        {project}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="qa">QA Review</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
                <SearchableSelect
                  value={reporterFilter}
                  onValueChange={setReporterFilter}
                  placeholder="Reporter"
                  searchPlaceholder="Search reporters..."
                  triggerClassName="w-40"
                  options={[
                    { value: "all", label: "All Reporters" },
                    ...uniqueReporters.map((r) => ({ value: r, label: r })),
                  ]}
                />
              </div>

              <div className="h-6 w-px bg-border" />

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground">
                  Sort by:
                </span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-44 border-primary/30">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Priority (None)</SelectItem>
                    <SelectItem value="priority-high">
                      High Priority First
                    </SelectItem>
                    <SelectItem value="priority-low">
                      Low Priority First
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={sortByDeadline}
                  onValueChange={setSortByDeadline}
                >
                  <SelectTrigger className="w-44 border-primary/30">
                    <SelectValue placeholder="Deadline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Deadline (None)</SelectItem>
                    <SelectItem value="deadline-asc">
                      Earliest Deadline
                    </SelectItem>
                    <SelectItem value="deadline-desc">
                      Latest Deadline
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              {visibleTasks.map((task) => (
                <ViewTaskDialog
                  key={task.id}
                  trigger={
                    <div className="p-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground mb-2">
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={getStatusColor(task.status)}
                            >
                              {formatStatus(task.status)}
                            </Badge>
                            {task.labels && task.labels.length > 0 && (
                              <div className="flex gap-1">
                                {task.labels.slice(0, 2).map((label, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {label}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className={getPriorityColor(task.priority)}
                          >
                            <Flag className="w-3 h-3 mr-1" />
                            {task.priority.charAt(0).toUpperCase() +
                              task.priority.slice(1)}
                          </Badge>
                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  }
                  task={task}
                />
              ))}
              {hasMoreTasks && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setDisplayedTasks((prev) => prev + 5)}
                >
                  Load More ({filteredTasks.length - displayedTasks} remaining)
                </Button>
              )}
              {visibleTasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No tickets found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes and Links Section */}
      <NotesSection />
    </div>
  );
}
