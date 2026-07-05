"use client";
import { useEffect, useRef } from "react";
import { Task } from "@/components/kanban/KanbanBoard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ViewTaskDialog } from "@/components/dialogs/ViewTaskDialog";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_STATUSES = [
  { key: "todo", name: "To Do" },
  { key: "in-progress", name: "In Progress" },
  { key: "qa", name: "QA Review" },
  { key: "pending", name: "Pending" },
  { key: "done", name: "Done" },
];

interface ProjectTableViewProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: Task["status"]) => void;
  boardStatuses?: Array<{ key: string; name: string }>;
  hasMore?: boolean;
  isLoading?: boolean;
  onLoadMore?: () => void;
  scrollRoot?: React.RefObject<HTMLDivElement | null>;
}

const getPriorityBorderColor = (priority: string) => {
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

export function ProjectTableView({
  tasks,
  onStatusChange,
  boardStatuses,
  hasMore,
  isLoading,
  onLoadMore,
  scrollRoot,
}: ProjectTableViewProps) {
  const statuses =
    boardStatuses && boardStatuses.length > 0
      ? boardStatuses
      : DEFAULT_STATUSES;

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          onLoadMore?.();
        }
      },
      {
        root: scrollRoot?.current ?? null,
        rootMargin: "120px",
      },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore, scrollRoot]);

  return (
    <div className="rounded-lg overflow-hidden bg-card dark:bg-[hsl(var(--card)/0.6)]">
      <div className="flex">
        <div className="min-w-75 max-w-75 border-r bg-card dark:bg-[hsl(var(--card)/0.7)] z-10 shadow-[2px_0_8px_-2px_rgba(0,0,0,0.1)]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 dark:bg-muted/40 h-12">
                <TableHead className="font-semibold text-foreground h-12">
                  Task Title
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <ViewTaskDialog
                  key={task.id}
                  issueId={task.id}
                  trigger={
                    <TableRow className="hover:bg-muted/30 dark:hover:bg-muted/20 h-14 cursor-pointer">
                      <TableCell className="font-medium h-14 py-0">
                        <span className="line-clamp-2">{task.title}</span>
                      </TableCell>
                    </TableRow>
                  }
                />
              ))}
              {isLoading &&
                tasks.length === 0 &&
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={`sk-left-${i}`} className="h-14">
                    <TableCell className="h-14 py-0">
                      <Skeleton className="h-4 w-4/5" />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex-1 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 dark:bg-muted/40 h-12">
                <TableHead className="font-semibold text-foreground min-w-35 h-12">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-foreground min-w-25 h-12">
                  Priority
                </TableHead>
                <TableHead className="font-semibold text-foreground min-w-37.5 h-12">
                  Assignee
                </TableHead>
                <TableHead className="font-semibold text-foreground min-w-37.5 h-12">
                  Reporter
                </TableHead>
                <TableHead className="font-semibold text-foreground min-w-30 h-12">
                  Due Date
                </TableHead>
                <TableHead className="font-semibold text-foreground min-w-30 h-12">
                  Created On
                </TableHead>
                <TableHead className="font-semibold text-foreground min-w-50 h-12">
                  Tags
                </TableHead>
                <TableHead className="font-semibold text-foreground min-w-37.5 h-12">
                  Epic
                </TableHead>
                <TableHead className="font-semibold text-foreground min-w-20 h-12">
                  SP
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <ViewTaskDialog
                  key={task.id}
                  issueId={task.id}
                  trigger={
                    <TableRow className="hover:bg-muted/30 dark:hover:bg-muted/20 h-14 cursor-pointer">
                      <TableCell
                        className="h-14 py-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Select
                          value={task.status}
                          onValueChange={(value) =>
                            onStatusChange(task.id, value as Task["status"])
                          }
                        >
                          <SelectTrigger className="w-32.5 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((s) => (
                              <SelectItem key={s.key} value={s.key}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className="h-14 py-0">
                        <Badge
                          variant="outline"
                          className={`${getPriorityBorderColor(task.priority)} capitalize bg-transparent`}
                        >
                          {task.priority}
                        </Badge>
                      </TableCell>

                      <TableCell className="h-14 py-0">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs bg-primary/20 text-primary">
                                {task.assignee.initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-foreground">
                              {task.assignee.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Unassigned
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="h-14 py-0">
                        {task.reporter ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                                {task.reporter.initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-foreground">
                              {task.reporter.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            &mdash;
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="h-14 py-0">
                        {task.dueDate ? (
                          <span className="text-sm text-foreground">
                            {format(new Date(task.dueDate), "MMM d, yyyy")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            &mdash;
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="h-14 py-0">
                        <span className="text-sm text-muted-foreground">
                          {task.createdAt
                            ? format(new Date(task.createdAt), "MMM d, yyyy")
                            : "—"}
                        </span>
                      </TableCell>

                      <TableCell className="h-14 py-0">
                        <div className="flex flex-wrap gap-1">
                          {task.labels?.map((label) => (
                            <Badge
                              key={label}
                              variant="secondary"
                              className="text-xs"
                            >
                              {label}
                            </Badge>
                          ))}
                          {!task.labels?.length && (
                            <span className="text-muted-foreground text-sm">
                              &mdash;
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="h-14 py-0">
                        {task.epicName ? (
                          <span className="text-sm font-semibold">
                            {task.epicName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            &mdash;
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="h-14 py-0">
                        {task.storyPoints != null ? (
                          <Badge variant="secondary" className="text-xs font-semibold">
                            {task.storyPoints} SP
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">&mdash;</span>
                        )}
                      </TableCell>
                    </TableRow>
                  }
                />
              ))}
              {isLoading &&
                tasks.length === 0 &&
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={`sk-right-${i}`} className="h-14">
                    <TableCell className="h-14 py-0">
                      <Skeleton className="h-8 w-32" />
                    </TableCell>
                    <TableCell className="h-14 py-0">
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </TableCell>
                    <TableCell className="h-14 py-0">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </TableCell>
                    <TableCell className="h-14 py-0">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </TableCell>
                    <TableCell className="h-14 py-0">
                      <Skeleton className="h-3 w-20" />
                    </TableCell>
                    <TableCell className="h-14 py-0">
                      <Skeleton className="h-3 w-20" />
                    </TableCell>
                    <TableCell className="h-14 py-0">
                      <Skeleton className="h-5 w-12 rounded-full" />
                    </TableCell>
                    <TableCell className="h-14 py-0">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell className="h-14 py-0">
                      <Skeleton className="h-5 w-10 rounded-full" />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {isLoading && tasks.length > 0 && (
        <div className="flex justify-center py-4 border-t border-border">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      )}
      {hasMore && <div ref={sentinelRef} className="h-1" />}
    </div>
  );
}
