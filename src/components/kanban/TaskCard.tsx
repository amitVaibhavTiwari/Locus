"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "./KanbanBoard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Flag } from "lucide-react";
import { ViewTaskDialog } from "@/components/dialogs/ViewTaskDialog";

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

export function TaskCard({ task, isDragging = false }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-destructive border-destructive";
      case "medium":
        return "text-warning border-warning";
      case "low":
        return "text-success border-success";
      default:
        return "text-muted-foreground border-muted-foreground";
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <ViewTaskDialog
      task={task}
      trigger={
        <Card
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className={`cursor-grab active:cursor-grabbing border-border shadow-custom-sm hover:shadow-custom-md transition-all duration-200 group ${
            isDragging || isSortableDragging
              ? "opacity-50 rotate-3 scale-105"
              : ""
          }`}
        >
          <CardContent className="p-3">
            {/* Header */}
            <div className="mb-2">
              <h4 className="font-semibold text-sm text-foreground line-clamp-2">
                {task.title}
              </h4>
            </div>

            {/* Labels */}
            {task.labels && task.labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {task.labels.map((label, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs px-2 py-0.5"
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Due Date */}
                {task.dueDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span
                      className={`text-xs ${
                        isOverdue
                          ? "text-destructive font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {new Date(task.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}

                {/* Priority */}
                <div className="flex items-center gap-1">
                  <Flag
                    className={`w-3 h-3 ${getPriorityColor(task.priority)}`}
                  />
                  <span
                    className={`text-xs font-medium capitalize ${getPriorityColor(task.priority)}`}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>

              {/* Assignee */}
              {task.assignee && (
                <Avatar className="w-6 h-6 flex-shrink-0">
                  <AvatarImage src={task.assignee.avatar} />
                  <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                    {task.assignee.initials}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </CardContent>
        </Card>
      }
    />
  );
}
