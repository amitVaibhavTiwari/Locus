"use client";
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Edit,
  Flag,
  User,
  FileText,
  MessageSquare,
  History,
  Paperclip,
  Send,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { moveIssue } from "@/actions/issues";

type TaskPriority = "low" | "medium" | "high";

const DEFAULT_STATUSES = [
  { key: "todo", name: "To Do" },
  { key: "in-progress", name: "In Progress" },
  { key: "qa", name: "In QA" },
  { key: "pending", name: "Pending Deployment" },
  { key: "done", name: "Done" },
];

interface ViewTaskDialogProps {
  trigger: React.ReactNode;
  task?: {
    id?: string;
    title?: string;
    description?: string;
    status?: string;
    priority?: TaskPriority;
    assignee?: { name: string; avatar?: string; initials: string };
    reporter?: { name: string; initials: string };
    dueDate?: string;
    issueNumber?: number;
    createdAt?: string;
    parentTask?: { id: string; title: string };
  };
  boardStatuses?: Array<{ key: string; name: string }>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ViewTaskDialog({
  trigger,
  task,
  boardStatuses,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: ViewTaskDialogProps) {
  const statuses = boardStatuses && boardStatuses.length > 0 ? boardStatuses : DEFAULT_STATUSES;
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen =
    externalOnOpenChange !== undefined ? externalOnOpenChange : setInternalOpen;
  const [activeTab, setActiveTab] = useState("description");
  const [status, setStatus] = useState<string>(task?.status ?? "todo");
  const [comment, setComment] = useState("");
  const [viewingParentTask, setViewingParentTask] = useState(false);
  const [viewingSubtaskId, setViewingSubtaskId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [, startTransition] = useTransition();
  const { toast } = useToast();

  const priority = task?.priority ?? "medium";

  const displayId = task?.issueNumber
    ? `TASK-${task.issueNumber}`
    : (task?.id?.slice(0, 8) ?? "TASK-???");

  const formattedDueDate = task?.dueDate
    ? new Date(task.dueDate).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const formattedCreatedAt = task?.createdAt
    ? new Date(task.createdAt).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const handleStatusChange = (value: string) => {
    setStatus(value);
    if (task?.id) {
      startTransition(async () => {
        await moveIssue(task.id!, value);
        router.refresh();
      });
    }
    toast({ title: "Status updated" });
  };

  const handleAddComment = () => {
    if (comment.trim()) {
      toast({ title: "Comment added", description: "Your comment has been posted" });
      setComment("");
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "high": return "text-destructive";
      case "medium": return "text-warning";
      case "low": return "text-success";
      default: return "text-muted-foreground";
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent
          className={`${isFullscreen ? "max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)]" : "sm:max-w-[1180px] h-[90vh]"} flex flex-col p-0`}
        >
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {displayId}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/tasks/${task?.id}/edit` as never)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
                <DialogTitle className="text-2xl">{task?.title ?? "Untitled"}</DialogTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-6">
              {/* Task Details */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Label className="w-24 text-muted-foreground flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      Status:
                    </Label>
                    <Select value={status} onValueChange={handleStatusChange}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s.key} value={s.key}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-24 text-muted-foreground text-sm flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      Priority:
                    </div>
                    <div className="flex items-center gap-2">
                      <Flag className={`w-4 h-4 ${getPriorityColor(priority)}`} />
                      <span className="text-sm capitalize">{priority}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-24 text-muted-foreground text-sm flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Assignee:
                    </div>
                    {task?.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">{task.assignee.initials}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Unassigned</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-24 text-muted-foreground text-sm flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Reporter:
                    </div>
                    {task?.reporter ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">{task.reporter.initials}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.reporter.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Unknown</span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-24 text-muted-foreground text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Due Date:
                    </div>
                    <span className="text-sm">
                      {formattedDueDate ?? <span className="text-muted-foreground">Not set</span>}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-24 text-muted-foreground text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Created:
                    </div>
                    <span className="text-sm">
                      {formattedCreatedAt ?? <span className="text-muted-foreground">Unknown</span>}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="h-10 w-full justify-start bg-transparent border-b border-border rounded-none p-0 gap-1">
                  <TabsTrigger
                    value="description"
                    className="h-10 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Description
                  </TabsTrigger>
                  <TabsTrigger
                    value="comments"
                    className="h-10 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Comments
                  </TabsTrigger>
                  <TabsTrigger
                    value="attachments"
                    className="h-10 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground gap-2"
                  >
                    <Paperclip className="w-4 h-4" />
                    Attachments
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="h-10 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground gap-2"
                  >
                    <History className="w-4 h-4" />
                    History
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="mt-4 space-y-4">
                  {task?.parentTask && (
                    <div className="border rounded-md p-3 bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">Parent Task</div>
                      <Button
                        variant="link"
                        className="h-auto p-0 font-medium text-primary"
                        onClick={() => setViewingParentTask(true)}
                      >
                        {task.parentTask.id} - {task.parentTask.title}
                      </Button>
                    </div>
                  )}

                  {task?.description ? (
                    <div
                      className="prose prose-sm max-w-none text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: task.description }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">No description provided.</p>
                  )}
                </TabsContent>

                <TabsContent value="comments" className="mt-4 space-y-4">
                  <div className="pt-2">
                    <div className="flex gap-3 items-start">
                      <Avatar className="w-9 h-9 shrink-0">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {task?.reporter?.initials ?? "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <Textarea
                          placeholder="Add a comment... Use @ to mention team members"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={3}
                          className="rounded-sm resize-none"
                        />
                        <div className="flex justify-end">
                          <Button size="sm" onClick={handleAddComment}>
                            <Send className="w-4 h-4 mr-2" />
                            Post Comment
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
                </TabsContent>

                <TabsContent value="attachments" className="mt-4 space-y-4">
                  <p className="text-sm text-muted-foreground text-center py-8">No attachments yet.</p>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  <p className="text-sm text-muted-foreground text-center py-8">No history available.</p>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Parent Task Dialog */}
      {viewingParentTask && task?.parentTask && (
        <ViewTaskDialog
          trigger={<div />}
          task={{
            id: task.parentTask.id,
            title: task.parentTask.title,
          }}
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) setViewingParentTask(false);
          }}
        />
      )}

      {/* Subtask Dialog */}
      {viewingSubtaskId && (
        <ViewTaskDialog
          trigger={<div />}
          task={{
            id: viewingSubtaskId,
            parentTask: task?.id && task?.title
              ? { id: task.id, title: task.title }
              : undefined,
          }}
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) setViewingSubtaskId(null);
          }}
        />
      )}
    </>
  );
}
