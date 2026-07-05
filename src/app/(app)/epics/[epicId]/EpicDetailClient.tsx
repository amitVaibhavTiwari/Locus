"use client";
import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Loader2,
  Pencil,
  Archive,
  ChevronDown,
  History,
  CalendarDays,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ViewTaskDialog } from "@/components/dialogs/ViewTaskDialog";
import { updateEpicStatus, updateEpic, archiveEpic } from "@/actions/epics";
import { useProjectRoleStore } from "@/stores/projectRoleStore";

interface User {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface Issue {
  id: string;
  issue_number: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  type: string;
  due_date: string | null;
  created_at: string;
  assignee: User | null;
  reporter: User | null;
  labels: string[];
}

interface Epic {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  priority: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  totalIssues: number;
  doneIssues: number;
  owner: User | null;
}

interface EpicDetailClientProps {
  epic: Epic;
  issues: Issue[];
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const PRIORITY_BADGE: Record<string, string> = {
  highest: "border-destructive text-destructive",
  high: "border-destructive text-destructive",
  medium: "border-warning text-warning",
  low: "border-success text-success",
  none: "border-muted-foreground text-muted-foreground",
};

const STATUS_BADGE: Record<string, string> = {
  planned: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/10 text-primary border-primary/30",
  completed: "bg-success/10 text-success border-success/30",
  done: "bg-success/10 text-success border-success/30",
  todo: "bg-muted text-muted-foreground",
  "in-progress": "bg-primary/10 text-primary border-primary/30",
  qa: "bg-warning/10 text-warning border-warning/30",
  pending: "bg-orange-500/10 text-orange-500 border-orange-500/30",
};

function OwnerSearchPopover({
  projectId,
  value,
  label,
  onChange,
}: {
  projectId: string;
  value: string;
  label: string;
  onChange: (id: string, name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        const res = await fetch(
          `/api/projects/${projectId}/backlog/users?${params}`,
        );
        if (res.ok) setUsers(await res.json());
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [open, query, projectId]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{label || "No owner"}</span>
          <ChevronDown className="w-3 h-3 ml-1 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <Input
          placeholder="Search member..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 mb-2 text-sm"
          autoFocus
        />
        <div className="space-y-0.5 max-h-52 overflow-y-auto">
          {value && (
            <button
              className="w-full text-left px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted rounded-sm"
              onClick={() => {
                onChange("", "");
                setOpen(false);
              }}
            >
              ✕ Remove owner
            </button>
          )}
          {loading ? (
            <div className="flex justify-center py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">
              No members found
            </p>
          ) : (
            users.map((u) => (
              <button
                key={u.id}
                className={`w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-muted flex items-center gap-2 transition-colors ${value === u.id ? "bg-primary/10 text-primary font-medium" : ""}`}
                onClick={() => {
                  onChange(u.id, u.username);
                  setOpen(false);
                }}
              >
                <Avatar className="w-5 h-5 shrink-0">
                  {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                  <AvatarFallback className="text-[9px]">
                    {getInitials(u.username)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{u.username}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function EpicDetailClient({ epic, issues }: EpicDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const [epicStatus, setEpicStatus] = useState(epic.status);
  const [isManager, setIsManager] = useState(false);

  const { getRole } = useProjectRoleStore();
  useEffect(() => {
    getRole(epic.project_id).then((role) => setIsManager(role === "manager"));
  }, [epic.project_id, getRole]);

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(epic.name);
  const [editDesc, setEditDesc] = useState(epic.description ?? "");
  const [editPriority, setEditPriority] = useState(epic.priority);
  const [editStatus, setEditStatus] = useState(epic.status);
  const [editOwnerId, setEditOwnerId] = useState(epic.owner?.id ?? "");
  const [editOwnerLabel, setEditOwnerLabel] = useState(
    epic.owner?.username ?? "",
  );
  const [editStartDate, setEditStartDate] = useState(epic.start_date ?? "");
  const [editEndDate, setEditEndDate] = useState(epic.end_date ?? "");
  const [editPending, setEditPending] = useState(false);

  const openEdit = () => {
    setEditName(epic.name);
    setEditDesc(epic.description ?? "");
    setEditPriority(epic.priority);
    setEditStatus(epicStatus);
    setEditOwnerId(epic.owner?.id ?? "");
    setEditOwnerLabel(epic.owner?.username ?? "");
    setEditStartDate(epic.start_date ?? "");
    setEditEndDate(epic.end_date ?? "");
    setEditOpen(true);
  };

  const handleEdit = () => {
    if (!editName.trim()) {
      toast({
        title: "Error",
        description: "Epic name is required",
        variant: "destructive",
      });
      return;
    }
    setEditPending(true);
    startTransition(async () => {
      const result = await updateEpic(epic.id, {
        name: editName.trim(),
        description: editDesc.trim() || null,
        priority: editPriority,
        status: editStatus,
        owner_id: editOwnerId || null,
        start_date: editStartDate || null,
        end_date: editEndDate || null,
      });
      setEditPending(false);
      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Epic updated" });
      setEpicStatus(editStatus);
      setEditOpen(false);
      router.refresh();
    });
  };

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archivePending, setArchivePending] = useState(false);

  const handleArchiveClick = () => {
    if (epicStatus !== "done") {
      toast({
        title: "Cannot archive",
        description: "Epic must be marked as done before it can be archived.",
        variant: "destructive",
      });
      return;
    }
    setArchiveOpen(true);
  };

  const handleArchiveConfirm = () => {
    setArchivePending(true);
    startTransition(async () => {
      const result = await archiveEpic(epic.id);
      setArchivePending(false);
      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        setArchiveOpen(false);
        return;
      }
      toast({ title: "Epic archived" });
      setArchiveOpen(false);
      router.push(`/project/${epic.project_id}/epics`);
    });
  };

  const handleStatusChange = (value: string) => {
    setEpicStatus(value);
    startTransition(async () => {
      const result = await updateEpicStatus(epic.id, value);
      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        setEpicStatus(epic.status);
        return;
      }
      toast({ title: "Status updated" });
      router.refresh();
    });
  };

  const pct =
    epic.totalIssues > 0
      ? Math.round((epic.doneIssues / epic.totalIssues) * 100)
      : 0;

  return (
    <div className="w-full max-w-full p-6 space-y-6">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex-1 space-y-4 min-w-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{epic.name}</h1>
            {epic.description && (
              <p className="text-muted-foreground mt-2">{epic.description}</p>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {epic.owner && (
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs bg-primary/20 text-primary">
                    {getInitials(epic.owner.username)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {epic.owner.username}
                </span>
              </div>
            )}
            <Badge
              variant="outline"
              className={`${PRIORITY_BADGE[epic.priority] ?? "border-muted-foreground text-muted-foreground"} capitalize bg-transparent`}
            >
              {epic.priority}
            </Badge>
            <Select value={epicStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-36 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5">
              {epic.doneIssues}/{epic.totalIssues} issues
            </span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {epic.start_date && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="w-4 h-4 shrink-0" />
                <span className="font-medium text-foreground">
                  Epic Start Date:
                </span>
                <span>{formatDate(epic.start_date)}</span>
              </div>
            )}
            {epic.end_date && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="w-4 h-4 shrink-0" />
                <span className="font-medium text-foreground">Deadline:</span>
                <span>{formatDate(epic.end_date)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - pct / 100)}`}
                className="text-primary transition-all duration-300"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">{pct}%</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 ml-2">
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link href={`/epics/${epic.id}/history`}>
                <History className="w-3.5 h-3.5" />
                History
              </Link>
            </Button>
            {isManager && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={openEdit}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-destructive border-destructive/40 hover:bg-destructive/10"
                  onClick={handleArchiveClick}
                >
                  <Archive className="w-3.5 h-3.5" />
                  Archive
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Issues ({issues.length})</h2>

        {issues.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-border rounded-md">
            <p className="text-base font-medium">No issues in this epic yet</p>
            <p className="text-sm mt-1">
              Assign issues to this epic when creating tasks.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {issues.map((issue) => (
              <ViewTaskDialog
                key={issue.id}
                issueId={issue.id}
                trigger={
                  <div className="flex items-center justify-between p-4 bg-card border border-border/50 rounded-md hover:bg-muted/30 cursor-pointer transition-colors">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <span className="text-sm font-mono text-muted-foreground shrink-0">
                        TASK-{issue.issue_number}
                      </span>
                      <h4 className="font-medium text-foreground truncate">
                        {issue.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <Badge
                        variant="outline"
                        className={`${STATUS_BADGE[issue.status] ?? "bg-muted text-muted-foreground"} capitalize text-xs`}
                      >
                        {issue.status.replace("-", " ")}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`${PRIORITY_BADGE[issue.priority] ?? "border-muted-foreground text-muted-foreground"} capitalize bg-transparent text-xs`}
                      >
                        {issue.priority}
                      </Badge>
                      {issue.assignee && (
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="text-xs bg-primary/20 text-primary">
                            {getInitials(issue.assignee.username)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Epic</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Epic name"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Describe the epic..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={editPriority} onValueChange={setEditPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="highest">Highest</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Owner</Label>
              <OwnerSearchPopover
                projectId={epic.project_id}
                value={editOwnerId}
                label={editOwnerLabel}
                onChange={(id, name) => {
                  setEditOwnerId(id);
                  setEditOwnerLabel(name);
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {editStatus === "planned" && (
                <div className="space-y-1.5">
                  <Label>Epic Start Date</Label>
                  <Input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={editPending}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={editPending}>
              {editPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this epic?</AlertDialogTitle>
            <AlertDialogDescription>
              This epic will be archived and hidden from the epics list. This
              action cannot be undone easily.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archivePending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveConfirm}
              disabled={archivePending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {archivePending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Archiving...
                </>
              ) : (
                "Archive"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
