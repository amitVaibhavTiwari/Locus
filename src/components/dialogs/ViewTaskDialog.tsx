"use client";
import React, { useState } from "react";
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
  Plus,
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

interface ViewTaskDialogProps {
  trigger: React.ReactNode;
  task?: {
    id?: string;
    title?: string;
    parentTask?: {
      id: string;
      title: string;
    };
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ViewTaskDialog({
  trigger,
  task,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: ViewTaskDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen =
    externalOnOpenChange !== undefined ? externalOnOpenChange : setInternalOpen;
  const [activeTab, setActiveTab] = useState("description");
  const [status, setStatus] = useState("in-progress");
  const [priority, setPriority] = useState("high");
  const [comment, setComment] = useState("");
  const [viewingParentTask, setViewingParentTask] = useState(false);
  const [viewingSubtaskId, setViewingSubtaskId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();

  const comments = [
    {
      id: "1",
      author: { name: "Mike Harrison", initials: "MH" },
      content:
        "I've started working on the JWT implementation. Should have the basic structure ready by EOD.",
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      author: { name: "Sarah Johnson", initials: "SJ" },
      content:
        "@MikeHarrison Great! Make sure to include refresh token logic as well.",
      timestamp: "1 hour ago",
    },
    {
      id: "3",
      author: { name: "Lisa Thompson", initials: "LT" },
      content: "Do we need to support OAuth providers in this iteration?",
      timestamp: "30 minutes ago",
    },
  ];

  const subtasks = [
    {
      id: "TASK-124",
      title: "Design JWT token structure",
      status: "done",
      completed: true,
    },
    {
      id: "TASK-125",
      title: "Implement login endpoint",
      status: "in-progress",
      completed: false,
    },
    {
      id: "TASK-126",
      title: "Create password reset flow",
      status: "todo",
      completed: false,
    },
  ];

  const taskData = {
    id: "TASK-123",
    title: "Implement user authentication system",
    description:
      "Design and implement a secure user authentication system with JWT tokens...",
    priority: priority,
    status: status,
    assignee: "1",
    reporter: "1",
    dueDate: new Date(2024, 2, 15),
    labels: ["Frontend", "Security"],
    epic: "1",
    parentTask: task?.parentTask || null,
    subtasks: subtasks,
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    toast({
      title: "Status updated",
      description: `Task status changed successfully`,
    });
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "highest":
        return "text-destructive";
      case "high":
        return "text-destructive/70";
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
                    {taskData.id}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      router.push(`/tasks/${taskData.id}/edit` as never);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
                <DialogTitle className="text-2xl">{taskData.title}</DialogTitle>
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
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="qa">QA Review</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-24 text-muted-foreground text-sm flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      Priority:
                    </div>
                    <div
                      className="flex items-center gap-2 cursor-not-allowed"
                      title="Edit task to change priority"
                    >
                      <Flag
                        className={`w-4 h-4 ${getPriorityColor(priority)}`}
                      />
                      <span className="text-sm">
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-24 text-muted-foreground text-sm flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Assignee:
                    </div>
                    <a
                      href="/team/1"
                      className="flex items-center gap-2 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = "/team/1";
                      }}
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">SJ</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">Sarah Johnson</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-24 text-muted-foreground text-sm flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Reporter:
                    </div>
                    <a
                      href="/team/1"
                      className="flex items-center gap-2 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = "/team/1";
                      }}
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">SJ</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">Sarah Johnson</span>
                    </a>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-24 text-muted-foreground text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Due Date:
                    </div>
                    <span className="text-sm">March 15, 2024</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-24 text-muted-foreground text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Created:
                    </div>
                    <span className="text-sm">March 1, 2024</span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-24 text-muted-foreground text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Labels:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline">Frontend</Badge>
                      <Badge variant="outline">Security</Badge>
                    </div>
                  </div>
                </div>
              </div>

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
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5 text-xs"
                    >
                      {comments.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="attachments"
                    className="h-10 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground gap-2"
                  >
                    <Paperclip className="w-4 h-4" />
                    Attachments
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5 text-xs"
                    >
                      2
                    </Badge>
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
                  <div className="space-y-4">
                    {taskData.parentTask && (
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

                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      <p className="mb-4">
                        Design and implement a comprehensive user authentication
                        system with JWT tokens. The system should support
                        email/password login, password reset, and session
                        management. Include proper input validation and error
                        handling.
                      </p>
                      <p className="mb-4">
                        <strong>Requirements:</strong>
                      </p>
                      <ul className="list-disc pl-5 space-y-2 mb-4">
                        <li>Implement JWT token generation and validation</li>
                        <li>
                          Add refresh token mechanism for extended sessions
                        </li>
                        <li>
                          Create password reset flow with email verification
                        </li>
                        <li>Implement rate limiting for login attempts</li>
                        <li>Add comprehensive error handling and logging</li>
                      </ul>
                      <p className="mb-4">
                        <strong>Technical Details:</strong>
                      </p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Use bcrypt for password hashing</li>
                        <li>Implement HTTPS-only cookie storage</li>
                        <li>Add CSRF protection</li>
                      </ul>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="link"
                        size="sm"
                        className="text-primary"
                        onClick={() => setActiveTab("comments")}
                      >
                        See all comments ({comments.length})
                      </Button>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          Subtasks ({subtasks.length})
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/tasks/${taskData.id}/subtask/new` as never,
                            )
                          }
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Subtask
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {subtasks.map((subtask) => (
                          <div
                            key={subtask.id}
                            className="flex items-center gap-3 p-3 border rounded-md hover:bg-secondary/50 cursor-pointer"
                            onClick={() => setViewingSubtaskId(subtask.id)}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {subtask.id}
                                </Badge>
                                <span
                                  className={`text-sm ${subtask.completed ? "line-through text-muted-foreground" : ""}`}
                                >
                                  {subtask.title}
                                </span>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-xs capitalize"
                            >
                              {subtask.status.replace("-", " ")}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="comments" className="mt-4 space-y-4">
                  <div className="space-y-3">
                    {comments.map((c) => (
                      <div
                        key={c.id}
                        className="flex gap-3 p-3 rounded-sm bg-muted/30 border border-border/50"
                      >
                        <Avatar className="w-9 h-9 shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {c.author.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {c.author.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Â· {c.timestamp}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80 leading-relaxed">
                            {c.content}
                          </p>
                        </div>
                      </div>
                    ))}

                    <div className="pt-2">
                      <div className="flex gap-3 items-start">
                        <Avatar className="w-9 h-9 shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            SJ
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
                  </div>
                </TabsContent>

                <TabsContent value="attachments" className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      {
                        name: "authentication-flow.pdf",
                        size: "245 KB",
                        date: "Mar 2, 2024",
                      },
                      {
                        name: "security-requirements.docx",
                        size: "128 KB",
                        date: "Mar 1, 2024",
                      },
                    ].map((file) => (
                      <div
                        key={file.name}
                        className="flex items-center gap-3 p-3 border border-border rounded-sm hover:bg-muted/40 cursor-pointer transition-colors"
                      >
                        <div className="w-9 h-9 rounded-sm bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {file.size} Â· {file.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  <div className="relative pl-4 border-l border-border space-y-5">
                    {[
                      {
                        who: "Sarah Johnson",
                        initials: "SJ",
                        action: <>created this task</>,
                        when: "March 1, 2024 at 10:30 AM",
                      },
                      {
                        who: "Sarah Johnson",
                        initials: "SJ",
                        action: (
                          <>
                            changed status from{" "}
                            <Badge variant="outline" className="mx-1">
                              To Do
                            </Badge>{" "}
                            to{" "}
                            <Badge variant="outline" className="mx-1">
                              In Progress
                            </Badge>
                          </>
                        ),
                        when: "March 2, 2024 at 9:15 AM",
                      },
                      {
                        who: "Mike Harrison",
                        initials: "MH",
                        action: <>was assigned to this task</>,
                        when: "March 2, 2024 at 2:45 PM",
                      },
                    ].map((evt, i) => (
                      <div key={i} className="relative flex gap-3">
                        <span className="absolute -left-[21px] top-2 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {evt.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{evt.who}</span>{" "}
                            {evt.action}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {evt.when}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Subtask Dialog */}
      {viewingSubtaskId && (
        <ViewTaskDialog
          trigger={<div />}
          task={{
            ...taskData,
            id: viewingSubtaskId,
            title: subtasks.find((s) => s.id === viewingSubtaskId)?.title || "",
            parentTask: {
              id: taskData.id,
              title: taskData.title,
            },
          }}
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) setViewingSubtaskId(null);
          }}
        />
      )}

      {/* Parent Task Dialog */}
      {viewingParentTask && taskData.parentTask && (
        <ViewTaskDialog
          trigger={<div />}
          task={{
            ...taskData,
            id: taskData.parentTask.id,
            title: taskData.parentTask.title,
            parentTask: undefined,
          }}
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) setViewingParentTask(false);
          }}
        />
      )}
    </>
  );
}
