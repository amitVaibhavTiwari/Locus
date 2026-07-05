"use client";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ActivityUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface Activity {
  id: string;
  type: string;
  payload: string;
  created_at: string;
  user: ActivityUser;
}

interface SprintHistoryClientProps {
  projectId: string;
  sprint: { id: string; name: string; status: string };
  activities: Activity[];
}

const FIELD_LABELS: Record<string, string> = {
  name: "name",
  goal: "goal",
  start_date: "start date",
  end_date: "end date",
};

function formatDateOnly(iso: string | null) {
  if (!iso) return "none";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDescription(type: string, payload: string): string {
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(payload);
  } catch {
    console.error("Failed to parse activity payload:", payload);
  }

  switch (type) {
    case "sprint_created": {
      const name = data.name as string | undefined;
      return name ? `created sprint "${name}"` : "created this sprint";
    }

    case "sprint_started":
      return "started the sprint";

    case "sprint_completed": {
      const incomplete = data.incompleteCount as number | undefined;
      const targetName = data.moveTargetName as string | undefined;
      const parts: string[] = ["ended the sprint"];
      if (typeof incomplete === "number" && incomplete > 0) {
        parts.push(
          `${incomplete} incomplete task${incomplete !== 1 ? "s" : ""} moved to ${targetName ?? "Backlog"}`,
        );
      } else {
        parts.push("all tasks were completed");
      }
      return parts.join(" — ");
    }

    case "sprint_end_date_changed": {
      const from = data.from as string | null;
      const to = data.to as string | null;
      return `changed end date from ${formatDateOnly(from)} to ${formatDateOnly(to)}`;
    }

    case "sprint_updated": {
      const changes = data.changes as
        | { field: string; from: string | null; to: string | null }[]
        | undefined;
      if (!changes || changes.length === 0) return "updated sprint details";
      if (changes.length === 1) {
        const c = changes[0];
        const label = FIELD_LABELS[c.field] ?? c.field;
        if (c.field === "start_date" || c.field === "end_date") {
          return `changed ${label} from ${formatDateOnly(c.from)} to ${formatDateOnly(c.to)}`;
        }
        if (!c.from && c.to) return `set ${label} to "${c.to}"`;
        if (c.from && !c.to) return `removed ${label}`;
        return `changed ${label} from "${c.from}" to "${c.to}"`;
      }
      const labels = changes.map((c) => FIELD_LABELS[c.field] ?? c.field);
      if (labels.length === 2) return `updated ${labels[0]} and ${labels[1]}`;
      return `updated ${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
    }

    case "task_added_mid_sprint": {
      const num = data.issue_number as number | undefined;
      const title = data.title as string | undefined;
      if (num !== undefined && title)
        return `added task TASK-${num}: "${title}" mid-sprint`;
      if (num !== undefined) return `added task TASK-${num} mid-sprint`;
      return "added a task mid-sprint";
    }

    case "task_removed_mid_sprint": {
      const num = data.issue_number as number | undefined;
      const title = data.title as string | undefined;
      if (num !== undefined && title)
        return `removed task TASK-${num}: "${title}" from the sprint`;
      if (num !== undefined) return `removed task TASK-${num} from the sprint`;
      return "removed a task from the sprint";
    }

    default:
      return type.replace(/_/g, " ");
  }
}

export function SprintHistoryClient({
  projectId,
  sprint,
  activities,
}: SprintHistoryClientProps) {
  return (
    <div className="w-full p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="-ml-2 mb-4 text-muted-foreground hover:text-foreground hover:bg-transparent"
        >
          <Link href={`/project/${projectId}/sprints/${sprint.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sprint
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Sprint History</h1>
        <p className="text-sm text-muted-foreground mt-1 truncate">
          {sprint.name}
        </p>
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No history available.
        </p>
      ) : (
        <div className="space-y-0">
          {activities.map((a) => {
            const description = getDescription(a.type, a.payload);
            return (
              <div
                key={a.id}
                className="flex items-start gap-3 py-2.5 border-b border-border last:border-0"
              >
                <Avatar className="w-7 h-7 shrink-0">
                  {a.user.avatar_url && <AvatarImage src={a.user.avatar_url} />}
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {a.user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{a.user.username}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      {description}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(a.created_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
