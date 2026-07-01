"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Users,
  Flag,
  Search,
  GripVertical,
  Trash2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CreateProjectDialogProps {
  trigger: React.ReactNode;
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

export function CreateProjectDialog({ trigger }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
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
  const [taskStatuses, setTaskStatuses] = useState([
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

    setOpen(false);
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

  const useDefaultLabels = () => {
    setLabels(["Frontend", "Backend", "UI/UX", "Bug"]);
    toast({
      title: "Default labels applied",
      description: "Project will use default labels",
    });
  };

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new project.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-180px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
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
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project Visibility</Label>
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
                <Label>Project Priority (Optional)</Label>
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

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Team Members
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-md"
                />
              </div>
              <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 hover:bg-secondary/50 rounded-md"
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
                <div className="flex flex-wrap gap-2">
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
            </div>

            <div className="space-y-3">
              <Label>Project Labels</Label>
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
            </div>

            <div className="space-y-3">
              <Label>Task Status</Label>
              <p className="text-xs text-muted-foreground">
                Once project is created, the status cannot be edited
              </p>
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
              <div className="space-y-2 border rounded-lg p-3">
                {taskStatuses.map((status) => (
                  <div
                    key={status.id}
                    className="flex items-center justify-between p-2 bg-secondary/50 rounded-md cursor-move hover:bg-secondary"
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{status.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeStatus(status.id);
                      }}
                      disabled={taskStatuses.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <Label>Project Settings</Label>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="delete-tickets"
                    className="text-sm font-normal"
                  >
                    Allow tickets to be deleted by admin
                  </Label>
                </div>
                <Switch
                  id="delete-tickets"
                  checked={allowDeleteTickets}
                  onCheckedChange={setAllowDeleteTickets}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="manage-sprint"
                    className="text-sm font-normal"
                  >
                    Allow Admin to manage sprint start, end, extend etc
                  </Label>
                </div>
                <Switch
                  id="manage-sprint"
                  checked={allowManageSprint}
                  onCheckedChange={setAllowManageSprint}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="members-edit" className="text-sm font-normal">
                    Allow assignee and members to edit ticket
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    (by default tickets will be only editable by Reporter and
                    admins)
                  </p>
                </div>
                <Switch
                  id="members-edit"
                  checked={allowMembersEdit}
                  onCheckedChange={setAllowMembersEdit}
                />
              </div>
            </div>
          </form>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/90"
          >
            Create Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
