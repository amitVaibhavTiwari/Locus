"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ViewTaskDialog } from "@/components/dialogs/ViewTaskDialog";
import { updateEpicStatus } from "@/actions/epics";

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
  totalIssues: number;
  doneIssues: number;
  owner: { id: string; username: string; avatar_url: string | null } | null;
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

export function EpicDetailClient({ epic, issues }: EpicDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [epicStatus, setEpicStatus] = useState(epic.status);

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
      toast({ title: "Epic status updated" });
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
        </div>

        <div className="relative w-20 h-20 flex-shrink-0">
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
    </div>
  );
}
