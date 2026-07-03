"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Square, CheckCircle2, Clock, Plus, Minus, ListChecks,
  TrendingUp, TrendingDown, Search,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ViewTaskDialog } from "@/components/dialogs/ViewTaskDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { startSprint, completeSprint } from "@/actions/sprints";

interface Issue {
  id: string;
  issue_number: number;
  title: string;
  status: string;
  priority: string;
  completed_at: string | null;
  assignee: { id: string; username: string; avatar_url: string | null } | null;
}

interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  status: "planned" | "active" | "completed";
  start_date: string | null;
  end_date: string | null;
}

interface SprintDetailClientProps {
  projectId: string;
  projectName: string;
  sprint: Sprint;
  issues: Issue[];
  hasNextSprint: boolean;
}

function getInitials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function daysRemaining(endDate: string | null) {
  if (!endDate) return null;
  return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000));
}

function totalDays(start: string | null, end: string | null) {
  if (!start || !end) return null;
  return Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000));
}

const CircularProgress = ({ value, size = 96, stroke = 8, label }: {
  value: number; size?: number; stroke?: number; label: string;
}) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--primary))" strokeWidth={stroke} fill="none"
          strokeDasharray={circ} strokeDashoffset={circ - (value / 100) * circ} strokeLinecap="round"
          className="transition-all duration-500" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold">{label}</span>
      </div>
    </div>
  );
};

export function SprintDetailClient({
  projectId, projectName, sprint, issues, hasNextSprint,
}: SprintDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [teamSearch, setTeamSearch] = useState("");
  const [endSprintOpen, setEndSprintOpen] = useState(false);
  const [incompleteAction, setIncompleteAction] = useState<"backlog" | "next">("backlog");

  const completedIssues = issues.filter((i) => i.completed_at !== null);
  const incompleteIssues = issues.filter((i) => i.completed_at === null);
  const completionPct = issues.length > 0 ? Math.round((completedIssues.length / issues.length) * 100) : 0;

  const days = daysRemaining(sprint.end_date);
  const total = totalDays(sprint.start_date, sprint.end_date);
  const elapsed = total && days !== null ? total - days : null;
  const timePct = total && elapsed !== null ? Math.round((elapsed / total) * 100) : 0;

  const uniqueAssignees = [...new Set(issues.map((i) => i.assignee?.username).filter(Boolean))] as string[];

  const filteredIssues = issues.filter((i) => {
    const ms = statusFilter === "all" || i.status === statusFilter;
    const mp = priorityFilter === "all" || i.priority === priorityFilter;
    const ma = assigneeFilter === "all" || i.assignee?.username === assigneeFilter;
    return ms && mp && ma;
  });

  const teamMap = new Map<string, { username: string; avatar_url: string | null; completed: number; total: number }>();
  issues.forEach((i) => {
    if (!i.assignee) return;
    const u = i.assignee;
    const prev = teamMap.get(u.id) ?? { username: u.username, avatar_url: u.avatar_url, completed: 0, total: 0 };
    prev.total += 1;
    if (i.completed_at !== null) prev.completed += 1;
    teamMap.set(u.id, prev);
  });
  const teamMembers = [...teamMap.values()].filter((m) =>
    m.username.toLowerCase().includes(teamSearch.toLowerCase()),
  );

  const handleStartSprint = () => {
    startTransition(async () => {
      const result = await startSprint(sprint.id);
      if (result?.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Sprint started" });
      router.refresh();
    });
  };

  const handleCompleteSprint = () => {
    startTransition(async () => {
      const result = await completeSprint(sprint.id, incompleteAction);
      if (result?.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Sprint completed" });
      setEndSprintOpen(false);
      router.push(`/project/${projectId}/sprints`);
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/project/${projectId}/sprints`)}
            className="hover:bg-transparent text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{sprint.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {projectName}
              {sprint.start_date && sprint.end_date && ` • ${sprint.start_date} → ${sprint.end_date}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sprint.status === "planned" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-success hover:bg-success/90 text-success-foreground" disabled={isPending}>
                  Start Sprint
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Start Sprint?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will start the sprint immediately. Make sure all tasks are assigned and ready.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleStartSprint}>Start Sprint</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {sprint.status === "active" && (
            <Button variant="destructive" onClick={() => setEndSprintOpen(true)} disabled={isPending}>
              <Square className="w-4 h-4 mr-2" />
              End Sprint
            </Button>
          )}
        </div>
      </div>

      {/* End Sprint Dialog */}
      <Dialog open={endSprintOpen} onOpenChange={setEndSprintOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Sprint</DialogTitle>
            <DialogDescription>Choose what to do with incomplete tasks before ending the sprint.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Incomplete tasks: <span className="font-medium text-foreground">{incompleteIssues.length}</span>
              </p>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium">Move incomplete tasks to:</Label>
              <div className="space-y-2">
                {(["backlog", "next"] as const).map((val) => (
                  <label key={val} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                    <input type="radio" name="incompleteAction" value={val}
                      checked={incompleteAction === val}
                      onChange={() => setIncompleteAction(val)}
                      className="w-4 h-4" />
                    <div>
                      <p className="text-sm font-medium">{val === "backlog" ? "Move to Backlog" : "Move to Next Sprint"}</p>
                      <p className="text-xs text-muted-foreground">
                        {val === "backlog"
                          ? "Tasks will be added to the product backlog"
                          : hasNextSprint
                            ? "Tasks will be carried over to the next planned sprint"
                            : "No next sprint — tasks will go to backlog instead"}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEndSprintOpen(false)} disabled={isPending}>Cancel</Button>
            <Button variant="destructive" onClick={handleCompleteSprint} disabled={isPending}>
              {isPending ? "Ending..." : "End Sprint"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      {sprint.status !== "planned" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card className="bg-card border border-border">
            <CardContent className="p-5 flex items-center gap-5">
              <CircularProgress value={completionPct} label={`${completionPct}%`} />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Sprint Progress</p>
                <p className="text-lg font-semibold mt-1">{completedIssues.length} of {issues.length} done</p>
                <div className={`inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${completionPct >= timePct ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                  {completionPct >= timePct ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {completionPct >= timePct ? "On track" : "Behind schedule"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border">
            <CardContent className="p-5 flex items-center gap-5">
              <CircularProgress value={timePct} label={days !== null ? `${days}d` : "—"} />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Time Remaining</p>
                <p className="text-lg font-semibold mt-1">
                  {elapsed !== null && total ? `Day ${elapsed} of ${total}` : "—"}
                </p>
                <div className="inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  <Clock className="w-3 h-3" />{timePct}% elapsed
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total", value: issues.length, icon: ListChecks, color: "primary" },
              { label: "Completed", value: completedIssues.length, icon: CheckCircle2, color: "success" },
              { label: "Remaining", value: incompleteIssues.length, icon: Plus, color: "warning" },
              { label: "Done %", value: `${completionPct}%`, icon: Minus, color: "muted-foreground" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-md bg-${color}/10 flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 text-${color}`} />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <p className="text-base font-semibold leading-tight">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Progress */}
      {teamMembers.length > 0 && (
        <Card className="bg-card border border-border mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-base">Team Progress</CardTitle>
                <CardDescription>Tasks completed per team member</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search team member..." value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)} className="pl-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {teamMembers.map((m) => {
                const pct = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;
                const r = 30;
                const circ = 2 * Math.PI * r;
                return (
                  <div key={m.username} className="flex flex-col items-center text-center p-3 rounded-lg border border-border/60 hover:border-primary/40 hover:bg-muted/30 transition-colors">
                    <div className="relative" style={{ width: 72, height: 72 }}>
                      <svg width={72} height={72} className="-rotate-90">
                        <circle cx={36} cy={36} r={r} stroke="hsl(var(--muted))" strokeWidth={5} fill="none" />
                        <circle cx={36} cy={36} r={r}
                          stroke={pct === 100 ? "hsl(var(--success))" : "hsl(var(--primary))"}
                          strokeWidth={5} fill="none"
                          strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ}
                          strokeLinecap="round" className="transition-all duration-500" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                            {getInitials(m.username)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                    <p className="text-sm font-medium mt-3 truncate w-full">{m.username}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.completed}/{m.total} • {pct}%</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Issues List */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-base">Sprint Tasks ({issues.length})</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="qa">QA</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
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
                  {uniqueAssignees.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredIssues.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {issues.length === 0 ? "No issues in this sprint." : "No tasks match the current filters."}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredIssues.map((issue) => (
                <ViewTaskDialog
                  key={issue.id}
                  task={{
                    id: issue.id,
                    title: issue.title,
                    status: issue.status,
                    priority: issue.priority as "low" | "medium" | "high",
                    issueNumber: issue.issue_number,
                    assignee: issue.assignee
                      ? { name: issue.assignee.username, initials: getInitials(issue.assignee.username) }
                      : undefined,
                  }}
                  trigger={
                    <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer">
                      <div>
                        <p className="text-sm font-medium text-foreground">{issue.title}</p>
                        <p className="text-xs text-muted-foreground">
                          TASK-{issue.issue_number}
                          {issue.assignee && ` • ${issue.assignee.username}`}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>Status: <span className="text-foreground font-medium capitalize">{issue.status.replace("-", " ")}</span></p>
                        <p>Priority: <span className="text-foreground font-medium capitalize">{issue.priority}</span></p>
                      </div>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
