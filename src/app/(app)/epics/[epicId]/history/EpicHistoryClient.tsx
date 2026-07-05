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

interface EpicHistoryClientProps {
  epic: { id: string; name: string; project_id: string };
  activities: Activity[];
}

const STATUS_LABELS: Record<string, string> = {
  planned: "Planned",
  in_progress: "In Progress",
  done: "Done",
};

const PRIORITY_LABELS: Record<string, string> = {
  highest: "Highest",
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "None",
};

const FIELD_LABELS: Record<string, string> = {
  name: "name",
  description: "description",
  priority: "priority",
  status: "status",
  owner: "owner",
  start_date: "start date",
  end_date: "deadline",
};

function formatDateOnly(iso: string | null) {
  if (!iso) return "none";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function describeFieldChange(
  field: string,
  from: string | null,
  to: string | null,
): string {
  if (field === "start_date" || field === "end_date") {
    return `from ${formatDateOnly(from)} to ${formatDateOnly(to)}`;
  }
  if (field === "priority") {
    return `from ${PRIORITY_LABELS[from ?? ""] ?? from ?? "none"} to ${PRIORITY_LABELS[to ?? ""] ?? to ?? "none"}`;
  }
  if (field === "status") {
    return `from ${STATUS_LABELS[from ?? ""] ?? from ?? "none"} to ${STATUS_LABELS[to ?? ""] ?? to ?? "none"}`;
  }
  if (field === "description") {
    if (!from && to) return "added description";
    if (from && !to) return "removed description";
    return "updated description";
  }
  if (field === "owner") {
    return "";
  }
  return `from "${from ?? "none"}" to "${to ?? "none"}"`;
}

function getDescription(type: string, payload: string): string {
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(payload);
  } catch {
    console.error("Failed to parse activity payload:", payload);
  }

  switch (type) {
    case "epic_created":
      return `created this epic`;

    case "status_changed": {
      const from = data.from as string | null;
      const to = data.to as string | null;
      const fromLabel = STATUS_LABELS[from ?? ""] ?? from ?? "unknown";
      const toLabel = STATUS_LABELS[to ?? ""] ?? to ?? "unknown";
      return `changed status from "${fromLabel}" to "${toLabel}"`;
    }

    case "task_added": {
      const num = data.issue_number as number | undefined;
      const title = data.title as string | undefined;
      if (num !== undefined && title)
        return `added task TASK-${num}: "${title}"`;
      if (num !== undefined) return `added task TASK-${num}`;
      return `added a task to this epic`;
    }

    case "epic_updated": {
      const changes = data.changes as
        | { field: string; from: string | null; to: string | null }[]
        | undefined;
      if (!changes || changes.length === 0) return `updated this epic`;
      if (changes.length === 1) {
        const c = changes[0];
        if (c.field === "owner") {
          if (!c.to) return `removed the owner`;
          if (!c.from) return `assigned an owner`;
          return `changed the owner`;
        }
        const label = FIELD_LABELS[c.field] ?? c.field;
        const detail = describeFieldChange(c.field, c.from, c.to);
        return detail ? `changed ${label} ${detail}` : `changed ${label}`;
      }
      const labels = changes.map((c) => FIELD_LABELS[c.field] ?? c.field);
      if (labels.length === 2) return `updated ${labels[0]} and ${labels[1]}`;
      return `updated ${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
    }

    default:
      return type.replace(/_/g, " ");
  }
}

export function EpicHistoryClient({
  epic,
  activities,
}: EpicHistoryClientProps) {
  return (
    <div className="w-full p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="-ml-2 mb-4 text-muted-foreground hover:text-foreground hover:bg-transparent"
        >
          <Link href={`/epics/${epic.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Epic
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Epic History</h1>
        <p className="text-sm text-muted-foreground mt-1 truncate">
          {epic.name}
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
