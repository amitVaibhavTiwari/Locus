"use client";
import React, { useState, useTransition } from "react";
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
import { createProject } from "@/actions/projects";

interface OrgMember {
  memberId: string;
  userId: string;
  username: string;
  email: string;
  avatar_url: string | null;
  role: string;
}

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

export function CreateProjectClient({ members }: { members: OrgMember[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [priority, setPriority] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
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
  const [error, setError] = useState<string | null>(null);

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
      setError("Project name is required");
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.set("name", projectName.trim());
    formData.set("description", description.trim());
    formData.set("visibility", visibility);
    formData.set("priority", priority);
    formData.set("memberIds", JSON.stringify(selectedMemberIds));
    formData.set("labels", JSON.stringify(labels));
    formData.set("workflow", JSON.stringify(taskStatuses.map((s) => s.name)));
    formData.set("allowDeleteTickets", allowDeleteTickets ? "1" : "0");
    formData.set("allowManageSprint", allowManageSprint ? "1" : "0");
    formData.set("allowMembersEdit", allowMembersEdit ? "1" : "0");

    startTransition(async () => {
      const result = await createProject(undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      toast({
        title: "Project created",
        description: `"${projectName}" is ready.`,
      });
      router.push(`/project/${result?.projectId}`);
    });
  };

  const toggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const addLabel = () => {
    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
      setLabels([...labels, newLabel.trim()]);
      setNewLabel("");
    }
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

  const filteredMembers = members.filter(
    (m) =>
      m.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()),
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
            {error && <p className="text-sm text-destructive">{error}</p>}
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
                  key={member.userId}
                  className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {member.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{member.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant={
                      selectedMemberIds.includes(member.userId)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => toggleMember(member.userId)}
                  >
                    {selectedMemberIds.includes(member.userId)
                      ? "Added"
                      : "Add"}
                  </Button>
                </div>
              ))}
              {filteredMembers.length === 0 && (
                <p className="text-sm text-muted-foreground px-3 py-4 text-center">
                  No members found
                </p>
              )}
            </div>
            {selectedMemberIds.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedMemberIds.map((userId) => {
                  const member = members.find((m) => m.userId === userId);
                  return member ? (
                    <Badge
                      key={userId}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {member.username}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => toggleMember(userId)}
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
                    onClick={() => setLabels(labels.filter((l) => l !== label))}
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
                id="project-columns-dnd"
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
                      onRemove={() =>
                        taskStatuses.length > 1 &&
                        setTaskStatuses(
                          taskStatuses.filter((s) => s.id !== status.id),
                        )
                      }
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
                <Label className="text-sm font-medium">
                  Allow admin to delete tickets
                </Label>
                <p className="text-xs text-muted-foreground">
                  Admins will be able to permanently remove tasks.
                </p>
              </div>
              <Switch
                checked={allowDeleteTickets}
                onCheckedChange={setAllowDeleteTickets}
              />
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">
                  Allow admin to manage sprints
                </Label>
                <p className="text-xs text-muted-foreground">
                  Start, end, and extend sprints from the sprint page.
                </p>
              </div>
              <Switch
                checked={allowManageSprint}
                onCheckedChange={setAllowManageSprint}
              />
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">
                  Let assignees & members edit tickets
                </Label>
                <p className="text-xs text-muted-foreground">
                  By default only the reporter and admins can edit a ticket.
                </p>
              </div>
              <Switch
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
