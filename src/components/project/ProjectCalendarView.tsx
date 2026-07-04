"use client";
import { useState, useEffect, useRef } from "react";
import { Task } from "@/components/kanban/KanbanBoard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ViewTaskDialog } from "@/components/dialogs/ViewTaskDialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectCalendarViewProps {
  projectId: string;
  activeSprintId: string | null;
  sprintFilter: string;
  priorityFilter: string;
  assigneeFilter: string;
  reporterFilter: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PRIORITY_STYLES: Record<string, string> = {
  highest: "border-l-destructive bg-destructive/10",
  high: "border-l-destructive bg-destructive/10",
  medium: "border-l-warning bg-warning/10",
  low: "border-l-success bg-success/10",
  none: "border-l-muted-foreground bg-muted/30",
};

export function ProjectCalendarView({
  projectId,
  activeSprintId,
  sprintFilter,
  priorityFilter,
  assigneeFilter,
  reporterFilter,
}: ProjectCalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setTasks([]);

    const p = new URLSearchParams({
      view: "calendar",
      year: String(year),
      month: String(month),
      sprintFilter,
    });
    if (sprintFilter === "current" && activeSprintId)
      p.set("activeSprintId", activeSprintId);
    if (priorityFilter !== "all") p.set("priority", priorityFilter);
    if (assigneeFilter !== "all") p.set("assigneeId", assigneeFilter);
    if (reporterFilter !== "all") p.set("reporterId", reporterFilter);

    fetch(`/api/projects/${projectId}/board?${p}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setTasks(data.tasks ?? []);
      })
      .catch(() => {
        if (!cancelled) setTasks([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    projectId,
    year,
    month,
    sprintFilter,
    activeSprintId,
    priorityFilter,
    assigneeFilter,
    reporterFilter,
  ]);

  const goToPrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const goToNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };
  const goToToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  };

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const leadingEmpty = Array.from({ length: firstDayOfWeek });

  const getTasksForDay = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return tasks.filter((t) => {
      if (!t.dueDate) return false;
      return t.dueDate.split("T")[0] === dateStr;
    });
  };

  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() + 1 &&
    year === today.getFullYear();

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 relative" ref={pickerRef}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goToPrevMonth}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <button
            onClick={() => {
              setPickerYear(year);
              setPickerOpen((o) => !o);
            }}
            className="px-3 py-1.5 rounded-md text-lg font-semibold text-foreground hover:bg-muted/50 transition-colors min-w-[160px] text-center"
          >
            {MONTH_NAMES[month - 1]} {year}
          </button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goToNextMonth}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {pickerOpen && (
            <div className="absolute top-full left-0 mt-2 z-50 bg-card border border-border rounded-xl shadow-lg p-4 w-64">
              <div className="flex items-center justify-between mb-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setPickerYear((y) => y - 1)}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <span className="font-semibold text-foreground">
                  {pickerYear}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setPickerYear((y) => y + 1)}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {SHORT_MONTH_NAMES.map((m, i) => {
                  const isSelected = i + 1 === month && pickerYear === year;
                  const isCurrent =
                    i + 1 === today.getMonth() + 1 &&
                    pickerYear === today.getFullYear();
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        setYear(pickerYear);
                        setMonth(i + 1);
                        setPickerOpen(false);
                      }}
                      className={cn(
                        "rounded-lg py-1.5 text-sm font-medium transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : isCurrent
                            ? "bg-primary/15 text-primary hover:bg-primary/25"
                            : "hover:bg-muted/60 text-foreground",
                      )}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {loading && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-l border-t border-border rounded-lg overflow-hidden">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold text-muted-foreground py-2.5 bg-muted/30 border-r border-b border-border"
          >
            {d}
          </div>
        ))}

        {leadingEmpty.map((_, i) => (
          <div
            key={`empty-${i}`}
            className="min-h-28 bg-muted/10 border-r border-b border-border"
          />
        ))}

        {days.map((day) => {
          const dayTasks = getTasksForDay(day);
          const overflow = dayTasks.length > 3 ? dayTasks.length - 3 : 0;
          const visibleTasks = dayTasks.slice(0, 3);
          const todayCell = isToday(day);

          return (
            <div
              key={day}
              className={cn(
                "min-h-28 p-2 border-r border-b border-border bg-card flex flex-col gap-1",
                todayCell && "bg-primary/5",
              )}
            >
              <div
                className={cn(
                  "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-0.5",
                  todayCell
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground",
                )}
              >
                {day}
              </div>

              {visibleTasks.map((task) => (
                <ViewTaskDialog
                  key={task.id}
                  issueId={task.id}
                  trigger={
                    <div
                      className={cn(
                        "px-1.5 py-1 text-[11px] cursor-pointer border-l-2 rounded-r-sm hover:opacity-80 transition-opacity",
                        PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.none,
                      )}
                    >
                      <div className="font-medium line-clamp-1 leading-tight">
                        {task.title}
                      </div>
                      {task.assignee && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Avatar className="w-3.5 h-3.5">
                            <AvatarFallback className="text-[8px]">
                              {task.assignee.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-muted-foreground truncate">
                            {task.assignee.name}
                          </span>
                        </div>
                      )}
                    </div>
                  }
                />
              ))}

              {overflow > 0 && (
                <span className="text-[11px] text-muted-foreground pl-1 mt-0.5">
                  +{overflow} more
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
