"use client";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ViewTaskDialog } from "@/components/dialogs/ViewTaskDialog";

export default function EpicDetail() {
  const { epicId } = useParams();
  const router = useRouter();

  // Mock data - later would come from API/store
  const epic = {
    id: epicId,
    title: "User Authentication System",
    description:
      "Complete overhaul of user authentication with OAuth integration",
    priority: "high",
    status: "in-progress",
    stories: 12,
    completed: 8,
    owner: { name: "John Doe", initials: "JD" },
  };

  const tickets = [
    {
      id: "TASK-101",
      title: "Implement OAuth 2.0 integration",
      status: "done",
      priority: "high",
      assignee: { name: "John Doe", initials: "JD" },
      labels: ["backend", "security"],
      dueDate: "2024-01-15",
    },
    {
      id: "TASK-102",
      title: "Add Google OAuth provider",
      status: "in-progress",
      priority: "high",
      assignee: { name: "Jane Smith", initials: "JS" },
      labels: ["backend"],
      dueDate: "2024-01-20",
    },
    {
      id: "TASK-103",
      title: "Create login UI components",
      status: "todo",
      priority: "medium",
      assignee: { name: "Mike Johnson", initials: "MJ" },
      labels: ["frontend", "ui"],
      dueDate: "2024-01-25",
    },
    {
      id: "TASK-104",
      title: "Add unit tests for auth service",
      status: "in-qa",
      priority: "medium",
      assignee: { name: "Sarah Wilson", initials: "SW" },
      labels: ["testing"],
      dueDate: "2024-01-18",
    },
  ];

  const getPriorityBorderColor = (priority: string) => {
    switch (priority) {
      case "highest":
      case "high":
        return "border-destructive text-destructive";
      case "medium":
        return "border-warning text-warning";
      case "low":
      case "lowest":
        return "border-success text-success";
      default:
        return "border-muted-foreground text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-success/10 text-success border-success/30";
      case "in-progress":
        return "bg-primary/10 text-primary border-primary/30";
      case "in-qa":
        return "bg-warning/10 text-warning border-warning/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const percentage = Math.round((epic.completed / epic.stories) * 100);

  return (
    <div className="w-full max-w-full p-6 space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/epics")}
        className="gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Epics
      </Button>

      {/* Header Section */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{epic.title}</h1>
            <p className="text-muted-foreground mt-2">{epic.description}</p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs bg-primary/20 text-primary">
                  {epic.owner.initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{epic.owner.name}</span>
            </div>
            <Badge
              variant="outline"
              className={`${getPriorityBorderColor(epic.priority)} capitalize bg-transparent`}
            >
              {epic.priority}
            </Badge>
            <Badge variant="outline" className={getStatusColor(epic.status)}>
              {epic.status}
            </Badge>
            <span className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5">
              {epic.completed}/{epic.stories} tickets
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/epics/${epicId}/edit`)}
            className="gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
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
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - percentage / 100)}`}
                className="text-primary transition-all duration-300"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">{percentage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Tickets ({tickets.length})</h2>
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <ViewTaskDialog
              key={ticket.id}
              task={{
                id: ticket.id,
                title: ticket.title,
              }}
              trigger={
                <Card className="bg-card/80 dark:bg-card/60 hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors cursor-pointer border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-sm font-mono text-muted-foreground">
                          {ticket.id}
                        </span>
                        <h4 className="font-medium text-foreground">
                          {ticket.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={getStatusColor(ticket.status)}
                        >
                          {ticket.status}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`${getPriorityBorderColor(ticket.priority)} capitalize bg-transparent`}
                        >
                          {ticket.priority}
                        </Badge>
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="text-xs bg-primary/20 text-primary">
                            {ticket.assignee.initials}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
