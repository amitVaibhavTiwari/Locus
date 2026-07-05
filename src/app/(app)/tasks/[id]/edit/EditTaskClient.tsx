"use client";
import React, {
  useState,
  useTransition,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarIcon,
  X,
  Search,
  ArrowLeft,
  Loader2,
  Upload,
  FileText,
  Paperclip,
  Trash2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  RichTextEditor,
  RichTextEditorRef,
} from "@/components/editor/RichTextEditor";
import { cn, cleanFilename } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { updateIssue } from "@/actions/issues";
import { StoryPointPicker } from "@/components/ui/story-point-picker";
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

interface BoardStatus {
  key: string;
  name: string;
}

interface ExistingAttachment {
  id: string;
  filename: string;
  mime_type: string;
  size: number;
  created_at: string;
  uploader_name: string;
  url: string;
}

interface Member {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
}

interface Sprint {
  id: string;
  name: string;
  status: string;
}

interface IssueData {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  dueDate: string | null;
  editPermission: "anyone" | "assignee_only" | "reporter_only";
  sprintId: string | null;
  storyPoints: number | null;
  labels: string[];
  epic: { id: string; name: string } | null;
  assignee: Member | null;
  reporter: Member;
}

interface EditTaskClientProps {
  issue: IssueData;
  projectId: string;
  projectName: string;
  statuses: BoardStatus[];
  sprints: Sprint[];
  initialMembers: Member[];
}

const predefinedLabels = [
  "Frontend",
  "Backend",
  "UI",
  "Bug",
  "Feature",
  "Documentation",
  "Testing",
  "Security",
  "Performance",
];

function getInitials(username: string) {
  return username
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function MemberPicker({
  projectId,
  initialMembers,
  selected,
  onSelect,
  placeholder,
}: {
  projectId: string;
  initialMembers: Member[];
  selected: Member | null;
  onSelect: (m: Member | null) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Member[]>(initialMembers);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleSearch = useCallback(
    (q: string) => {
      clearTimeout(timer.current);
      if (!q.trim()) {
        setResults(initialMembers);
        return;
      }
      setLoading(true);
      timer.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `/api/members/search?projectId=${encodeURIComponent(projectId)}&q=${encodeURIComponent(q)}`,
          );
          const data: Member[] = await res.json();
          setResults(data);
        } finally {
          setLoading(false);
        }
      }, 300);
    },
    [projectId, initialMembers],
  );

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setResults(initialMembers);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {selected ? (
            <div className="flex items-center gap-2">
              <Avatar className="w-5 h-5">
                <AvatarImage src={selected.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(selected.username)}
                </AvatarFallback>
              </Avatar>
              {selected.username}
            </div>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              {placeholder}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search..." onValueChange={handleSearch} />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <CommandEmpty>No person found.</CommandEmpty>
                <CommandGroup>
                  {selected && (
                    <CommandItem
                      value="__clear__"
                      onSelect={() => {
                        onSelect(null);
                        setOpen(false);
                      }}
                      className="text-muted-foreground"
                    >
                      Clear selection
                    </CommandItem>
                  )}
                  {results.map((member) => (
                    <CommandItem
                      key={member.id}
                      value={member.id}
                      onSelect={() => {
                        onSelect(member);
                        setOpen(false);
                      }}
                    >
                      <Avatar className="w-6 h-6 mr-2">
                        <AvatarImage src={member.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(member.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm">{member.username}</span>
                        <span className="text-xs text-muted-foreground">
                          {member.email}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function EditTaskClient({
  issue,
  projectId,
  projectName,
  statuses,
  sprints,
  initialMembers,
}: EditTaskClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [taskTitle, setTaskTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description);
  const [priority, setPriority] = useState(issue.priority);
  const [assignee, setAssignee] = useState<Member | null>(issue.assignee);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    issue.dueDate ? parseISO(issue.dueDate) : undefined,
  );
  const [labels, setLabels] = useState<string[]>(issue.labels);
  const [customLabel, setCustomLabel] = useState("");
  const [epic, setEpic] = useState<{ id: string; name: string } | null>(
    issue.epic,
  );
  const [storyPoints, setStoryPoints] = useState<number | null>(
    issue.storyPoints,
  );
  const [editPermission, setEditPermission] = useState<
    "anyone" | "assignee_only" | "reporter_only"
  >(issue.editPermission);
  const [existingAttachments, setExistingAttachments] = useState<
    ExistingAttachment[]
  >([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(true);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [confirmDeleteAttachment, setConfirmDeleteAttachment] = useState<{
    id: string;
    filename: string;
  } | null>(null);
  const [selectedSprintId, setSelectedSprintId] = useState<string>(
    issue.sprintId ?? "__none__",
  );
  const [midSprintWarning, setMidSprintWarning] = useState<
    "add" | "remove" | null
  >(null);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [epicOpen, setEpicOpen] = useState(false);
  const [epicResults, setEpicResults] = useState<
    { id: string; name: string }[]
  >([]);
  const [epicLoading, setEpicLoading] = useState(false);
  const epicTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const editorRef = useRef<RichTextEditorRef>(null);

  useEffect(() => {
    fetch(`/api/attachments/${issue.id}`)
      .then((r) => r.json())
      .then((data: ExistingAttachment[]) => setExistingAttachments(data))
      .catch(() => {})
      .finally(() => setAttachmentsLoading(false));
  }, [issue.id]);

  const doSubmit = () => {
    const pendingLabel = customLabel.trim();
    const finalLabels =
      pendingLabel && !labels.includes(pendingLabel)
        ? [...labels, pendingLabel]
        : labels;

    startTransition(async () => {
      const finalDescription = editorRef.current
        ? await editorRef.current.flush()
        : description;

      const formData = new FormData();
      formData.set("issue_id", issue.id);
      formData.set("title", taskTitle.trim());
      formData.set("description", finalDescription);
      formData.set("priority", priority || "medium");
      formData.set("labels", JSON.stringify(finalLabels));
      formData.set("edit_permission", editPermission);
      if (storyPoints !== null)
        formData.set("story_points", storyPoints.toString());
      formData.set("sprint_id", selectedSprintId);
      if (assignee) formData.set("assignee_id", assignee.id);
      if (dueDate) formData.set("due_date", format(dueDate, "yyyy-MM-dd"));
      if (epic) formData.set("epic_id", epic.id);

      const result = await updateIssue(undefined, formData);
      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      if (newAttachments.length > 0) {
        const failed: string[] = [];
        await Promise.all(
          newAttachments.map(async (file) => {
            const body = new FormData();
            body.append("file", file);
            body.append("issueId", issue.id);
            const res = await fetch("/api/upload", { method: "POST", body });
            if (!res.ok) failed.push(file.name);
          }),
        );
        if (failed.length > 0) {
          toast({
            title: "Some attachments failed to upload",
            description: failed.join(", "),
            variant: "destructive",
          });
        }
      }

      toast({ title: "Task updated" });
      router.push(`/project/${projectId}`);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskTitle.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }

    const oldSprintId = issue.sprintId ?? "__none__";
    const newSprintId = selectedSprintId;
    const sprintChanged = oldSprintId !== newSprintId;

    if (sprintChanged) {
      const newSprint = sprints.find((s) => s.id === newSprintId);
      const oldSprint = sprints.find((s) => s.id === oldSprintId);
      if (newSprint?.status === "active") {
        setMidSprintWarning("add");
        setPendingSubmit(true);
        return;
      }
      if (oldSprint?.status === "active") {
        setMidSprintWarning("remove");
        setPendingSubmit(true);
        return;
      }
    }

    doSubmit();
  };

  const handleEpicSearch = (q: string) => {
    clearTimeout(epicTimer.current);
    setEpicLoading(true);
    epicTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/epics/search?projectId=${encodeURIComponent(projectId)}&q=${encodeURIComponent(q)}`,
        );
        const data: { id: string; name: string }[] = await res.json();
        setEpicResults(data);
      } finally {
        setEpicLoading(false);
      }
    }, 300);
  };

  const handleEpicOpen = (next: boolean) => {
    setEpicOpen(next);
    if (next) {
      setEpicLoading(true);
      fetch(`/api/epics/search?projectId=${encodeURIComponent(projectId)}`)
        .then((r) => r.json())
        .then((data: { id: string; name: string }[]) => setEpicResults(data))
        .finally(() => setEpicLoading(false));
    }
  };

  const addLabel = (label: string) => {
    if (label && !labels.includes(label)) setLabels([...labels, label]);
  };
  const removeLabel = (label: string) =>
    setLabels(labels.filter((l) => l !== label));
  const addCustomLabel = () => {
    if (customLabel.trim()) {
      addLabel(customLabel.trim());
      setCustomLabel("");
    }
  };

  const handleDeleteExisting = async (attachmentId: string) => {
    setConfirmDeleteAttachment(null);
    const res = await fetch(
      `/api/attachments/${issue.id}?attachmentId=${attachmentId}`,
      {
        method: "DELETE",
      },
    );
    if (res.ok) {
      setExistingAttachments((prev) =>
        prev.filter((a) => a.id !== attachmentId),
      );
    } else {
      toast({ title: "Failed to delete attachment", variant: "destructive" });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewAttachments((prev) => [...prev, ...Array.from(e.target.files || [])]);
    e.target.value = "";
  };

  const removeNewAttachment = (index: number) => {
    setNewAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full py-6 px-4 lg:px-8">
        <div className="mb-8 pl-2">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 hover:bg-transparent text-muted-foreground hover:text-foreground -ml-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Task</h1>
            <p className="text-muted-foreground mt-2">
              Project: <span className="font-semibold">{projectName}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pl-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title">Task Title *</Label>
              <span
                className={`text-xs ${taskTitle.length > 130 ? "text-destructive" : "text-muted-foreground"}`}
              >
                {taskTitle.length}/150
              </span>
            </div>
            <Input
              id="title"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Enter task title"
              maxLength={150}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <RichTextEditor
              ref={editorRef}
              content={description}
              onChange={setDescription}
              placeholder="Describe the task in detail..."
              projectId={projectId}
            />
          </div>

          <div className="space-y-2">
            <Label>Story Points</Label>
            <StoryPointPicker value={storyPoints} onChange={setStoryPoints} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="highest">Highest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Who can edit
                <span className="text-xs font-normal text-muted-foreground">
                  (cannot be changed)
                </span>
              </Label>
              <Button
                variant="outline"
                className="w-full justify-start opacity-60 cursor-not-allowed"
                disabled
              >
                {editPermission === "anyone"
                  ? "Anyone in project"
                  : editPermission === "assignee_only"
                    ? "Assignee only"
                    : "Reporter only"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Assignee</Label>
              <MemberPicker
                projectId={projectId}
                initialMembers={initialMembers}
                selected={assignee}
                onSelect={setAssignee}
                placeholder="Search assignee..."
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Reporter
                <span className="text-xs font-normal text-muted-foreground">
                  (cannot be edited)
                </span>
              </Label>
              <Button
                variant="outline"
                className="w-full justify-start opacity-60 cursor-not-allowed"
                disabled
              >
                <div className="flex items-center gap-2">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={issue.reporter.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(issue.reporter.username)}
                    </AvatarFallback>
                  </Avatar>
                  {issue.reporter.username}
                </div>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Epic</Label>
              <Popover open={epicOpen} onOpenChange={handleEpicOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {epic ? (
                      epic.name
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Search epic...
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search epic..."
                      onValueChange={handleEpicSearch}
                    />
                    <CommandList>
                      {epicLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <>
                          <CommandEmpty>No epics found.</CommandEmpty>
                          <CommandGroup>
                            {epic && (
                              <CommandItem
                                value="__clear__"
                                onSelect={() => {
                                  setEpic(null);
                                  setEpicOpen(false);
                                }}
                                className="text-muted-foreground"
                              >
                                Clear selection
                              </CommandItem>
                            )}
                            {epicResults.map((e) => (
                              <CommandItem
                                key={e.id}
                                value={e.id}
                                onSelect={() => {
                                  setEpic(e);
                                  setEpicOpen(false);
                                }}
                              >
                                {e.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sprint</Label>
            <Select
              value={selectedSprintId}
              onValueChange={setSelectedSprintId}
            >
              <SelectTrigger>
                <SelectValue placeholder="No sprint" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No sprint</SelectItem>
                {sprints.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                    {s.status === "active" && (
                      <span className="ml-2 text-xs text-primary">
                        (active)
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Labels</Label>
            <div className="flex flex-wrap gap-2">
              {predefinedLabels.map((label) => (
                <Button
                  key={label}
                  type="button"
                  variant={labels.includes(label) ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    labels.includes(label)
                      ? removeLabel(label)
                      : addLabel(label)
                  }
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="Add custom label"
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addCustomLabel())
                }
              />
              <Button type="button" onClick={addCustomLabel} size="sm">
                Add
              </Button>
            </div>
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <Badge
                    key={label}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {label}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeLabel(label)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              Attachments
            </Label>

            {attachmentsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading attachments...
              </div>
            ) : existingAttachments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {existingAttachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 border border-border rounded-md hover:bg-muted/40"
                  >
                    <div className="w-9 h-9 rounded-sm bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-0"
                    >
                      <p className="text-sm font-medium truncate hover:underline">
                        {cleanFilename(file.filename)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(file.size)} · {file.uploader_name}
                      </p>
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setConfirmDeleteAttachment({
                          id: file.id,
                          filename: file.filename,
                        })
                      }
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                id="file-upload-edit"
                className="hidden"
                multiple
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload-edit" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, PNG, JPG, GIF up to 50MB
                </p>
              </label>
            </div>

            {newAttachments.length > 0 && (
              <div className="space-y-2">
                {newAttachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 shrink-0" />
                      <span className="text-sm truncate">
                        {cleanFilename(file.name)}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({formatBytes(file.size)})
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNewAttachment(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>

      <AlertDialog
        open={!!midSprintWarning}
        onOpenChange={(open) => {
          if (!open) {
            setMidSprintWarning(null);
            setPendingSubmit(false);
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {midSprintWarning === "add"
                ? "Adding task to active sprint"
                : "Removing task from active sprint"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {midSprintWarning === "add"
                ? "Adding a task mid-sprint will affect the sprint scope and may impact velocity tracking."
                : "Removing a task from an ongoing sprint will affect the sprint scope and may impact velocity tracking."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setMidSprintWarning(null);
                setPendingSubmit(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setMidSprintWarning(null);
                setPendingSubmit(false);
                doSubmit();
              }}
            >
              Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                handleDeleteExisting(confirmDeleteAttachment.id)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
