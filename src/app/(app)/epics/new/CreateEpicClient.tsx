"use client";
import { useState, useTransition } from "react";
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
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createEpic } from "@/actions/epics";

interface Member {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface CreateEpicClientProps {
  projectId: string;
  projectName: string;
  members: Member[];
  currentUserId: string;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function CreateEpicClient({
  projectId,
  projectName,
  members,
  currentUserId,
}: CreateEpicClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("planned");
  const [ownerId, setOwnerId] = useState(currentUserId || "__none__");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Epic name is required",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.set("project_id", projectId);
    formData.set("name", name.trim());
    formData.set("description", description);
    formData.set("priority", priority);
    formData.set("status", status);
    if (ownerId && ownerId !== "__none__") formData.set("owner_id", ownerId);
    if (startDate) formData.set("start_date", startDate);
    if (endDate) formData.set("end_date", endDate);

    startTransition(async () => {
      const result = await createEpic(undefined, formData);
      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Epic created" });
      router.push(`/project/${projectId}/epics`);
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full py-6 px-4 lg:px-8">
        <div className="mb-8 pl-2">
          <Button
            variant="ghost"
            onClick={() => router.push(`/project/${projectId}/epics`)}
            className="mb-4 hover:bg-transparent text-muted-foreground hover:text-foreground -ml-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Epic</h1>
            <p className="text-muted-foreground mt-2">
              Create a new epic to organize related tasks
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pl-2 ">
          <div className="space-y-2">
            <Label>Project</Label>
            <p className="text-sm font-medium px-3 py-2 bg-muted/50 rounded-md border border-border text-foreground">
              {projectName}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Epic Name *</Label>
            <Input
              id="name"
              placeholder="E.g., User Authentication System"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the epic's goals and scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="highest">Highest</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="none">None</SelectItem>
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
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Owner</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No owner</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-[10px]">
                            {getInitials(m.username)}
                          </AvatarFallback>
                        </Avatar>
                        {m.username}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/project/${projectId}/epics`)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Epic"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
