"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  X,
  Flag,
  Search,
  GripVertical,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

interface TaskStatus {
  id: string;
  name: string;
}

function SortableStatusItem({
  status,
  onRemove,
  isOnlyOne,
}: {
  status: TaskStatus;
  onRemove: () => void;
  isOnlyOne: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-2 bg-secondary/50 rounded-md"
    >
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="cursor-move">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <span className="text-sm">{status.name}</span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        disabled={isOnlyOne}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function CreateProject() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("");
  const [priority, setPriority] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [labels, setLabels] = useState<string[]>([
    "Frontend",
    "Backend",
    "UI/UX",
    "Bug",
  ]);
  const [newLabel, setNewLabel] = useState("");
  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>([
    { id: "1", name: "To Do" },
    { id: "2", name: "In Progress" },
    { id: "3", name: "In QA" },
    { id: "4", name: "Done" },
  ]);
  const [newStatus, setNewStatus] = useState("");
  const [allowDeleteTickets, setAllowDeleteTickets] = useState(false);
  const [allowManageSprint, setAllowManageSprint] = useState(true);
  const [allowMembersEdit, setAllowMembersEdit] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTaskStatuses((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `Project "${projectName}" created successfully!`,
    });

    router.push("/projects");
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  };

  const addLabel = () => {
    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
      setLabels([...labels, newLabel.trim()]);
      setNewLabel("");
    }
  };

  const removeLabel = (label: string) => {
    setLabels(labels.filter((l) => l !== label));
  };

  const addStatus = () => {
    if (newStatus.trim()) {
      setTaskStatuses([
        ...taskStatuses,
        { id: Date.now().toString(), name: newStatus.trim() },
      ]);
      setNewStatus("");
    }
  };

  const removeStatus = (id: string) => {
    if (taskStatuses.length > 1) {
      setTaskStatuses(taskStatuses.filter((s) => s.id !== id));
    }
  };

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/projects")}
          className="mb-3 -ml-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Create project
        </h1>
        <p className="text-muted-foreground">
          Set up a workspace for your team — you can change everything later.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>
              Name, description, and visibility for this project.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project name *</Label>
              <Input
                id="name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your project..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority (optional)</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-success" />
                        Low
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-warning" />
                        Medium
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-destructive/70" />
                        High
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle>Team</CardTitle>
            <CardDescription>
              Add people who will collaborate on this project.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="border border-border rounded-md divide-y divide-border bg-card">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant={
                      selectedMembers.includes(member.id)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => toggleMember(member.id)}
                  >
                    {selectedMembers.includes(member.id) ? "Added" : "Add"}
                  </Button>
                </div>
              ))}
            </div>
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedMembers.map((memberId) => {
                  const member = teamMembers.find((m) => m.id === memberId);
                  return member ? (
                    <Badge
                      key={memberId}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {member.name}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => toggleMember(memberId)}
                      />
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle>Labels</CardTitle>
            <CardDescription>
              Reusable tags for categorizing tasks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Add a label..."
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addLabel())
                }
              />
              <Button type="button" onClick={addLabel} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
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
          </CardContent>
        </Card>

        <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle>Workflow</CardTitle>
            <CardDescription>
              Configure the task statuses available on the board.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Add a status..."
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addStatus())
                }
              />
              <Button type="button" onClick={addStatus} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 border border-border rounded-md p-3 bg-card">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={taskStatuses.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {taskStatuses.map((status) => (
                    <SortableStatusItem
                      key={status.id}
                      status={status}
                      onRemove={() => removeStatus(status.id)}
                      isOnlyOne={taskStatuses.length === 1}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>
              Control who can change what inside this project.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="delete-tickets" className="text-sm font-medium">
                  Allow admin to delete tickets
                </Label>
                <p className="text-xs text-muted-foreground">
                  Admins will be able to permanently remove tasks.
                </p>
              </div>
              <Switch
                id="delete-tickets"
                checked={allowDeleteTickets}
                onCheckedChange={setAllowDeleteTickets}
              />
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-0.5">
                <Label htmlFor="manage-sprint" className="text-sm font-medium">
                  Allow admin to manage sprints
                </Label>
                <p className="text-xs text-muted-foreground">
                  Start, end, and extend sprints from the sprint page.
                </p>
              </div>
              <Switch
                id="manage-sprint"
                checked={allowManageSprint}
                onCheckedChange={setAllowManageSprint}
              />
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-0.5">
                <Label htmlFor="members-edit" className="text-sm font-medium">
                  Let assignees & members edit tickets
                </Label>
                <p className="text-xs text-muted-foreground">
                  By default only the reporter and admins can edit a ticket.
                </p>
              </div>
              <Switch
                id="members-edit"
                checked={allowMembersEdit}
                onCheckedChange={setAllowMembersEdit}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit">Create project</Button>
        </div>
      </form>
    </div>
  );
}
