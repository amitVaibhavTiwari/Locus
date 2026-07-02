"use client";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";
import { Task } from "./KanbanBoard";
import { Badge } from "@/components/ui/badge";

interface Column {
  id: string;
  title: string;
}

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  hideHeaderCount?: boolean;
  droppableIdSuffix?: string;
  boardStatuses?: Array<{ key: string; name: string }>;
}

export function KanbanColumn({
  column,
  tasks,
  hideHeaderCount,
  droppableIdSuffix,
  boardStatuses,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: droppableIdSuffix ? `${column.id}::${droppableIdSuffix}` : column.id,
    data: { columnId: column.id },
  });

  return (
    <div className="w-[300px] flex-shrink-0">
      <div
        ref={setNodeRef}
        className={`flex flex-col bg-surface/50 rounded-lg border border-border ${
          isOver ? "border-primary bg-primary/5" : ""
        } transition-all duration-200`}
      >
        <div
          className="sticky top-0 z-10 bg-surface backdrop-blur-sm rounded-t-lg p-4 border-b border-border"
        >
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-foreground">{column.title}</h3>
            {!hideHeaderCount && (
              <Badge variant="secondary" className="text-xs">
                {tasks.length}
              </Badge>
            )}
          </div>
        </div>

        <div className="p-3 space-y-3">
          <SortableContext
            items={tasks.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} boardStatuses={boardStatuses} />
            ))}
          </SortableContext>

          {tasks.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No tasks</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
