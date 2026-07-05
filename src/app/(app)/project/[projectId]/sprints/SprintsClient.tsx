"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createSprint } from "@/actions/sprints";

interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  status: "planned" | "active" | "completed";
  start_date: string | null;
  end_date: string | null;
}

interface SprintsClientProps {
  projectId: string;
  projectName: string;
  sprints: Sprint[];
}

function daysRemaining(endDate: string | null): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function SprintsClient({
  projectId,
  projectName,
  sprints,
}: SprintsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    goal: "",
    startDate: "",
    endDate: "",
  });

  const activeSprint = sprints.find((s) => s.status === "active");
  const plannedSprints = sprints.filter((s) => s.status === "planned");
  const completedSprints = sprints.filter((s) => s.status === "completed");

  const handleCreate = () => {
    if (!form.name.trim()) {
      toast({
        title: "Error",
        description: "Sprint name is required",
        variant: "destructive",
      });
      return;
    }
    if (!form.goal.trim()) {
      toast({
        title: "Error",
        description: "Sprint goal is required",
        variant: "destructive",
      });
      return;
    }
    if (!form.startDate) {
      toast({
        title: "Error",
        description: "Start date is required",
        variant: "destructive",
      });
      return;
    }
    if (!form.endDate) {
      toast({
        title: "Error",
        description: "End date is required",
        variant: "destructive",
      });
      return;
    }
    if (form.endDate < form.startDate) {
      toast({
        title: "Error",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }
    const formData = new FormData();
    formData.set("project_id", projectId);
    formData.set("name", form.name.trim());
    formData.set("goal", form.goal);
    formData.set("start_date", form.startDate);
    formData.set("end_date", form.endDate);

    startTransition(async () => {
      const result = await createSprint(undefined, formData);
      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Sprint created" });
      setForm({ name: "", goal: "", startDate: "", endDate: "" });
      setIsCreateOpen(false);
      router.refresh();
    });
  };

  const SprintCard = ({ sprint }: { sprint: Sprint }) => {
    const days = daysRemaining(sprint.end_date);
    return (
      <Card
        className="cursor-pointer bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200"
        onClick={() =>
          router.push(`/project/${projectId}/sprints/${sprint.id}`)
        }
      >
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="min-w-0">
              <h3 className="font-medium text-foreground">{sprint.name}</h3>
              {sprint.goal && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                  {sprint.goal}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            {(sprint.start_date || sprint.end_date) && (
              <div className="text-right hidden sm:block">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-medium">
                  {sprint.start_date ?? "?"} → {sprint.end_date ?? "?"}
                </p>
              </div>
            )}
            {sprint.status === "active" && days !== null && (
              <div className="text-right hidden md:block">
                <p className="text-xs text-muted-foreground">Days Left</p>
                <p className="text-sm font-medium">{days}</p>
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-transparent"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/project/${projectId}/sprints/${sprint.id}`);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sprints</h1>
          <p className="text-sm text-muted-foreground mt-1">{projectName}</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create New Sprint
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Sprint</DialogTitle>
              <DialogDescription>
                Set up a new sprint for your project
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Sprint Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Sprint 7"
                />
              </div>
              <div className="space-y-2">
                <Label>Goal *</Label>
                <Textarea
                  value={form.goal}
                  onChange={(e) => setForm({ ...form, goal: e.target.value })}
                  placeholder="What will this sprint focus on?"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isPending}>
                {isPending ? "Creating..." : "Create Sprint"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {sprints.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No sprints yet</p>
          <p className="text-sm mt-1">
            Create your first sprint to get started.
          </p>
        </div>
      )}

      {activeSprint && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Active Sprint
          </h2>
          <SprintCard sprint={activeSprint} />
        </div>
      )}

      {plannedSprints.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Planned
          </h2>
          <div className="space-y-3">
            {plannedSprints.map((s) => (
              <SprintCard key={s.id} sprint={s} />
            ))}
          </div>
        </div>
      )}

      {completedSprints.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Completed
          </h2>
          <div className="space-y-3">
            {completedSprints.map((s) => (
              <SprintCard key={s.id} sprint={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
