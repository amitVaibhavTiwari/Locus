"use client";
import React, { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
} from "lucide-react";
import { format } from "date-fns";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const teamMembers = [
  {
    id: "1",
    name: "Sarah Johnson",
    initials: "SJ",
    email: "sarah@company.com",
  },
  { id: "2", name: "Mike Harrison", initials: "MH", email: "mike@company.com" },
  { id: "3", name: "Lisa Thompson", initials: "LT", email: "lisa@company.com" },
  { id: "4", name: "Robert Kim", initials: "RK", email: "robert@company.com" },
  { id: "5", name: "Anna Miller", initials: "AM", email: "anna@company.com" },
  { id: "6", name: "John Doe", initials: "JD", email: "john@company.com" },
  { id: "7", name: "Emma Wilson", initials: "EW", email: "emma@company.com" },
];

const epics = [
  { id: "1", name: "User Authentication System" },
  { id: "2", name: "Payment Integration" },
  { id: "3", name: "Dashboard Redesign" },
  { id: "4", name: "Mobile App Development" },
  { id: "5", name: "Performance Optimization" },
];

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

function CreateTaskInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultStatus = searchParams.get("status") || "todo";
  const parentTaskId = searchParams.get("parentTaskId");
  const parentTaskTitle = searchParams.get("parentTaskTitle");

  const [taskTitle, setTaskTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState(defaultStatus);
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [labels, setLabels] = useState<string[]>([]);
  const [customLabel, setCustomLabel] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [epic, setEpic] = useState("");
  const [location, setLocation] = useState("sprint");
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [epicOpen, setEpicOpen] = useState(false);
  const [reporterOpen, setReporterOpen] = useState(false);
  const [reporter, setReporter] = useState(teamMembers[0].id);
  const { toast } = useToast();

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

    toast({
      title: "Success",
      description: `Task "${taskTitle}" created in ${location === "sprint" ? "current sprint" : "backlog"}!`,
    });

    router.back();
  };

  const addLabel = (label: string) => {
    if (label && !labels.includes(label)) {
      setLabels([...labels, label]);
    }
  };

  const removeLabel = (label: string) => {
    setLabels(labels.filter((l) => l !== label));
  };

  const addCustomLabel = () => {
    if (customLabel.trim()) {
      addLabel(customLabel.trim());
      setCustomLabel("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
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
            <h1 className="text-3xl font-bold">
              {parentTaskId ? "Create Subtask" : "Create New Task"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {parentTaskId ? (
                "Fill in the details below to create a subtask."
              ) : (
                <>
                  Project:{" "}
                  <span className="font-semibold">Website Redesign</span>
                </>
              )}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pl-2">
          {parentTaskId && (
            <div className="space-y-2">
              <Label htmlFor="parent">Parent Task</Label>
              <Input
                id="parent"
                value={`${parentTaskId} - ${parentTaskTitle}`}
                disabled
                className="w-full bg-muted"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Enter task title"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <RichTextEditor
              content={description}
              onChange={setDescription}
              placeholder="Describe the task in detail with formatting, lists, links, images and more..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
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
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="qa">QA Review</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sprint">Current Sprint</SelectItem>
                  <SelectItem value="backlog">Backlog</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-xs">
                            {
                              teamMembers.find((m) => m.id === assignee)
                                ?.initials
                            }
                          </AvatarFallback>
                        </Avatar>
                        {teamMembers.find((m) => m.id === assignee)?.name}
                      </div>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Search assignee...
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search person..." />
                    <CommandList>
                      <CommandEmpty>No person found.</CommandEmpty>
                      <CommandGroup>
                        {teamMembers.map((member) => (
                          <CommandItem
                            key={member.id}
                            value={member.name}
                            onSelect={() => {
                              setAssignee(member.id);
                              setAssigneeOpen(false);
                            }}
                          >
                            <Avatar className="w-6 h-6 mr-2">
                              <AvatarFallback className="text-xs">
                                {member.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm">{member.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {member.email}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Reporter
                <span className="text-xs font-normal text-muted-foreground">
                  (cannot be edited once task is created)
                </span>
              </Label>
              <Popover open={reporterOpen} onOpenChange={setReporterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {reporter ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-xs">
                            {
                              teamMembers.find((m) => m.id === reporter)
                                ?.initials
                            }
                          </AvatarFallback>
                        </Avatar>
                        {teamMembers.find((m) => m.id === reporter)?.name}
                      </div>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Search reporter...
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search person..." />
                    <CommandList>
                      <CommandEmpty>No person found.</CommandEmpty>
                      <CommandGroup>
                        {teamMembers.map((member) => (
                          <CommandItem
                            key={member.id}
                            value={member.name}
                            onSelect={() => {
                              setReporter(member.id);
                              setReporterOpen(false);
                            }}
                          >
                            <Avatar className="w-6 h-6 mr-2">
                              <AvatarFallback className="text-xs">
                                {member.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm">{member.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {member.email}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
              <Popover open={epicOpen} onOpenChange={setEpicOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {epic ? (
                      epics.find((e) => e.id === epic)?.name
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Search epic...
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search epic..." />
                    <CommandList>
                      <CommandEmpty>No epic found.</CommandEmpty>
                      <CommandGroup>
                        {epics.map((epicItem) => (
                          <CommandItem
                            key={epicItem.id}
                            value={epicItem.name}
                            onSelect={() => {
                              setEpic(epicItem.id);
                              setEpicOpen(false);
                            }}
                          >
                            {epicItem.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
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
                onKeyPress={(e) =>
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
                      <span className="text-sm">{file.name}</span>
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
            >
              Cancel
            </Button>
            <Button type="submit">Create Task</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateTask() {
  return (
    <Suspense>
      <CreateTaskInner />
    </Suspense>
  );
}
