"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useToast } from "@/hooks/use-toast";
import { moveIssueToSprint } from "@/actions/sprints";

interface Issue {
  id: string;
  issue_number: number;
  title: string;
  status: string;
  priority: string;
  type: string;
  due_date: string | null;
  created_at: string;
  assignee: { id: string; username: string; avatar_url: string | null } | null;
  reporter: { id: string; username: string; avatar_url: string | null } | null;
}

interface Sprint {
  id: string;
  name: string;
  status: "planned" | "active" | "completed";
}

interface Project {
  id: string;
  name: string;
}

interface BacklogClientProps {
  projects: Project[];
  selectedProjectId: string | null;
  issues: Issue[];
  sprints: Sprint[];
}

function getInitials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const PRIORITY_DOT: Record<string, string> = {
  highest: "bg-destructive",
  high: "bg-destructive",
  medium: "bg-warning",
  low: "bg-success",
  none: "bg-muted-foreground",
};

export function BacklogClient({ projects, selectedProjectId, issues, sprints }: BacklogClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [reporterFilter, setReporterFilter] = useState("all");

  const uniqueAssignees = [...new Set(issues.map((i) => i.assignee?.username).filter(Boolean))] as string[];
  const uniqueReporters = [...new Set(issues.map((i) => i.reporter?.username).filter(Boolean))] as string[];

  const filtered = issues.filter((i) => {
    const ms = i.title.toLowerCase().includes(search.toLowerCase());
    const mp = priorityFilter === "all" || i.priority === priorityFilter;
    const ma = assigneeFilter === "all" || i.assignee?.username === assigneeFilter;
    const mr = reporterFilter === "all" || i.reporter?.username === reporterFilter;
    return ms && mp && ma && mr;
  });

  const handleMoveToSprint = (issueId: string, sprintId: string, sprintName: string) => {
    startTransition(async () => {
      const result = await moveIssueToSprint(issueId, sprintId);
      if (result?.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: `Moved to ${sprintName}` });
      router.refresh();
    });
  };

  const handleProjectChange = (id: string) => {
    router.push(`/backlog?projectId=${id}`);
  };

  return (
    <div className="w-full max-w-full p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Backlog</h1>
          <p className="text-muted-foreground">Issues not assigned to any sprint</p>
        </div>
        {projects.length > 1 && (
          <Select value={selectedProjectId ?? ""} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!selectedProjectId ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No projects found. Create a project first.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Search backlog..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="highest">Highest</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Assignee" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                <SelectItem value="none">Unassigned</SelectItem>
                {uniqueAssignees.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={reporterFilter} onValueChange={setReporterFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Reporter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reporters</SelectItem>
                {uniqueReporters.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg font-medium">Backlog is empty</p>
              <p className="text-sm mt-1">All issues are assigned to sprints, or no issues exist yet.</p>
            </div>
          ) : (
            <div className="rounded-md border border-border bg-card overflow-hidden">
              <div className="flex">
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
                      {filtered.map((issue) => (
                        <ViewTaskDialog
                          key={issue.id}
                          task={{
                            id: issue.id,
                            title: issue.title,
                            status: issue.status,
                            priority: issue.priority as "low" | "medium" | "high",
                            issueNumber: issue.issue_number,
                          }}
                          trigger={
                            <TableRow className="border-b border-border/60 last:border-0 hover:bg-muted/30 h-14 cursor-pointer transition-colors">
                              <TableCell className="h-14 py-0 px-5">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-sm font-medium text-foreground line-clamp-1">{issue.title}</span>
                                  <span className="text-[11px] text-muted-foreground font-mono">TASK-{issue.issue_number}</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          }
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border hover:bg-transparent">
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80 min-w-[110px] h-11 px-5">Priority</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80 min-w-[90px] h-11 px-5">Type</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80 min-w-[160px] h-11 px-5">Assignee</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80 min-w-[160px] h-11 px-5">Reporter</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80 min-w-[120px] h-11 px-5">Created</TableHead>
                        {sprints.length > 0 && (
                          <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80 min-w-[140px] h-11 px-5">Sprint</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((issue) => (
                        <TableRow key={issue.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30 h-14 transition-colors">
                          <TableCell className="h-14 py-0 px-5">
                            <div className="flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[issue.priority] ?? "bg-muted-foreground"}`} />
                              <span className="text-sm capitalize text-foreground">{issue.priority}</span>
                            </div>
                          </TableCell>
                          <TableCell className="h-14 py-0 px-5">
                            <Badge variant="outline" className="text-xs capitalize">{issue.type}</Badge>
                          </TableCell>
                          <TableCell className="h-14 py-0 px-5">
                            {issue.assignee ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                    {getInitials(issue.assignee.username)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-foreground">{issue.assignee.username}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm italic">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell className="h-14 py-0 px-5">
                            {issue.reporter ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                                    {getInitials(issue.reporter.username)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-foreground">{issue.reporter.username}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell className="h-14 py-0 px-5">
                            <span className="text-sm text-muted-foreground tabular-nums">
                              {format(new Date(issue.created_at), "MMM d, yyyy")}
                            </span>
                          </TableCell>
                          {sprints.length > 0 && (
                            <TableCell className="h-14 py-0 px-5">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-7 text-xs" disabled={isPending}>
                                    Add to sprint
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                  {sprints.map((s) => (
                                    <DropdownMenuItem
                                      key={s.id}
                                      onClick={() => handleMoveToSprint(issue.id, s.id, s.name)}
                                    >
                                      {s.name}
                                      {s.status === "active" && (
                                        <Badge variant="secondary" className="ml-2 text-[10px]">Active</Badge>
                                      )}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
