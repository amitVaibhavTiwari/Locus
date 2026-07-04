"use client";
import React, { useEffect, useRef } from "react";
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
import { SubGroupBy, groupTasks, subGroupLabels } from "@/lib/subGroup";
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
  subGroupBy?: SubGroupBy;
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
  subGroupBy = "none",
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

  const groups = groupTasks(tasks, subGroupBy);
  const grouped = subGroupBy !== "none";

  type Row =
    | {
        kind: "group";
        key: string;
        label: string;
        initials?: string;
        count: number;
      }
    | { kind: "task"; task: Task };

  const rows: Row[] = [];
  if (grouped) {
    groups.forEach((g) => {
      rows.push({
        kind: "group",
        key: g.key,
        label: g.label,
        initials: g.initials,
        count: g.tasks.length,
      });
      g.tasks.forEach((t) => rows.push({ kind: "task", task: t }));
    });
  } else {
    tasks.forEach((t) => rows.push({ kind: "task", task: t }));
  }

  const titleGroupRow = (
    label: string,
    initials: string | undefined,
    count: number,
  ) => (
    <TableRow className="bg-muted/40 hover:bg-muted/40 h-10">
      <TableCell className="h-10 py-0">
        <div className="flex items-center gap-2">
          {initials && (
            <Avatar className="w-5 h-5">
              <AvatarFallback className="text-[10px] bg-primary/15 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          )}
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
            {count}
          </Badge>
        </div>
      </TableCell>
    </TableRow>
  );

  const sideGroupRow = (count: number) => (
    <TableRow className="bg-muted/40 hover:bg-muted/40 h-10">
      <TableCell
        colSpan={8}
        className="h-10 py-0 text-xs text-muted-foreground"
      >
        {subGroupLabels[subGroupBy]} group &middot; {count} tasks
      </TableCell>
    </TableRow>
  );

  return (
    <div className="rounded-lg overflow-hidden bg-card dark:bg-[hsl(var(--card)/0.6)]">
      {grouped && (
        <div className="px-4 py-2 border-b border-border bg-muted/30 text-xs text-muted-foreground">
          Sub-grouped by{" "}
          <span className="font-medium text-foreground">
            {subGroupLabels[subGroupBy]}
          </span>
        </div>
      )}
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
              {rows.map((row, i) =>
                row.kind === "group" ? (
                  <React.Fragment key={`g-${row.key}-${i}`}>
                    {titleGroupRow(row.label, row.initials, row.count)}
                  </React.Fragment>
                ) : (
                  <ViewTaskDialog
                    key={row.task.id}
                    issueId={row.task.id}
                    trigger={
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-muted/20 h-14 cursor-pointer">
                        <TableCell className="font-medium h-14 py-0">
                          <span className="line-clamp-2">{row.task.title}</span>
                        </TableCell>
                      </TableRow>
                    }
                  />
                ),
              )}
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) =>
                row.kind === "group" ? (
                  <React.Fragment key={`g-${row.key}-${i}`}>
                    {sideGroupRow(row.count)}
                  </React.Fragment>
                ) : (
                  <ViewTaskDialog
                    key={row.task.id}
                    issueId={row.task.id}
                    trigger={
                      <TableRow className="hover:bg-muted/30 dark:hover:bg-muted/20 h-14 cursor-pointer">
                        <TableCell
                          className="h-14 py-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Select
                            value={row.task.status}
                            onValueChange={(value) =>
                              onStatusChange(
                                row.task.id,
                                value as Task["status"],
                              )
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
                            className={`${getPriorityBorderColor(row.task.priority)} capitalize bg-transparent`}
                          >
                            {row.task.priority}
                          </Badge>
                        </TableCell>

                        <TableCell className="h-14 py-0">
                          {row.task.assignee ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs bg-primary/20 text-primary">
                                  {row.task.assignee.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-foreground">
                                {row.task.assignee.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              Unassigned
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="h-14 py-0">
                          {row.task.reporter ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                                  {row.task.reporter.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-foreground">
                                {row.task.reporter.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              &mdash;
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="h-14 py-0">
                          {row.task.dueDate ? (
                            <span className="text-sm text-foreground">
                              {format(
                                new Date(row.task.dueDate),
                                "MMM d, yyyy",
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              &mdash;
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="h-14 py-0">
                          <span className="text-sm text-muted-foreground">
                            {row.task.createdAt
                              ? format(
                                  new Date(row.task.createdAt),
                                  "MMM d, yyyy",
                                )
                              : "—"}
                          </span>
                        </TableCell>

                        <TableCell className="h-14 py-0">
                          <div className="flex flex-wrap gap-1">
                            {row.task.labels?.map((label) => (
                              <Badge
                                key={label}
                                variant="secondary"
                                className="text-xs"
                              >
                                {label}
                              </Badge>
                            ))}
                            {!row.task.labels?.length && (
                              <span className="text-muted-foreground text-sm">
                                &mdash;
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="h-14 py-0">
                          {row.task.epicName ? (
                            <Badge
                              variant="outline"
                              className="text-xs bg-primary/5 border-primary/30 text-primary"
                            >
                              {row.task.epicName}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              &mdash;
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    }
                  />
                ),
              )}
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
