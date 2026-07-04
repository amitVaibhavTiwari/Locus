"use client";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";
import { Task } from "./KanbanBoard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Column {
  id: string;
  title: string;
}

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  hasMore?: boolean;
  loading?: boolean;
  hideHeaderCount?: boolean;
  droppableIdSuffix?: string;
}

function TaskCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3.5 w-4/5" />
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="ml-auto h-3 w-10" />
      </div>
    </div>
  );
}

export function KanbanColumn({
  column,
  tasks,
  hasMore,
  loading,
  hideHeaderCount,
  droppableIdSuffix,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: droppableIdSuffix ? `${column.id}::${droppableIdSuffix}` : column.id,
    data: { columnId: column.id },
  });

  return (
    <div className="w-75 shrink-0">
      <div
        ref={setNodeRef}
        className={`flex flex-col bg-surface/50 rounded-lg border border-border ${
          isOver ? "border-primary bg-primary/5" : ""
        } transition-all duration-200`}
      >
        <div className="sticky top-0 z-10 bg-surface backdrop-blur-sm rounded-t-lg p-4 border-b border-border">
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
              <TaskCard key={task.id} task={task} />
            ))}
          </SortableContext>

          {loading && tasks.length === 0 && (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <TaskCardSkeleton key={i} />
              ))}
            </>
          )}

          {loading && tasks.length > 0 && <TaskCardSkeleton />}

          {!loading && tasks.length === 0 && !hasMore && (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No tasks</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
