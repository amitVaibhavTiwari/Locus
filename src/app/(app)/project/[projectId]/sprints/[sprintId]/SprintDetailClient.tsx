"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Square,
  CheckCircle2,
  Clock,
  Plus,
  Minus,
  ListChecks,
  TrendingUp,
  TrendingDown,
  Search,
  History,
  Pencil,
  Flag,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewTaskDialog } from "@/components/dialogs/ViewTaskDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { startSprint, completeSprint, updateSprint } from "@/actions/sprints";
import { formatDate, daysUntil, daysSince, daysBetween } from "@/lib/date";

interface Issue {
  id: string;
  issue_number: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  assignee: { id: string; username: string; avatar_url: string | null } | null;
  reporter: { id: string; username: string; avatar_url: string | null } | null;
  labels: string[];
  epic_name: string | null;
  story_points: number | null;
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
  hasActiveSprint: boolean;
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "high":
    case "highest":
      return "border-destructive text-destructive";
    case "medium":
      return "border-warning text-warning";
    case "low":
      return "border-success text-success";
    default:
      return "border-muted-foreground text-muted-foreground";
  }
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const CircularProgress = ({
  value,
  size = 96,
  stroke = 8,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label: string;
}) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={circ - (value / 100) * circ}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold">{label}</span>
      </div>
    </div>
  );
};

export function SprintDetailClient({
  projectId,
  projectName,
  sprint,
  issues,
  hasActiveSprint,
}: SprintDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [teamSearch, setTeamSearch] = useState("");
  const [endSprintOpen, setEndSprintOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState<string>("backlog");
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(sprint.name);
  const [editGoal, setEditGoal] = useState(sprint.goal ?? "");
  const [editStartDate, setEditStartDate] = useState(sprint.start_date ?? "");
  const [editEndDate, setEditEndDate] = useState(sprint.end_date ?? "");
  const [endDateWarningOpen, setEndDateWarningOpen] = useState(false);
  const [startConfirmOpen, setStartConfirmOpen] = useState(false);
  const [startBlockOpen, setStartBlockOpen] = useState(false);
  const [futureSprints, setFutureSprints] = useState<
    {
      id: string;
      name: string;
      start_date: string | null;
      end_date: string | null;
    }[]
  >([]);
  const [sprintsLoading, setSprintsLoading] = useState(false);

  const completedIssues = issues.filter((i) => i.completed_at !== null);
  const incompleteIssues = issues.filter((i) => i.completed_at === null);
  const totalSP = issues.reduce((acc, i) => acc + (i.story_points ?? 0), 0);
  const completedSP = completedIssues.reduce(
    (acc, i) => acc + (i.story_points ?? 0),
    0,
  );
  const completionPct =
    issues.length > 0
      ? Math.round((completedIssues.length / issues.length) * 100)
      : 0;

  const days = daysUntil(sprint.end_date);
  const spanDays = daysBetween(sprint.start_date, sprint.end_date);
  const total = spanDays !== null ? spanDays + 1 : null;
  const sinceStart = daysSince(sprint.start_date);
  const elapsed = sinceStart !== null ? sinceStart + 1 : null;
  const timePct =
    spanDays && sinceStart !== null
      ? Math.min(100, Math.round((sinceStart / spanDays) * 100))
      : 0;

  const uniqueAssignees = [
    ...new Set(issues.map((i) => i.assignee?.username).filter(Boolean)),
  ] as string[];

  const filteredIssues = issues.filter((i) => {
    const ms = statusFilter === "all" || i.status === statusFilter;
    const mp = priorityFilter === "all" || i.priority === priorityFilter;
    const ma =
      assigneeFilter === "all" || i.assignee?.username === assigneeFilter;
    return ms && mp && ma;
  });

  const teamMap = new Map<
    string,
    {
      username: string;
      avatar_url: string | null;
      completed: number;
      total: number;
    }
  >();
  issues.forEach((i) => {
    if (!i.assignee) return;
    const u = i.assignee;
    const prev = teamMap.get(u.id) ?? {
      username: u.username,
      avatar_url: u.avatar_url,
      completed: 0,
      total: 0,
    };
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
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Sprint started" });
      router.refresh();
    });
  };

  const openEndSprintDialog = async () => {
    setMoveTarget("backlog");
    setEndSprintOpen(true);
    setSprintsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/sprints`);
      if (res.ok) {
        const data: { sprints: typeof futureSprints } = await res.json();
        setFutureSprints(data.sprints);
      }
    } finally {
      setSprintsLoading(false);
    }
  };

  const handleCompleteSprint = () => {
    startTransition(async () => {
      const result = await completeSprint(sprint.id, moveTarget);
      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Sprint completed" });
      setEndSprintOpen(false);
      router.push(`/project/${projectId}/sprints`);
    });
  };

  const doEditSprint = () => {
    startTransition(async () => {
      const data =
        sprint.status === "active"
          ? {
              name: editName.trim() || sprint.name,
              goal: editGoal.trim() || null,
              end_date: editEndDate || null,
            }
          : {
              name: editName.trim() || sprint.name,
              goal: editGoal.trim() || null,
              start_date: editStartDate || null,
              end_date: editEndDate || null,
            };
      const result = await updateSprint(sprint.id, data);
      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Sprint updated" });
      setEditOpen(false);
      router.refresh();
    });
  };

  const handleEditSprint = () => {
    if (
      sprint.status === "active" &&
      (editEndDate || null) !== (sprint.end_date ?? null)
    ) {
      setEndDateWarningOpen(true);
      return;
    }
    doEditSprint();
  };

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/project/${projectId}/sprints`)}
            className="hover:bg-transparent text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {sprint.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {projectName}
              {sprint.start_date && sprint.end_date && (
                <>
                  {" "}
                  &bull; {formatDate(sprint.start_date)} &rarr;{" "}
                  {formatDate(sprint.end_date)}
                </>
              )}
              {sprint.goal && <> &bull; {sprint.goal}</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/project/${projectId}/sprints/${sprint.id}/history`}>
              <History className="w-4 h-4 mr-2" />
              History
            </Link>
          </Button>
          {sprint.status !== "completed" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditName(sprint.name);
                setEditGoal(sprint.goal ?? "");
                setEditStartDate(sprint.start_date ?? "");
                setEditEndDate(sprint.end_date ?? "");
                setEditOpen(true);
              }}
              disabled={isPending}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {sprint.status === "planned" && (
            <Button
              disabled={isPending}
              onClick={() => {
                if (hasActiveSprint) {
                  setStartBlockOpen(true);
                } else {
                  setStartConfirmOpen(true);
                }
              }}
            >
              Start Sprint
            </Button>
          )}
          {sprint.status === "active" && (
            <Button
              variant="destructive"
              onClick={openEndSprintDialog}
              disabled={isPending}
            >
              <Square className="w-4 h-4 mr-2" />
              End Sprint
            </Button>
          )}
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sprint</DialogTitle>
            <DialogDescription>
              {sprint.status === "active"
                ? "Start date cannot be changed for an active sprint."
                : "Update sprint details."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Sprint Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Sprint name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={editGoal}
                onChange={(e) => setEditGoal(e.target.value)}
                placeholder="Sprint goal (optional)"
              />
            </div>
            {sprint.status === "planned" && (
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSprint} disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={endDateWarningOpen}
        onOpenChange={setEndDateWarningOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change sprint end date?</AlertDialogTitle>
            <AlertDialogDescription>
              Changing the end date of an ongoing sprint will affect its scope
              and may impact velocity and deadline tracking.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEndDateWarningOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setEndDateWarningOpen(false);
                doEditSprint();
              }}
            >
              Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={startConfirmOpen} onOpenChange={setStartConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Sprint?</AlertDialogTitle>
            <AlertDialogDescription>
              This will start the sprint immediately. Make sure all tasks are
              assigned and ready.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStartSprint}>
              Start Sprint
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={startBlockOpen} onOpenChange={setStartBlockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sprint already active</AlertDialogTitle>
            <AlertDialogDescription>
              Another sprint is already active in this project. Complete it
              before starting a new one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setStartBlockOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={endSprintOpen} onOpenChange={setEndSprintOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Sprint</DialogTitle>
            <DialogDescription>
              Choose where to move incomplete tasks before ending the sprint.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {incompleteIssues.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {incompleteIssues.length}
                  </span>{" "}
                  incomplete {incompleteIssues.length === 1 ? "task" : "tasks"}{" "}
                  will be moved
                </p>
              </div>
            )}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Move incomplete tasks to:
              </Label>
              {sprintsLoading ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Skeleton className="w-4 h-4 rounded-full shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-16" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </div>
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <Skeleton className="w-4 h-4 rounded-full shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-44" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  <label
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${moveTarget === "backlog" ? "border-primary bg-primary/5" : "hover:bg-muted/30"}`}
                  >
                    <input
                      type="radio"
                      name="moveTarget"
                      value="backlog"
                      checked={moveTarget === "backlog"}
                      onChange={() => setMoveTarget("backlog")}
                      className="w-4 h-4 accent-primary"
                    />
                    <div>
                      <p className="text-sm font-medium">Backlog</p>
                      <p className="text-xs text-muted-foreground">
                        Tasks go to the product backlog
                      </p>
                    </div>
                  </label>

                  {futureSprints.map((s) => (
                    <label
                      key={s.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${moveTarget === s.id ? "border-primary bg-primary/5" : "hover:bg-muted/30"}`}
                    >
                      <input
                        type="radio"
                        name="moveTarget"
                        value={s.id}
                        checked={moveTarget === s.id}
                        onChange={() => setMoveTarget(s.id)}
                        className="w-4 h-4 accent-primary"
                      />
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.start_date && s.end_date
                            ? `${formatDate(s.start_date)} → ${formatDate(s.end_date)}`
                            : "Dates not set"}
                        </p>
                      </div>
                    </label>
                  ))}

                  {futureSprints.length === 0 && (
                    <p className="text-xs text-muted-foreground px-1">
                      No other planned sprints available
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setEndSprintOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCompleteSprint}
              disabled={isPending || sprintsLoading}
            >
              {isPending ? "Ending..." : "End Sprint"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {sprint.status !== "planned" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card className="bg-card border border-border dark:border-none">
            <CardContent className="p-5 flex items-center gap-5">
              <CircularProgress
                value={completionPct}
                label={`${completionPct}%`}
              />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Sprint Progress
                </p>
                <p className="text-lg font-semibold mt-1">
                  {completedIssues.length} of {issues.length} done
                </p>
                <div
                  className={`inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${completionPct >= timePct ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
                >
                  {completionPct >= timePct ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {completionPct >= timePct ? "On track" : "Behind schedule"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border dark:border-none">
            <CardContent className="p-5 flex items-center gap-5">
              <CircularProgress
                value={timePct}
                label={days !== null ? `${days}d` : "—"}
              />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Time Remaining
                </p>
                <p className="text-lg font-semibold mt-1">
                  {elapsed !== null && total
                    ? `Day ${elapsed} of ${total}`
                    : "—"}
                </p>
                <div className="inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {timePct}% elapsed
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Total",
                value: issues.length,
                icon: ListChecks,
                color: "primary",
              },
              {
                label: "Completed",
                value: completedIssues.length,
                icon: CheckCircle2,
                color: "success",
              },
              {
                label: "Remaining",
                value: incompleteIssues.length,
                icon: Plus,
                color: "warning",
              },
              {
                label: "Done %",
                value: `${completionPct}%`,
                icon: Minus,
                color: "muted-foreground",
              },
              ...(totalSP > 0
                ? [
                    {
                      label: "Total SP",
                      value: totalSP,
                      icon: TrendingUp,
                      color: "primary",
                    },
                    {
                      label: "SP Done",
                      value: completedSP,
                      icon: TrendingDown,
                      color: "success",
                    },
                  ]
                : []),
            ].map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="rounded-lg border border-border dark:border-none bg-card p-3 flex items-center gap-3"
              >
                <div
                  className={`w-9 h-9 rounded-md bg-${color}/10 flex items-center justify-center`}
                >
                  <Icon className={`w-4 h-4 text-${color}`} />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <p className="text-base font-semibold leading-tight">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {teamMembers.length > 0 && (
        <Card className="bg-card border border-border dark:border-none mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-base">Team Progress</CardTitle>
                <CardDescription>
                  Tasks completed per team member
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search team member..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {teamMembers.map((m) => {
                const pct =
                  m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;
                const r = 30;
                const circ = 2 * Math.PI * r;
                return (
                  <div
                    key={m.username}
                    className="flex flex-col items-center text-center p-3 rounded-lg border border-border/60 hover:border-primary/40 hover:bg-muted/30 transition-colors"
                  >
                    <div className="relative" style={{ width: 72, height: 72 }}>
                      <svg width={72} height={72} className="-rotate-90">
                        <circle
                          cx={36}
                          cy={36}
                          r={r}
                          stroke="hsl(var(--muted))"
                          strokeWidth={5}
                          fill="none"
                        />
                        <circle
                          cx={36}
                          cy={36}
                          r={r}
                          stroke={
                            pct === 100
                              ? "hsl(var(--success))"
                              : "hsl(var(--primary))"
                          }
                          strokeWidth={5}
                          fill="none"
                          strokeDasharray={circ}
                          strokeDashoffset={circ - (pct / 100) * circ}
                          strokeLinecap="round"
                          className="transition-all duration-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                            {getInitials(m.username)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                    <p className="text-sm font-medium mt-3 truncate w-full">
                      {m.username}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {m.completed}/{m.total} • {pct}%
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border dark:border-none border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-base">
              Sprint Tasks ({issues.length})
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
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
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
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
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {uniqueAssignees.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredIssues.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {issues.length === 0
                ? "No issues in this sprint."
                : "No tasks match the current filters."}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredIssues.map((issue) => (
                <ViewTaskDialog
                  key={issue.id}
                  issueId={issue.id}
                  trigger={
                    <div className="p-4 bg-card border border-border rounded-lg hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col gap-2 h-full">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="shrink-0">
                          TASK-{issue.issue_number}
                        </span>
                        {issue.assignee && (
                          <>
                            <span className="text-border shrink-0">·</span>
                            <span className="font-medium truncate max-w-30">
                              {issue.assignee.username}
                            </span>
                          </>
                        )}
                      </div>
                      <p
                        className={`font-medium text-sm leading-snug line-clamp-2 ${issue.completed_at ? "text-muted-foreground line-through" : "text-foreground"}`}
                      >
                        {issue.title.length > 80
                          ? issue.title.slice(0, 80) + "…"
                          : issue.title}
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                        <div className="flex gap-1 flex-wrap">
                          {issue.labels.slice(0, 2).map((label, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs py-0 max-w-20 truncate"
                            >
                              {label}
                            </Badge>
                          ))}
                          {issue.labels.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{issue.labels.length - 2}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {issue.story_points != null && (
                            <Badge
                              variant="secondary"
                              className="text-xs font-semibold"
                            >
                              {issue.story_points} SP
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-xs ${getPriorityColor(issue.priority)}`}
                          >
                            <Flag className="w-3 h-3 mr-1" />
                            {issue.priority.charAt(0).toUpperCase() +
                              issue.priority.slice(1)}
                          </Badge>
                          {issue.due_date && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {new Date(issue.due_date).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </div>
                          )}
                        </div>
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
