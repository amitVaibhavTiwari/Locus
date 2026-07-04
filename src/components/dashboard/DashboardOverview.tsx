"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flag, Calendar, Search } from "lucide-react";
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

interface DashboardOverviewProps {
  tasks: Task[];
  username: string;
}

export function DashboardOverview({ tasks, username }: DashboardOverviewProps) {
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [reporterFilter, setReporterFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("none");
  const [sortByDeadline, setSortByDeadline] = useState<string>("none");
  const [displayedTasks, setDisplayedTasks] = useState(5);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
      case "highest":
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
    let filtered = tasks;

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((t) => t.title.toLowerCase().includes(q));
    }

    if (projectFilter !== "all") {
      filtered = filtered.filter((t) => t.project === projectFilter);
    }

    if (reporterFilter !== "all") {
      filtered = filtered.filter((t) => t.reporter?.name === reporterFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    let sorted = [...filtered];

    if (sortBy === "priority-high") {
      const order: Record<string, number> = {
        highest: 0,
        high: 1,
        medium: 2,
        low: 3,
        none: 4,
      };
      sorted = sorted.sort(
        (a, b) => (order[a.priority] ?? 5) - (order[b.priority] ?? 5),
      );
    } else if (sortBy === "priority-low") {
      const order: Record<string, number> = {
        highest: 4,
        high: 3,
        medium: 2,
        low: 1,
        none: 0,
      };
      sorted = sorted.sort(
        (a, b) => (order[a.priority] ?? 5) - (order[b.priority] ?? 5),
      );
    }

    if (sortByDeadline === "deadline-asc") {
      sorted = sorted.sort(
        (a, b) =>
          new Date(a.dueDate || "9999").getTime() -
          new Date(b.dueDate || "9999").getTime(),
      );
    } else if (sortByDeadline === "deadline-desc") {
      sorted = sorted.sort(
        (a, b) =>
          new Date(b.dueDate || "0").getTime() -
          new Date(a.dueDate || "0").getTime(),
      );
    }

    return sorted;
  };

  const filteredTasks = getFilteredAndSortedTasks();
  const visibleTasks = filteredTasks.slice(0, displayedTasks);
  const hasMoreTasks = filteredTasks.length > displayedTasks;

  const taskCounts = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  const uniqueProjects = [
    ...new Set(tasks.map((t) => t.project).filter(Boolean)),
  ] as string[];
  const uniqueReporters = [
    ...new Set(tasks.map((t) => t.reporter?.name).filter(Boolean)),
  ] as string[];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {username}!
        </h1>
      </div>

      <div className="w-full">
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
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search tickets..."
                className="pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setDisplayedTasks(5);
                }}
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground">
                  Filters:
                </span>
                <Select
                  value={projectFilter}
                  onValueChange={(v) => {
                    setProjectFilter(v);
                    setDisplayedTasks(5);
                  }}
                >
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
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v);
                    setDisplayedTasks(5);
                  }}
                >
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
                  onValueChange={(v) => {
                    setReporterFilter(v);
                    setDisplayedTasks(5);
                  }}
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
                  issueId={task.id}
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
      <NotesSection />
    </div>
  );
}
