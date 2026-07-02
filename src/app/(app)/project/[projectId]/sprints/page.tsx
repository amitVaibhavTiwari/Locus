"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, Edit, Trash2 } from "lucide-react";
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

const projectNames: Record<string, string> = {
  "1": "E-commerce Platform",
  "2": "Mobile App Redesign",
  "3": "Dashboard Analytics",
  "4": "Marketing Website",
};

interface Sprint {
  id: string;
  name: string;
  description: string;
  status: "active" | "upcoming" | "completed";
  startDate: string;
  endDate: string;
  totalTasks: number;
  completedTasks: number;
  daysRemaining?: number;
}

const initialSprints: Sprint[] = [
  {
    id: "1",
    name: "Sprint 5",
    description: "User authentication and dashboard features",
    status: "active",
    startDate: "2024-12-01",
    endDate: "2024-12-30",
    totalTasks: 15,
    completedTasks: 8,
    daysRemaining: 10,
  },
  {
    id: "2",
    name: "Sprint 6",
    description: "API integrations and payment processing",
    status: "upcoming",
    startDate: "2025-01-01",
    endDate: "2025-01-28",
    totalTasks: 12,
    completedTasks: 0,
  },
  {
    id: "3",
    name: "Sprint 4",
    description: "Initial setup and database design",
    status: "completed",
    startDate: "2024-11-01",
    endDate: "2024-11-30",
    totalTasks: 18,
    completedTasks: 18,
  },
  {
    id: "4",
    name: "Sprint 3",
    description: "Requirements gathering and planning",
    status: "completed",
    startDate: "2024-10-01",
    endDate: "2024-10-31",
    totalTasks: 10,
    completedTasks: 10,
  },
];

const Sprints = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const [sprints, setSprints] = useState<Sprint[]>(initialSprints);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSprint, setNewSprint] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  if (!projectId || !projectNames[projectId]) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Project Not Found
          </h1>
          <p className="text-muted-foreground mt-2">
            The requested project could not be found.
          </p>
        </div>
      </div>
    );
  }

  const projectName = projectNames[projectId];

  const handleCreateSprint = () => {
    const sprint: Sprint = {
      id: String(sprints.length + 1),
      name: newSprint.name,
      description: newSprint.description,
      status: "upcoming",
      startDate: newSprint.startDate,
      endDate: newSprint.endDate,
      totalTasks: 0,
      completedTasks: 0,
    };
    setSprints([...sprints, sprint]);
    setNewSprint({ name: "", description: "", startDate: "", endDate: "" });
    setIsCreateOpen(false);
  };

  const activeSprint = sprints.find((s) => s.status === "active");
  const upcomingSprints = sprints.filter((s) => s.status === "upcoming");
  const completedSprints = sprints.filter((s) => s.status === "completed");

  return (
    <div className="p-6">
      {/* Header */}
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
                <Label htmlFor="name">Sprint Name</Label>
                <Input
                  id="name"
                  value={newSprint.name}
                  onChange={(e) =>
                    setNewSprint({ ...newSprint, name: e.target.value })
                  }
                  placeholder="e.g., Sprint 7"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newSprint.description}
                  onChange={(e) =>
                    setNewSprint({ ...newSprint, description: e.target.value })
                  }
                  placeholder="What will this sprint focus on?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newSprint.startDate}
                    onChange={(e) =>
                      setNewSprint({ ...newSprint, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newSprint.endDate}
                    onChange={(e) =>
                      setNewSprint({ ...newSprint, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSprint}>Create Sprint</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Sprint */}
      {activeSprint && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Active Sprint
          </h2>
          <Card
            className="cursor-pointer bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200"
            onClick={() =>
              router.push(`/project/${projectId}/sprint/${activeSprint.id}`)
            }
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-6 flex-1">
                <div className="relative w-14 h-14 flex-shrink-0">
                  <svg
                    className="w-14 h-14 transform -rotate-90"
                    viewBox="0 0 56 56"
                  >
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="text-muted/30"
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeDasharray={2 * Math.PI * 24}
                      strokeDashoffset={
                        2 *
                        Math.PI *
                        24 *
                        (1 -
                          activeSprint.completedTasks / activeSprint.totalTasks)
                      }
                      strokeLinecap="round"
                      className="text-primary"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-semibold">
                      {Math.round(
                        (activeSprint.completedTasks /
                          activeSprint.totalTasks) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">
                    {activeSprint.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {activeSprint.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-medium">
                    {activeSprint.startDate} - {activeSprint.endDate}
                  </p>
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-xs text-muted-foreground">Tasks</p>
                  <p className="text-sm font-medium">
                    {activeSprint.completedTasks}/{activeSprint.totalTasks}
                  </p>
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-xs text-muted-foreground">Days Left</p>
                  <p className="text-sm font-medium">
                    {activeSprint.daysRemaining}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
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
                        router.push(
                          `/project/${projectId}/sprint/${activeSprint.id}`,
                        );
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
        </div>
      )}

      {/* Upcoming Sprints */}
      {upcomingSprints.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Upcoming Sprints
          </h2>
          <div className="space-y-3">
            {upcomingSprints.map((sprint) => (
              <Card
                key={sprint.id}
                className="cursor-pointer bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200"
                onClick={() =>
                  router.push(`/project/${projectId}/sprint/${sprint.id}`)
                }
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-medium text-foreground">
                        {sprint.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {sprint.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="text-sm font-medium">
                        {sprint.startDate} - {sprint.endDate}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
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
                            router.push(
                              `/project/${projectId}/sprint/${sprint.id}`,
                            );
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Sprints */}
      {completedSprints.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Completed Sprints
          </h2>
          <div className="space-y-3">
            {completedSprints.map((sprint) => (
              <Card
                key={sprint.id}
                className="cursor-pointer bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200"
                onClick={() =>
                  router.push(`/project/${projectId}/sprint/${sprint.id}`)
                }
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-medium text-foreground">
                        {sprint.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {sprint.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="text-sm font-medium">
                        {sprint.startDate} - {sprint.endDate}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
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
                            router.push(
                              `/project/${projectId}/sprint/${sprint.id}`,
                            );
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sprints;
