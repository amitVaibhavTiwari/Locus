"use client";
import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { groupTasks } from "@/lib/subGroup";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "qa" | "pending" | "done";
  priority: "low" | "medium" | "high";
  assignee?: {
    name: string;
    avatar?: string;
    initials: string;
  };
  reporter?: {
    name: string;
    initials: string;
  };
  project?: string;
  labels?: string[];
  sprint?: string;
  dueDate?: string;
  comments?: number;
  attachments?: number;
}

const columns = [
  { id: "todo", title: "To Do", color: "todo" },
  { id: "in-progress", title: "In Progress", color: "in-progress" },
  { id: "qa", title: "QA Review", color: "qa" },
  { id: "pending", title: "Pending Deployment", color: "pending" },
  { id: "done", title: "Done", color: "done" },
] as const;

interface KanbanBoardProps {
  projectId: string;
  projectName: string;
  externalTasks?: Task[];
  onTasksChange?: (tasks: Task[]) => void;
  subGroupBy?: import("@/lib/subGroup").SubGroupBy;
}

export function KanbanBoard({
  externalTasks,
  onTasksChange,
  subGroupBy = "none",
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const tasks = externalTasks || [];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((task) => task.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !onTasksChange) return;

    const activeTask = tasks.find((task) => task.id === active.id);
    if (!activeTask) return;

    // Determine the new status - check if 'over' is a column or a task
    let newStatus: Task["status"];
    const overTask = tasks.find((task) => task.id === over.id);

    if (overTask) {
      // Dropped on a task, use that task's status
      newStatus = overTask.status;
    } else {
      // Dropped on a column (id may be "status::groupKey")
      const raw = String(over.id);
      newStatus = (
        raw.includes("::") ? raw.split("::")[0] : raw
      ) as Task["status"];
    }

    // Handling reordering within same column or moving to different column
    if (
      activeTask.status === newStatus &&
      overTask &&
      overTask.id !== activeTask.id
    ) {
      // Reordering within the same column
      const tasksInColumn = tasks.filter((t) => t.status === newStatus);
      const otherTasks = tasks.filter((t) => t.status !== newStatus);

      const oldIndex = tasksInColumn.findIndex((t) => t.id === activeTask.id);
      const newIndex = tasksInColumn.findIndex((t) => t.id === overTask.id);

      const reorderedTasks = arrayMove(tasksInColumn, oldIndex, newIndex);

      onTasksChange([...otherTasks, ...reorderedTasks]);
    } else if (activeTask.status !== newStatus) {
      // Moving to a different column
      const updatedTasks = tasks.map((task) =>
        task.id === activeTask.id ? { ...task, status: newStatus } : task,
      );

      // If dropped on a task, insert at that position
      if (overTask && overTask.id !== activeTask.id) {
        const tasksInNewStatus = updatedTasks.filter(
          (t) => t.status === newStatus,
        );
        const otherTasks = updatedTasks.filter((t) => t.status !== newStatus);

        const activeIndex = tasksInNewStatus.findIndex(
          (t) => t.id === activeTask.id,
        );
        const overIndex = tasksInNewStatus.findIndex(
          (t) => t.id === overTask.id,
        );

        const reordered = arrayMove(tasksInNewStatus, activeIndex, overIndex);

        onTasksChange([...otherTasks, ...reordered]);
      } else {
        onTasksChange(updatedTasks);
      }
    }
  };

  const getTasksByStatus = (status: Task["status"]) => {
    return tasks.filter((task) => task.status === status);
  };

  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const toggleGroup = (k: string) =>
    setCollapsedGroups((s) => ({ ...s, [k]: !s[k] }));

  const groups = groupTasks(tasks, subGroupBy);
  const isGrouped = subGroupBy !== "none";

  return (
    <div className="pt-6">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {!isGrouped ? (
          <div className="flex gap-6 pb-2 min-w-max items-start">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={getTasksByStatus(column.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-6 pb-6 min-w-max">
            {groups.map((g) => {
              const collapsed = !!collapsedGroups[g.key];
              return (
                <div
                  key={g.key}
                  className="rounded-lg border border-border bg-surface/30 w-max"
                >
                  {/* Group Header Row */}
                  <button
                    onClick={() => toggleGroup(g.key)}
                    className="w-full flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    {collapsed ? (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                    {g.initials && (
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-[11px] bg-primary/15 text-primary">
                          {g.initials}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <span className="font-semibold text-foreground">
                      {g.label}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {g.tasks.length}
                    </Badge>
                  </button>

                  {/* Columns for this group */}
                  {!collapsed && (
                    <div className="flex gap-6 p-3 min-w-max">
                      {columns.map((column) => (
                        <KanbanColumn
                          key={column.id}
                          column={column}
                          tasks={g.tasks.filter((t) => t.status === column.id)}
                          hideHeaderCount={false}
                          droppableIdSuffix={g.key}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
