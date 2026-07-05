"use client";
import React, { useState, useTransition, useRef, useCallback } from "react";
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
  Paperclip,
  Upload,
  Search,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import {
  RichTextEditor,
  type RichTextEditorRef,
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
import { createIssue } from "@/actions/issues";
import { StoryPointPicker } from "@/components/ui/story-point-picker";

interface BoardStatus {
  key: string;
  name: string;
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

interface CreateTaskClientProps {
  projectId: string;
  projectName: string;
  statuses: BoardStatus[];
  sprints: Sprint[];
  initialMembers: Member[];
  currentUserId: string;
  defaultStatus: string;
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

export function CreateTaskClient({
  projectId,
  projectName,
  statuses,
  sprints,
  initialMembers,
  currentUserId,
  defaultStatus,
}: CreateTaskClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const editorRef = useRef<RichTextEditorRef>(null);

  const [taskTitle, setTaskTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [type, setType] = useState("task");
  const [status, setStatus] = useState(defaultStatus);
  const [assignee, setAssignee] = useState<Member | null>(null);
  const [reporter, setReporter] = useState<Member | null>(
    initialMembers.find((m) => m.id === currentUserId) ??
      initialMembers[0] ??
      null,
  );
  const [dueDate, setDueDate] = useState<Date>();
  const [labels, setLabels] = useState<string[]>([]);
  const [customLabel, setCustomLabel] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [epic, setEpic] = useState<{ id: string; name: string } | null>(null);
  const [sprintId, setSprintId] = useState<string | null>(
    sprints.find((s) => s.status === "active")?.id ?? null,
  );
  const [storyPoints, setStoryPoints] = useState<number | null>(null);
  const [editPermission, setEditPermission] = useState<
    "anyone" | "assignee_only" | "reporter_only"
  >("anyone");
  const [epicOpen, setEpicOpen] = useState(false);
  const [epicResults, setEpicResults] = useState<
    { id: string; name: string }[]
  >([]);
  const [epicLoading, setEpicLoading] = useState(false);
  const epicTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

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

    const pendingLabel = customLabel.trim();
    const finalLabels =
      pendingLabel && !labels.includes(pendingLabel)
        ? [...labels, pendingLabel]
        : labels;

    startTransition(async () => {
      let finalDescription = description;
      try {
        if (editorRef.current)
          finalDescription = await editorRef.current.flush();
      } catch {
        toast({
          title: "Image upload failed",
          description: "Could not upload one or more pasted images.",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.set("project_id", projectId);
      formData.set("title", taskTitle.trim());
      formData.set("description", finalDescription);
      formData.set("status", status);
      formData.set("priority", priority || "medium");
      formData.set("type", type);
      formData.set("labels", JSON.stringify(finalLabels));
      if (assignee) formData.set("assignee_id", assignee.id);
      if (reporter) formData.set("reporter_id", reporter.id);
      if (dueDate) formData.set("due_date", format(dueDate, "yyyy-MM-dd"));
      if (epic) formData.set("epic_id", epic.id);
      if (sprintId) formData.set("sprint_id", sprintId);
      formData.set("edit_permission", editPermission);
      if (storyPoints !== null)
        formData.set("story_points", storyPoints.toString());

      const result = await createIssue(undefined, formData);
      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      if (result?.issueId && attachments.length > 0) {
        const failed: string[] = [];
        await Promise.all(
          attachments.map(async (file) => {
            const body = new FormData();
            body.append("file", file);
            body.append("issueId", result.issueId!);
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

      const locationLabel = sprintId
        ? (sprints.find((s) => s.id === sprintId)?.name ?? "sprint")
        : "backlog";
      toast({
        title: "Task created",
        description: `Added to ${locationLabel}`,
      });
      router.push(`/project/${projectId}`);
    });
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
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachments((prev) => [...prev, ...Array.from(e.target.files || [])]);
  };
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
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
            <h1 className="text-3xl font-bold">Create New Task</h1>
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
            <Label htmlFor="description">Description *</Label>
            <RichTextEditor
              ref={editorRef}
              content={description}
              onChange={setDescription}
              placeholder="Describe the task in detail with formatting, lists, links, images and more..."
              projectId={projectId}
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="subtask">Subtask</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>Location</Label>
              <Select
                value={sprintId ?? "__backlog__"}
                onValueChange={(v) =>
                  setSprintId(v === "__backlog__" ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__backlog__">Backlog</SelectItem>
                  {sprints.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                      {s.status === "active" && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          (active)
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Story Points</Label>
            <StoryPointPicker value={storyPoints} onChange={setStoryPoints} />
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
                  (cannot be edited once task is created)
                </span>
              </Label>
              <MemberPicker
                projectId={projectId}
                initialMembers={initialMembers}
                selected={reporter}
                onSelect={setReporter}
                placeholder="Search reporter..."
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
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
              <Label>Who can edit</Label>
              <Select
                value={editPermission}
                onValueChange={(v) =>
                  setEditPermission(v as typeof editPermission)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anyone">Anyone in project</SelectItem>
                  <SelectItem value="assignee_only">Assignee only</SelectItem>
                  <SelectItem value="reporter_only">Reporter only</SelectItem>
                </SelectContent>
              </Select>
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
            <Label>Attachments</Label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                multiple
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, PNG, JPG, GIF up to 10MB
                </p>
              </label>
            </div>
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      <span className="text-sm">
                        {cleanFilename(file.name)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
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
              {isPending ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
