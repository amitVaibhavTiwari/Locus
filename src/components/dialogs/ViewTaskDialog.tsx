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
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Edit,
  Flag,
  Hash,
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
import { moveIssue, archiveIssue } from "@/actions/issues";
import { formatDate, formatDateTime } from "@/lib/date";
import { cleanFilename } from "@/lib/utils";
import { Archive } from "lucide-react";
import { useProjectRoleStore } from "@/stores/projectRoleStore";

type TaskPriority = "highest" | "high" | "medium" | "low" | "none";

interface TaskData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: TaskPriority;
  issue_number: number;
  created_at: string;
  due_date: string | null;
  project_id: string;
  assignee: { name: string; initials: string } | null;
  reporter: { name: string; initials: string } | null;
  labels: string[];
  epic_name: string | null;
  parentTask: { id: string; title: string } | null;
  boardStatuses: Array<{ key: string; name: string }>;
  story_points: number | null;
}

interface Activity {
  id: string;
  type: string;
  payload: string;
  created_at: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  body: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  edited_at: string | null;
  created_at: string;
  is_own: boolean;
}

interface Attachment {
  id: string;
  filename: string;
  mime_type: string;
  size: number;
  created_at: string;
  uploader_name: string;
  url: string;
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
  issueId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ViewTaskDialog({
  trigger,
  issueId,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: ViewTaskDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen =
    externalOnOpenChange !== undefined ? externalOnOpenChange : setInternalOpen;

  const [isManager, setIsManager] = useState(false);
  const { getRole } = useProjectRoleStore();

  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [taskLoading, setTaskLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [status, setStatus] = useState<string>("todo");
  const [comment, setComment] = useState("");
  const [viewingParentTask, setViewingParentTask] = useState(false);
  const [viewingSubtaskId, setViewingSubtaskId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentsLoaded, setAttachmentsLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteAttachment, setConfirmDeleteAttachment] = useState<{
    id: string;
    filename: string;
  } | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !issueId) return;
    setTaskLoading(true);
    setTaskData(null);
    setAttachmentsLoaded(false);
    setActivities([]);
    setAttachments([]);
    setComments([]);
    setShowCommentBox(false);
    setComment("");
    setActiveTab("description");

    fetch(`/api/issues/${issueId}`)
      .then((r) => r.json())
      .then((data: TaskData) => {
        setTaskData(data);
        setStatus(data.status ?? "todo");
        getRole(data.project_id).then((role) =>
          setIsManager(role === "manager"),
        );
      })
      .catch(() => {
        toast({ title: "Failed to load task", variant: "destructive" });
      })
      .finally(() => setTaskLoading(false));
  }, [open, issueId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab !== "history" || !issueId) return;
    setActivitiesLoading(true);
    fetch(`/api/issues/${issueId}/activities`)
      .then((r) => r.json())
      .then((data: Activity[]) => setActivities(data))
      .catch(() => {})
      .finally(() => setActivitiesLoading(false));
  }, [activeTab, issueId]);

  useEffect(() => {
    if (activeTab !== "attachments" || !issueId || attachmentsLoaded) return;
    fetch(`/api/attachments/${issueId}`)
      .then((r) => r.json())
      .then((data: Attachment[]) => {
        setAttachments(data);
        setAttachmentsLoaded(true);
      })
      .catch(() => setAttachmentsLoaded(true));
  }, [activeTab, issueId, attachmentsLoaded]);

  useEffect(() => {
    if (activeTab !== "comments" || !issueId) return;
    setCommentsLoading(true);
    fetch(`/api/issues/${issueId}/comments`)
      .then((r) => r.json())
      .then((data: { comments: Comment[]; currentUsername: string | null }) => {
        setComments(data.comments ?? []);
        setCurrentUsername(data.currentUsername);
      })
      .catch(() => {})
      .finally(() => setCommentsLoading(false));
  }, [activeTab, issueId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    body.append("issueId", issueId);

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
    setConfirmDeleteAttachment(null);
    setDeletingId(attachmentId);
    try {
      const res = await fetch(
        `/api/attachments/${issueId}?attachmentId=${attachmentId}`,
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

  const statuses =
    taskData?.boardStatuses && taskData.boardStatuses.length > 0
      ? taskData.boardStatuses
      : DEFAULT_STATUSES;

  const priority = (taskData?.priority ?? "medium") as TaskPriority;

  const displayId = taskData?.issue_number
    ? `TASK-${taskData.issue_number}`
    : issueId.slice(0, 8);

  const formattedDueDate = taskData?.due_date
    ? formatDate(taskData.due_date, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const formattedCreatedAt = taskData?.created_at
    ? formatDateTime(taskData.created_at, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const handleStatusChange = (value: string) => {
    setStatus(value);
    startTransition(async () => {
      await moveIssue(issueId, value);
      router.refresh();
    });
    toast({ title: "Status updated" });
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/issues/${issueId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: comment.trim() }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        throw new Error(error ?? "Failed to post comment");
      }
      const newComment: Comment = await res.json();
      setComments((prev) => [...prev, newComment]);
      setComment("");
      setShowCommentBox(false);
    } catch (err) {
      toast({
        title: "Failed to post comment",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId);
    try {
      const res = await fetch(
        `/api/issues/${issueId}/comments?commentId=${commentId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Delete failed");
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      toast({ title: "Failed to delete comment", variant: "destructive" });
    } finally {
      setDeletingCommentId(null);
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
                  {taskLoading ? (
                    <Skeleton className="h-5 w-20" />
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      {displayId}
                    </Badge>
                  )}
                  {!taskLoading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(`/tasks/${issueId}/edit` as never)
                      }
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  {!taskLoading && isManager && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setConfirmArchive(true)}
                    >
                      <Archive className="w-4 h-4 mr-1" />
                      Archive
                    </Button>
                  )}
                </div>
                {taskLoading ? (
                  <Skeleton className="h-8 w-80" />
                ) : (
                  <DialogTitle className="text-2xl">
                    {taskData?.title ?? "Untitled"}
                  </DialogTitle>
                )}
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
            {taskLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                </div>
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
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
                      {taskData?.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {taskData.assignee.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {taskData.assignee.name}
                          </span>
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
                      {taskData?.reporter ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {taskData.reporter.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {taskData.reporter.name}
                          </span>
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

                    <div className="flex items-center gap-3">
                      <div className="w-24 text-muted-foreground text-sm flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Points:
                      </div>
                      <span className="text-sm">
                        {taskData?.story_points != null ? (
                          <span className="font-medium">{taskData.story_points} SP</span>
                        ) : (
                          <span className="text-muted-foreground">Not estimated</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {taskData?.epic_name && (
                  <div className="flex items-center gap-3">
                    <div className="w-24 text-muted-foreground text-sm shrink-0">
                      Epic:
                    </div>
                    <span className="text-sm font-semibold">
                      {taskData.epic_name}
                    </span>
                  </div>
                )}

                {taskData?.labels && taskData.labels.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="w-24 text-muted-foreground text-sm shrink-0">
                      Labels:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {taskData.labels.map((l) => (
                        <Badge key={l} variant="secondary" className="text-xs">
                          {l}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

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
                    {taskData?.parentTask && (
                      <div className="border rounded-md p-3 bg-muted/30">
                        <div className="text-xs text-muted-foreground mb-1">
                          Parent Task
                        </div>
                        <Button
                          variant="link"
                          className="h-auto p-0 font-medium text-primary"
                          onClick={() => setViewingParentTask(true)}
                        >
                          {taskData.parentTask.id} - {taskData.parentTask.title}
                        </Button>
                      </div>
                    )}

                    {taskData?.description ? (
                      <div
                        className="prose prose-sm max-w-none text-muted-foreground"
                        dangerouslySetInnerHTML={{
                          __html: taskData.description,
                        }}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No description provided.
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="comments" className="mt-4 space-y-4">
                    {commentsLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="flex gap-3">
                            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Skeleton className="h-3.5 w-20" />
                                <Skeleton className="h-3 w-28" />
                              </div>
                              <Skeleton className="h-14 w-full rounded-md" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <MessageSquare className="w-8 h-8 mx-auto opacity-30 mb-2" />
                        <p className="text-sm">No comments yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {comments.map((c) => (
                          <div key={c.id} className="flex gap-3 group">
                            <Avatar className="w-8 h-8 shrink-0">
                              <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                                {c.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-muted/30 rounded-md px-3 py-2.5">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    {c.username}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(c.created_at).toLocaleString(
                                      undefined,
                                      {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}
                                  </span>
                                  {c.edited_at && (
                                    <span className="text-xs text-muted-foreground italic">
                                      (edited)
                                    </span>
                                  )}
                                </div>
                                {c.is_own && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDeleteComment(c.id)}
                                    disabled={deletingCommentId === c.id}
                                  >
                                    {deletingCommentId === c.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3 h-3" />
                                    )}
                                  </Button>
                                )}
                              </div>
                              <p className="text-sm text-foreground whitespace-pre-wrap">
                                {c.body}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!showCommentBox ? (
                      <button
                        onClick={() => setShowCommentBox(true)}
                        className="w-full flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground rounded-lg border border-dashed border-border hover:border-muted-foreground/50 px-3 py-2.5 transition-colors text-left"
                      >
                        <Avatar className="w-7 h-7 shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {currentUsername
                              ? currentUsername.slice(0, 2).toUpperCase()
                              : "??"}
                          </AvatarFallback>
                        </Avatar>
                        <span>Write a comment…</span>
                      </button>
                    ) : (
                      <div className="flex gap-3 items-start">
                        <Avatar className="w-9 h-9 shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {currentUsername
                              ? currentUsername.slice(0, 2).toUpperCase()
                              : "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <Textarea
                            autoFocus
                            placeholder="Add a comment… Ctrl+Enter to submit, Esc to cancel"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            className="rounded-sm resize-none"
                            onKeyDown={(e) => {
                              if (
                                e.key === "Enter" &&
                                (e.metaKey || e.ctrlKey)
                              ) {
                                handleAddComment();
                              }
                              if (e.key === "Escape") {
                                setShowCommentBox(false);
                                setComment("");
                              }
                            }}
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setShowCommentBox(false);
                                setComment("");
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleAddComment}
                              disabled={submittingComment || !comment.trim()}
                            >
                              {submittingComment ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4 mr-2" />
                              )}
                              {submittingComment ? "Posting…" : "Post Comment"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
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
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5"
                          >
                            <Skeleton className="w-5 h-5 shrink-0" />
                            <div className="flex-1 space-y-1.5">
                              <Skeleton className="h-3.5 w-48" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                          </div>
                        ))}
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
                                  {cleanFilename(att.filename)}
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
                                onClick={() =>
                                  setConfirmDeleteAttachment({
                                    id: att.id,
                                    filename: att.filename,
                                  })
                                }
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
                    {activitiesLoading ? (
                      <div className="space-y-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 py-2.5 border-b border-border last:border-0"
                          >
                            <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                            <div className="flex-1 space-y-1.5 pt-0.5">
                              <Skeleton className="h-3.5 w-56" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                        ))}
                      </div>
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
                            else if (a.type === "attachment_added")
                              description = `attached "${cleanFilename(p.filename)}"`;
                            else if (a.type === "attachment_removed")
                              description = `removed attachment "${cleanFilename(p.filename)}"`;
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
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {viewingParentTask && taskData?.parentTask && (
        <ViewTaskDialog
          trigger={<div />}
          issueId={taskData.parentTask.id}
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) setViewingParentTask(false);
          }}
        />
      )}

      {viewingSubtaskId && (
        <ViewTaskDialog
          trigger={<div />}
          issueId={viewingSubtaskId}
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) setViewingSubtaskId(null);
          }}
        />
      )}

      <AlertDialog
        open={!!confirmDeleteAttachment}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteAttachment(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete attachment?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;
              {confirmDeleteAttachment
                ? cleanFilename(confirmDeleteAttachment.filename)
                : ""}
              &rdquo; will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                confirmDeleteAttachment &&
                handleDeleteAttachment(confirmDeleteAttachment.id)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this task?</AlertDialogTitle>
            <AlertDialogDescription>
              The task will be removed from the board and backlog. You can view
              it in the project&apos;s Archived section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmArchive(false);
                startTransition(async () => {
                  const result = await archiveIssue(issueId);
                  if (result?.error) {
                    toast({
                      title: "Error",
                      description: result.error,
                      variant: "destructive",
                    });
                  } else {
                    toast({ title: "Task archived" });
                    setOpen(false);
                    router.refresh();
                  }
                });
              }}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
