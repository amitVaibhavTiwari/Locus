"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
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
  Edit,
  Search,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  Plus,
  Minus,
  ListChecks,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const projectNames: Record<string, string> = {
  "1": "E-commerce Platform",
  "2": "Mobile App Redesign",
  "3": "Dashboard Analytics",
  "4": "Marketing Website",
};

interface Task {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "qa" | "pending" | "done";
  priority: "low" | "medium" | "high";
  assignee: { name: string; initials: string };
}

const sprintTasks: Task[] = [
  {
    id: "1",
    title: "User Authentication System",
    status: "todo",
    priority: "high",
    assignee: { name: "Sarah Johnson", initials: "SJ" },
  },
  {
    id: "2",
    title: "Dashboard UI Components",
    status: "in-progress",
    priority: "medium",
    assignee: { name: "Mike Harrison", initials: "MH" },
  },
  {
    id: "3",
    title: "API Documentation",
    status: "qa",
    priority: "low",
    assignee: { name: "Lisa Thompson", initials: "LT" },
  },
  {
    id: "4",
    title: "Performance Optimization",
    status: "pending",
    priority: "high",
    assignee: { name: "Robert Kim", initials: "RK" },
  },
  {
    id: "5",
    title: "User Onboarding Flow",
    status: "done",
    priority: "medium",
    assignee: { name: "Anna Miller", initials: "AM" },
  },
  {
    id: "6",
    title: "Mobile Responsive Design",
    status: "in-progress",
    priority: "high",
    assignee: { name: "Lisa Thompson", initials: "LT" },
  },
  {
    id: "7",
    title: "Email Notification System",
    status: "todo",
    priority: "medium",
    assignee: { name: "Robert Kim", initials: "RK" },
  },
  {
    id: "8",
    title: "Search Functionality",
    status: "done",
    priority: "low",
    assignee: { name: "Mike Harrison", initials: "MH" },
  },
];

const teamMembers = [
  { name: "Sarah Johnson", initials: "SJ", completed: 3, total: 4 },
  { name: "Mike Harrison", initials: "MH", completed: 2, total: 3 },
  { name: "Lisa Thompson", initials: "LT", completed: 1, total: 2 },
  { name: "Robert Kim", initials: "RK", completed: 0, total: 2 },
  { name: "Anna Miller", initials: "AM", completed: 2, total: 2 },
  { name: "Noah Chen", initials: "NC", completed: 4, total: 5 },
  { name: "Priya Patel", initials: "PP", completed: 1, total: 3 },
  { name: "Diego Ramirez", initials: "DR", completed: 3, total: 3 },
  { name: "Emma Wilson", initials: "EW", completed: 2, total: 4 },
  { name: "Liam Brown", initials: "LB", completed: 0, total: 1 },
];

const CircularProgress = ({
  value,
  size = 72,
  stroke = 6,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label: string;
}) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>
    </div>
  );
};

const SprintDetail = () => {
  const { projectId, sprintId } = useParams<{
    projectId: string;
    sprintId: string;
  }>();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>(sprintTasks);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [extendDays, setExtendDays] = useState("7");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isEndSprintOpen, setIsEndSprintOpen] = useState(false);
  const [incompleteTasksAction, setIncompleteTasksAction] = useState<
    "backlog" | "next"
  >("backlog");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [teamSearch, setTeamSearch] = useState("");
  const [editData, setEditData] = useState({
    name: "Sprint 5",
    description: "User authentication and dashboard features",
    startDate: "2024-12-01",
    endDate: "2024-12-30",
  });

  if (!projectId || !projectNames[projectId]) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Project Not Found
          </h1>
          <p className="text-muted-foreground mt-2">
            The requested project could not be found.
          </p>
        </div>
      </div>
    );
  }

  const projectName = projectNames[projectId];
  const isActiveSprint = sprintId === "1";
  const isUpcomingSprint = sprintId === "2";

  const sprintData = {
    name: editData.name,
    description: editData.description,
    startDate: editData.startDate,
    endDate: editData.endDate,
    daysRemaining: 10,
    totalDays: 29,
    ticketsAtStart: 15,
    ticketsCompleted: 8,
    ticketsCurrent: 12,
    ticketsAdded: 5,
    ticketsRemoved: 0,
  };

  const completionPercentage = Math.round(
    (sprintData.ticketsCompleted / sprintData.ticketsAtStart) * 100,
  );
  const daysElapsed = sprintData.totalDays - sprintData.daysRemaining;
  const timeProgress = Math.round((daysElapsed / sprintData.totalDays) * 100);

  const uniqueAssignees = Array.from(
    new Set(tasks.map((t) => t.assignee.name)),
  );

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;
    const matchesAssignee =
      assigneeFilter === "all" || task.assignee.name === assigneeFilter;
    return matchesStatus && matchesPriority && matchesAssignee;
  });

  const filteredTeamMembers = teamMembers.filter((member) =>
    member.name.toLowerCase().includes(teamSearch.toLowerCase()),
  );

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "todo":
        return "To Do";
      case "in-progress":
        return "In Progress";
      case "qa":
        return "QA";
      case "pending":
        return "Pending";
      case "done":
        return "Done";
      default:
        return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const handleEndSprint = () => {
    console.log("Ending sprint with action:", incompleteTasksAction);
    setIsEndSprintOpen(false);
    router.push(`/project/${projectId}/sprints`);
  };

  const handleStartSprint = () => {
    console.log("Starting sprint...");
  };

  const handleExtendSprint = () => {
    console.log(`Extending sprint by ${extendDays} days...`);
  };

  const handleSaveEdit = () => {
    console.log("Saving sprint changes...", editData);
    setIsEditOpen(false);
  };

  return (
    <div className="p-6">
      {/* Header */}
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
              {sprintData.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {projectName} • {sprintData.startDate} to {sprintData.endDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-transparent text-muted-foreground hover:text-foreground"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Sprint</DialogTitle>
                <DialogDescription>Update sprint details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Sprint Name</Label>
                  <Input
                    id="edit-name"
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editData.description}
                    onChange={(e) =>
                      setEditData({ ...editData, description: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-startDate">Start Date</Label>
                    <Input
                      id="edit-startDate"
                      type="date"
                      value={editData.startDate}
                      onChange={(e) =>
                        setEditData({ ...editData, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-endDate">End Date</Label>
                    <Input
                      id="edit-endDate"
                      type="date"
                      value={editData.endDate}
                      onChange={(e) =>
                        setEditData({ ...editData, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>Save Changes</Button>
              </div>
            </DialogContent>
          </Dialog>

          {isActiveSprint && (
            <>
              <Dialog open={isEndSprintOpen} onOpenChange={setIsEndSprintOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Square className="w-4 h-4 mr-2" />
                    End Sprint
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>End Sprint</DialogTitle>
                    <DialogDescription>
                      Choose what to do with incomplete tasks before ending the
                      sprint.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Incomplete tasks:{" "}
                        <span className="font-medium text-foreground">
                          {tasks.filter((t) => t.status !== "done").length}
                        </span>
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Move incomplete tasks to:
                      </Label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                          <input
                            type="radio"
                            name="incompleteAction"
                            value="backlog"
                            checked={incompleteTasksAction === "backlog"}
                            onChange={(e) =>
                              setIncompleteTasksAction(
                                e.target.value as "backlog" | "next",
                              )
                            }
                            className="w-4 h-4"
                          />
                          <div>
                            <p className="text-sm font-medium">
                              Move to Backlog
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Tasks will be added to the product backlog
                            </p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                          <input
                            type="radio"
                            name="incompleteAction"
                            value="next"
                            checked={incompleteTasksAction === "next"}
                            onChange={(e) =>
                              setIncompleteTasksAction(
                                e.target.value as "backlog" | "next",
                              )
                            }
                            className="w-4 h-4"
                          />
                          <div>
                            <p className="text-sm font-medium">
                              Move to Next Sprint
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Tasks will be carried over to the next sprint
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setIsEndSprintOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleEndSprint}>
                      End Sprint
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}

          {isUpcomingSprint && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-success hover:bg-success/90 text-success-foreground">
                  Start Sprint Now
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Start Sprint?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will start the sprint immediately. Make sure all tasks
                    are assigned and ready.
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
          )}
        </div>
      </div>

      {/* Sprint Overview - Hero + secondary stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Hero: Completion */}
        <Card className="bg-card border border-border lg:col-span-1">
          <CardContent className="p-5 flex items-center gap-5">
            <CircularProgress
              value={completionPercentage}
              size={96}
              stroke={8}
              label={`${completionPercentage}%`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Sprint Progress
              </p>
              <p className="text-lg font-semibold text-foreground mt-1">
                {sprintData.ticketsCompleted} of {sprintData.ticketsAtStart}{" "}
                done
              </p>
              <div
                className={`inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${completionPercentage >= timeProgress ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
              >
                {completionPercentage >= timeProgress ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {completionPercentage >= timeProgress
                  ? "On track"
                  : "Behind schedule"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hero: Time */}
        <Card className="bg-card border border-border lg:col-span-1">
          <CardContent className="p-5 flex items-center gap-5">
            <CircularProgress
              value={timeProgress}
              size={96}
              stroke={8}
              label={`${sprintData.daysRemaining}d`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Time Remaining
              </p>
              <p className="text-lg font-semibold text-foreground mt-1">
                Day {daysElapsed} of {sprintData.totalDays}
              </p>
              <div className="inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                <Clock className="w-3 h-3" />
                {timeProgress}% elapsed
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Secondary stats grid */}
        <div className="grid grid-cols-2 gap-3 lg:col-span-1">
          <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
              <ListChecks className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Total</p>
              <p className="text-base font-semibold text-foreground leading-tight">
                {sprintData.ticketsCurrent}
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-done/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-done" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Completed</p>
              <p className="text-base font-semibold text-foreground leading-tight">
                {sprintData.ticketsCompleted}
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-success/10 flex items-center justify-center">
              <Plus className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Added</p>
              <p className="text-base font-semibold text-success leading-tight">
                +{sprintData.ticketsAdded}
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-destructive/10 flex items-center justify-center">
              <Minus className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Removed</p>
              <p className="text-base font-semibold text-foreground leading-tight">
                {sprintData.ticketsRemoved}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Progress */}
      <Card className="bg-card border border-border mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-base">Team Progress</CardTitle>
              <CardDescription>Tasks completed per team member</CardDescription>
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
            {filteredTeamMembers.map((member) => {
              const pct = Math.round((member.completed / member.total) * 100);
              return (
                <div
                  key={member.name}
                  className="flex flex-col items-center text-center p-3 rounded-lg border border-border/60 hover:border-primary/40 hover:bg-muted/30 transition-colors"
                >
                  <div className="relative" style={{ width: 72, height: 72 }}>
                    <svg width={72} height={72} className="-rotate-90">
                      <circle
                        cx={36}
                        cy={36}
                        r={30}
                        stroke="hsl(var(--muted))"
                        strokeWidth={5}
                        fill="none"
                      />
                      <circle
                        cx={36}
                        cy={36}
                        r={30}
                        stroke={
                          pct === 100
                            ? "hsl(var(--success))"
                            : "hsl(var(--primary))"
                        }
                        strokeWidth={5}
                        fill="none"
                        strokeDasharray={2 * Math.PI * 30}
                        strokeDashoffset={
                          2 * Math.PI * 30 - (pct / 100) * 2 * Math.PI * 30
                        }
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground mt-3 truncate w-full">
                    {member.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {member.completed}/{member.total} • {pct}%
                  </p>
                </div>
              );
            })}
            {filteredTeamMembers.length === 0 && (
              <p className="col-span-full text-center text-sm text-muted-foreground py-6">
                No team members found
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-base">Sprint Tasks</CardTitle>
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
          <div className="space-y-2">
            {filteredTasks.map((task) => (
              <ViewTaskDialog
                key={task.id}
                trigger={
                  <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {task.assignee.name}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>
                        Status:{" "}
                        <span className="text-foreground font-medium">
                          {getStatusLabel(task.status)}
                        </span>
                      </p>
                      <p>
                        Priority:{" "}
                        <span className="text-foreground font-medium">
                          {getPriorityLabel(task.priority)}
                        </span>
                      </p>
                    </div>
                  </div>
                }
                task={{ id: task.id, title: task.title }}
              />
            ))}
            {filteredTasks.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No tasks match the current filters
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SprintDetail;
