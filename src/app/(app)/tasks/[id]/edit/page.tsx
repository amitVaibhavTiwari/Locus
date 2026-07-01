"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
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
  Search,
  ArrowLeft,
  Paperclip,
  FileText,
  Upload,
  Trash2,
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

export default function EditTask() {
  const router = useRouter();
  const { id } = useParams();
  const { toast } = useToast();

  const [taskTitle, setTaskTitle] = useState("Implement JWT Authentication");
  const [description, setDescription] = useState(
    "<p>Add secure JWT-based authentication to the application.</p>",
  );
  const [priority, setPriority] = useState("high");
  const [status, setStatus] = useState("in-progress");
  const [assignee, setAssignee] = useState("2");
  const [reporter] = useState("1");
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  const [labels, setLabels] = useState<string[]>(["Backend", "Security"]);
  const [customLabel, setCustomLabel] = useState("");
  const [epic, setEpic] = useState("1");
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [epicOpen, setEpicOpen] = useState(false);
  const [attachments, setAttachments] = useState<
    { name: string; size: string; date: string }[]
  >([
    { name: "authentication-flow.pdf", size: "245 KB", date: "Mar 2, 2024" },
    { name: "security-requirements.docx", size: "128 KB", date: "Mar 1, 2024" },
  ]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newOnes = Array.from(files).map((f) => ({
      name: f.name,
      size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    }));
    setAttachments((prev) => [...prev, ...newOnes]);
  };

  const removeAttachment = (name: string) => {
    setAttachments((prev) => prev.filter((a) => a.name !== name));
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

    toast({
      title: "Success",
      description: `Task "${taskTitle}" updated successfully!`,
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
          <h1 className="text-3xl font-bold">Edit Task</h1>
          <p className="text-muted-foreground mt-2">
            Update the task details below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pl-2">
          <div className="grid grid-cols-1 gap-4">
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
                placeholder="Describe the task in detail..."
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
                <Label>Epic</Label>
                <div className="flex gap-2">
                  <Popover open={epicOpen} onOpenChange={setEpicOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1 justify-start"
                      >
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
                  {epic && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setEpic("")}
                      title="Clear epic"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
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
                    (cannot be edited)
                  </span>
                </Label>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="w-5 h-5">
                      <AvatarFallback className="text-xs">
                        {teamMembers.find((m) => m.id === reporter)?.initials}
                      </AvatarFallback>
                    </Avatar>
                    {teamMembers.find((m) => m.id === reporter)?.name}
                  </div>
                </Button>
              </div>
            </div>

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

            <div className="space-y-3 pt-2">
              <Label className="flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Attachments
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-md p-6 text-center hover:border-primary/50 cursor-pointer transition-colors"
              >
                <Upload className="w-5 h-5 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">
                  Click to upload or drop files
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add, replace, or remove attachments
                </p>
              </div>
              {attachments.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {attachments.map((file) => (
                    <div
                      key={file.name}
                      className="flex items-center gap-3 p-3 border border-border rounded-md hover:bg-muted/40"
                    >
                      <div className="w-9 h-9 rounded-sm bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {file.size} · {file.date}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAttachment(file.name)}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
