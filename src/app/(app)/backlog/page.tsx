"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ViewTaskDialog } from "@/components/dialogs/ViewTaskDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

interface BacklogItem {
  id: number;
  title: string;
  type: string;
  priority: string;
  points: number;
  epic: string;
  assignee: string | null;
  reporter: string;
  labels: string[];
  createdOn: string;
}

export default function Backlog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [reporterFilter, setReporterFilter] = useState("all");

  const backlogItems: BacklogItem[] = [
    {
      id: 1,
      title: "Implement OAuth 2.0 integration",
      type: "story",
      priority: "high",
      points: 8,
      epic: "User Authentication System",
      assignee: "John Doe",
      reporter: "Sarah Wilson",
      labels: ["backend", "security"],
      createdOn: "2024-12-01",
    },
    {
      id: 2,
      title: "Design payment confirmation UI",
      type: "story",
      priority: "medium",
      points: 5,
      epic: "Payment Processing",
      assignee: "Jane Smith",
      reporter: "Mike Johnson",
      labels: ["frontend", "ui"],
      createdOn: "2024-12-03",
    },
    {
      id: 3,
      title: "Fix responsive layout on tablet",
      type: "bug",
      priority: "low",
      points: 3,
      epic: "Mobile Responsiveness",
      assignee: null,
      reporter: "Jane Smith",
      labels: ["frontend", "css"],
      createdOn: "2024-12-05",
    },
    {
      id: 4,
      title: "Add unit tests for auth service",
      type: "task",
      priority: "medium",
      points: 2,
      epic: "User Authentication System",
      assignee: "Sarah Wilson",
      reporter: "John Doe",
      labels: ["testing", "backend"],
      createdOn: "2024-12-07",
    },
    {
      id: 5,
      title: "API rate limiting implementation",
      type: "task",
      priority: "high",
      points: 5,
      epic: "Performance Optimization",
      assignee: null,
      reporter: "Sarah Wilson",
      labels: ["backend", "security"],
      createdOn: "2024-12-08",
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const uniqueAssignees = Array.from(
    new Set(backlogItems.map((item) => item.assignee).filter(Boolean)),
  ) as string[];
  const uniqueReporters = Array.from(
    new Set(backlogItems.map((item) => item.reporter).filter(Boolean)),
  ) as string[];

  const filteredItems = backlogItems.filter((item) => {
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesPriority =
      priorityFilter === "all" || item.priority === priorityFilter;
    const matchesAssignee =
      assigneeFilter === "all" ||
      (assigneeFilter === "none" && !item.assignee) ||
      item.assignee === assigneeFilter;
    const matchesReporter =
      reporterFilter === "all" || item.reporter === reporterFilter;

    return (
      matchesSearch && matchesPriority && matchesAssignee && matchesReporter
    );
  });

  return (
    <div className="w-full max-w-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Backlog</h1>
          <p className="text-muted-foreground">
            Manage your product backlog items
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search backlog items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            <SelectItem value="none">Unassigned</SelectItem>
            {uniqueAssignees.map((assignee) => (
              <SelectItem key={assignee} value={assignee}>
                {assignee}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={reporterFilter} onValueChange={setReporterFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Reporter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reporters</SelectItem>
            {uniqueReporters.map((reporter) => (
              <SelectItem key={reporter} value={reporter}>
                {reporter}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table View */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="flex">
          {/* Fixed Title Column */}
          <div className="min-w-[320px] max-w-[320px] border-r border-border bg-card z-10">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80 h-11 px-5">
                    Title
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <ViewTaskDialog
                    key={item.id}
                    task={{ id: `TASK-${item.id}`, title: item.title }}
                    trigger={
                      <TableRow className="border-b border-border/60 last:border-0 hover:bg-muted/30 h-14 cursor-pointer transition-colors">
                        <TableCell className="h-14 py-0 px-5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium text-foreground line-clamp-1">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              TASK-{item.id}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Scrollable Columns */}
          <div className="flex-1 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80 min-w-[110px] h-11 px-5">
                    Priority
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80 min-w-[160px] h-11 px-5">
                    Assignee
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80 min-w-[160px] h-11 px-5">
                    Reporter
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80 min-w-[180px] h-11 px-5">
                    Epic
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80 min-w-[120px] h-11 px-5">
                    Created
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <ViewTaskDialog
                    key={item.id}
                    task={{ id: `TASK-${item.id}`, title: item.title }}
                    trigger={
                      <TableRow className="border-b border-border/60 last:border-0 hover:bg-muted/30 h-14 cursor-pointer transition-colors">
                        <TableCell className="h-14 py-0 px-5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${item.priority === "high" ? "bg-destructive" : item.priority === "medium" ? "bg-warning" : "bg-success"}`}
                            />
                            <span className="text-sm capitalize text-foreground">
                              {item.priority}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="h-14 py-0 px-5">
                          {item.assignee ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                  {getInitials(item.assignee)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-foreground">
                                {item.assignee}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm italic">
                              Unassigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="h-14 py-0 px-5">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                                {getInitials(item.reporter)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-foreground">
                              {item.reporter}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="h-14 py-0 px-5">
                          <span className="text-sm text-muted-foreground">
                            {item.epic}
                          </span>
                        </TableCell>
                        <TableCell className="h-14 py-0 px-5">
                          <span className="text-sm text-muted-foreground tabular-nums">
                            {format(new Date(item.createdOn), "MMM d, yyyy")}
                          </span>
                        </TableCell>
                      </TableRow>
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
