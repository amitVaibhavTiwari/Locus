"use client";
import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserStore } from "@/stores/userStore";
import { Badge } from "@/components/ui/badge";

import { Input } from "@/components/ui/input";
import { Flag, Calendar, Search } from "lucide-react";
import {
  NotesSection,
  NoteData,
  LinkData,
} from "@/components/dashboard/NotesSection";
import { ViewTaskDialog } from "@/components/dialogs/ViewTaskDialog";
import { Task } from "@/components/kanban/KanbanBoard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardOverviewProps {
  tasks: Task[];
  initialNotes: NoteData[];
  initialLinks: LinkData[];
  projects: string[];
}

function getGreeting(hour: number): { greeting: string; message: string } {
  if (hour >= 5 && hour < 12)
    return { greeting: "Good morning", message: "Let's make today count." };
  if (hour >= 12 && hour < 17)
    return { greeting: "Good afternoon", message: "Keep the momentum going." };
  if (hour >= 17 && hour < 21)
    return { greeting: "Good evening", message: "Hope your day went well." };
  if (hour >= 21)
    return { greeting: "Good night", message: "Time to wind down soon." };
  return { greeting: "Still at it?", message: "Remember to get some rest." };
}

export function DashboardOverview({
  tasks,
  initialNotes,
  initialLinks,
  projects,
}: DashboardOverviewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = useUserStore((s) => s.username) ?? "";
  const [, startTransition] = useTransition();

  const [now, setNow] = useState<Date | null>(null);
  const [displayedTasks, setDisplayedTasks] = useState(5);

  const currentQ = searchParams.get("q") ?? "";
  const currentProject = searchParams.get("project") ?? "all";
  const currentSort = searchParams.get("sort") ?? "deadline-asc";

  const [inputValue, setInputValue] = useState(currentQ);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setDisplayedTasks(5);
  }, [tasks]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const trimmed = inputValue.trim();
      if (trimmed === currentQ) return;
      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      startTransition(() => {
        router.replace(`?${params.toString()}`, { scroll: false });
      });
    }, 400);
    return () => clearTimeout(timeout);
  }, [inputValue]);

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (
      !value ||
      value === "all" ||
      value === "none" ||
      value === "deadline-asc"
    ) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false });
    });
  };

  const hour = now?.getHours() ?? 12;
  const { greeting, message } = getGreeting(hour);

  const dateStr = now?.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = now?.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

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

  const visibleTasks = tasks.slice(0, displayedTasks);
  const hasMoreTasks = tasks.length > displayedTasks;

  return (
    <div className="p-8 space-y-10">
      <div>
        <p className="text-sm text-muted-foreground mb-3">
          {now ? (
            `${dateStr} · ${timeStr}`
          ) : (
            <span className="invisible">placeholder</span>
          )}
        </p>
        <h1 className="text-4xl font-bold text-foreground tracking-tight">
          {greeting}, {username}!
        </h1>
        <p className="text-muted-foreground mt-2 text-base">{message}</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Your Tasks</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search tasks..."
                className="pl-10 h-9"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>

            <Select
              value={currentProject}
              onValueChange={(v) => setParam("project", v)}
            >
              <SelectTrigger className="w-40 h-9 shrink-0">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={currentSort}
              onValueChange={(v) => setParam("sort", v)}
            >
              <SelectTrigger className="w-44 h-9 shrink-0">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deadline-asc">Earliest deadline</SelectItem>
                <SelectItem value="deadline-desc">Latest deadline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleTasks.map((task) => (
              <ViewTaskDialog
                key={task.id}
                trigger={
                  <div className="p-4 bg-card border dark:border-none border-border rounded-lg hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col gap-2 h-full">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {task.project && (
                        <span className="font-medium truncate max-w-30">
                          {task.project}
                        </span>
                      )}
                      {task.project && (
                        <span className="text-border shrink-0">·</span>
                      )}
                      <span className="shrink-0">TASK-{task.issueNumber}</span>
                    </div>
                    <p className="font-medium text-foreground text-sm leading-snug line-clamp-2">
                      {task.title.length > 80
                        ? task.title.slice(0, 80) + "…"
                        : task.title}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                      <div className="flex gap-1 flex-wrap">
                        {task.labels &&
                          task.labels.slice(0, 2).map((label, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs py-0 max-w-20 truncate"
                            >
                              {label}
                            </Badge>
                          ))}
                        {task.labels && task.labels.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{task.labels.length - 2}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {task.storyPoints != null && (
                          <Badge
                            variant="secondary"
                            className="text-xs font-semibold"
                          >
                            {task.storyPoints} SP
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-xs ${getPriorityColor(task.priority)}`}
                        >
                          <Flag className="w-3 h-3 mr-1" />
                          {task.priority.charAt(0).toUpperCase() +
                            task.priority.slice(1)}
                        </Badge>
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
          </div>

          {hasMoreTasks && (
            <button
              className="w-full text-sm text-muted-foreground hover:underline cursor-pointer"
              onClick={() => setDisplayedTasks((prev) => prev + 5)}
            >
              Load more ({tasks.length - displayedTasks} remaining)
            </button>
          )}

          {visibleTasks.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-sm">No incomplete tasks found</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <NotesSection initialNotes={initialNotes} initialLinks={initialLinks} />
      </div>
    </div>
  );
}
