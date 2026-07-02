"use client";
import { useState } from "react";
import { Task } from "@/components/kanban/KanbanBoard";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ViewTaskDialog } from "@/components/dialogs/ViewTaskDialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectCalendarViewProps {
  tasks: Task[];
  boardStatuses?: Array<{ key: string; name: string }>;
}

export function ProjectCalendarView({ tasks, boardStatuses }: ProjectCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  ).getDay();

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getTasksForDate = (day: number) => {
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
    )
      .toISOString()
      .split("T")[0];

    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate).toISOString().split("T")[0];
      return taskDate === dateStr;
    });
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive/20 border-destructive";
      case "medium":
        return "bg-warning/20 border-warning";
      case "low":
        return "bg-success/20 border-success";
      default:
        return "bg-muted border-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">{monthName}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}

        {/* Empty cells for days before month starts */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="min-h-[120px]" />
        ))}

        {/* Calendar days */}
        {days.map((day) => {
          const dayTasks = getTasksForDate(day);
          const isToday =
            day === new Date().getDate() &&
            currentDate.getMonth() === new Date().getMonth() &&
            currentDate.getFullYear() === new Date().getFullYear();

          return (
            <Card
              key={day}
              className={`min-h-[120px] p-2 ${
                isToday ? "border-primary border-2" : ""
              }`}
            >
              <div className="text-sm font-medium text-foreground mb-2">
                {day}
              </div>
              <div className="space-y-1">
                {dayTasks.map((task) => (
                  <ViewTaskDialog
                    key={task.id}
                    task={task}
                    boardStatuses={boardStatuses}
                    trigger={
                      <div
                        className={`px-2 py-1 text-xs cursor-pointer border-l-2 ${getPriorityColor(
                          task.priority,
                        )} hover:opacity-80 transition-opacity`}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <div className="font-medium line-clamp-1">
                            {task.title}
                          </div>
                        </div>
                        {task.assignee && (
                          <div className="flex items-center gap-1">
                            <Avatar className="w-4 h-4">
                              <AvatarFallback className="text-[8px]">
                                {task.assignee.initials}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                      </div>
                    }
                  />
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
