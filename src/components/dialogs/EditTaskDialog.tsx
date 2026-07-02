"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { CalendarIcon, X, Search } from "lucide-react";
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

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: {
    title: string;
    description: string;
    priority: string;
    status: string;
    assignee: string;
    reporter: string;
    dueDate?: Date;
    labels: string[];
    epic: string;
  };
}

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

export function EditTaskDialog({
  open,
  onOpenChange,
  task,
}: EditTaskDialogProps) {
  const [taskTitle, setTaskTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState(task.priority);
  const [status, setStatus] = useState(task.status);
  const [assignee, setAssignee] = useState(task.assignee);
  const [dueDate, setDueDate] = useState<Date | undefined>(task.dueDate);
  const [labels, setLabels] = useState<string[]>(task.labels);
  const [customLabel, setCustomLabel] = useState("");
  const [epic, setEpic] = useState(task.epic);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [epicOpen, setEpicOpen] = useState(false);
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
      description: `Task "${taskTitle}" updated successfully!`,
    });

    onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Update the task details below.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                        {
                          teamMembers.find((m) => m.id === task.reporter)
                            ?.initials
                        }
                      </AvatarFallback>
                    </Avatar>
                    {teamMembers.find((m) => m.id === task.reporter)?.name}
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
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
