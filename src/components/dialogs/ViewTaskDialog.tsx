"use client";
import React, { useState, useEffect, useTransition, useRef } from "react";
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
  Upload,
  Trash2,
  FileIcon,
  ImageIcon,
  Loader2,
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

interface Activity {
  id: string;
  type: string;
  payload: string;
  created_at: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
}

interface Attachment {
  id: string;
  filename: string;
  mime_type: string;
  size: number;
  created_at: string;
  uploader_name: string;
  url: string; // signed URL, valid for 1 hour — never persisted
}

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
    labels?: string[];
    epicName?: string | null;
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
  const statuses =
    boardStatuses && boardStatuses.length > 0
      ? boardStatuses
      : DEFAULT_STATUSES;
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
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentsLoaded, setAttachmentsLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (activeTab !== "history" || !task?.id || activitiesLoaded) return;
    fetch(`/api/issues/${task.id}/activities`)
      .then((r) => r.json())
      .then((data: Activity[]) => {
        setActivities(data);
        setActivitiesLoaded(true);
      })
      .catch(() => setActivitiesLoaded(true));
  }, [activeTab, task?.id, activitiesLoaded]);

  useEffect(() => {
    if (activeTab !== "attachments" || !task?.id || attachmentsLoaded) return;
    fetch(`/api/attachments/${task.id}`)
      .then((r) => r.json())
      .then((data: Attachment[]) => {
        setAttachments(data);
        setAttachmentsLoaded(true);
      })
      .catch(() => setAttachmentsLoaded(true));
  }, [activeTab, task?.id, attachmentsLoaded]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task?.id) return;
    e.target.value = "";

    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    body.append("issueId", task.id);

    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        throw new Error(error ?? "Upload failed");
      }
      const attachment: Attachment = await res.json();
      setAttachments((prev) => [...prev, attachment]);
      toast({ title: "File uploaded" });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!task?.id) return;
    setDeletingId(attachmentId);
    try {
      const res = await fetch(
        `/api/attachments/${task.id}?attachmentId=${attachmentId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Delete failed");
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      toast({ title: "Attachment deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

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
      toast({
        title: "Comment added",
        description: "Your comment has been posted",
      });
      setComment("");
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "high":
        return "text-destructive";
      case "medium":
        return "text-warning";
      case "low":
        return "text-success";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <>
      {/* Always in DOM so fileInputRef is never null when the button is clicked */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
      />

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
                    onClick={() =>
                      router.push(`/tasks/${task?.id}/edit` as never)
                    }
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
                <DialogTitle className="text-2xl">
                  {task?.title ?? "Untitled"}
                </DialogTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
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
                      <Flag
                        className={`w-4 h-4 ${getPriorityColor(priority)}`}
                      />
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
                          <AvatarFallback className="text-xs">
                            {task.assignee.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Unassigned
                      </span>
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
                          <AvatarFallback className="text-xs">
                            {task.reporter.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.reporter.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Unknown
                      </span>
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
                      {formattedDueDate ?? (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-24 text-muted-foreground text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Created:
                    </div>
                    <span className="text-sm">
                      {formattedCreatedAt ?? (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {task?.epicName && (
                <div className="flex items-center gap-3">
                  <div className="w-24 text-muted-foreground text-sm shrink-0">
                    Epic:
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs bg-primary/5 border-primary/30 text-primary"
                  >
                    {task.epicName}
                  </Badge>
                </div>
              )}

              {task?.labels && task.labels.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-24 text-muted-foreground text-sm shrink-0">
                    Labels:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {task.labels.map((l) => (
                      <Badge key={l} variant="secondary" className="text-xs">
                        {l}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
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
                      <div className="text-xs text-muted-foreground mb-1">
                        Parent Task
                      </div>
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
                    <p className="text-sm text-muted-foreground">
                      No description provided.
                    </p>
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
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No comments yet.
                  </p>
                </TabsContent>

                <TabsContent value="attachments" className="mt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {attachmentsLoaded
                        ? `${attachments.length} attachment${attachments.length !== 1 ? "s" : ""}`
                        : "Loading..."}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {uploading ? "Uploading…" : "Upload file"}
                    </Button>
                  </div>

                  {!attachmentsLoaded ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : attachments.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground space-y-1">
                      <Paperclip className="w-8 h-8 mx-auto opacity-30" />
                      <p className="text-sm">No attachments yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {attachments.map((att) => {
                        const isImage = att.mime_type.startsWith("image/");
                        const sizeLabel =
                          att.size < 1024 * 1024
                            ? `${(att.size / 1024).toFixed(1)} KB`
                            : `${(att.size / (1024 * 1024)).toFixed(1)} MB`;
                        return (
                          <div
                            key={att.id}
                            className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5 hover:bg-muted/30 transition-colors group"
                          >
                            <div className="shrink-0 text-muted-foreground">
                              {isImage ? (
                                <ImageIcon className="w-5 h-5" />
                              ) : (
                                <FileIcon className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-foreground hover:underline truncate block"
                              >
                                {att.filename}
                              </a>
                              <p className="text-xs text-muted-foreground">
                                {sizeLabel} · {att.uploader_name} ·{" "}
                                {new Date(att.created_at).toLocaleDateString(
                                  undefined,
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteAttachment(att.id)}
                              disabled={deletingId === att.id}
                            >
                              {deletingId === att.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  {!activitiesLoaded ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Loading...
                    </p>
                  ) : activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No history available.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {activities.map((a) => {
                        let description = a.type;
                        try {
                          const p = JSON.parse(a.payload);
                          if (a.type === "created")
                            description = `created this issue`;
                          else if (a.type === "moved")
                            description = `moved from "${p.from}" to "${p.to}"`;
                          else if (a.type === "updated")
                            description = `updated this issue`;
                        } catch {}
                        return (
                          <div
                            key={a.id}
                            className="flex items-start gap-3 py-2 border-b border-border last:border-0"
                          >
                            <Avatar className="w-7 h-7 shrink-0">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {a.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium">
                                {a.username}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {" "}
                                {description}
                              </span>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {new Date(a.created_at).toLocaleString(
                                  undefined,
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
            parentTask:
              task?.id && task?.title
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
