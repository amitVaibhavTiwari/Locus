"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreHorizontal, Archive } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

export default function Epics() {
  const router = useRouter();
  const [showArchived, setShowArchived] = useState(false);

  const epics = [
    {
      id: 1,
      title: "User Authentication System",
      description:
        "Complete overhaul of user authentication with OAuth integration",
      priority: "high",
      status: "in-progress",
      stories: 12,
      completed: 8,
      owners: [
        { name: "John Doe", initials: "JD" },
        { name: "Sarah Wilson", initials: "SW" },
        { name: "Mike Johnson", initials: "MJ" },
      ],
      archived: false,
    },
    {
      id: 2,
      title: "Payment Processing",
      description:
        "Implement secure payment gateway with multiple payment methods",
      priority: "high",
      status: "planned",
      stories: 8,
      completed: 0,
      owners: [
        { name: "Jane Smith", initials: "JS" },
        { name: "Alex Turner", initials: "AT" },
      ],
      archived: false,
    },
    {
      id: 3,
      title: "Mobile Responsiveness",
      description: "Ensure all features work seamlessly on mobile devices",
      priority: "medium",
      status: "planned",
      stories: 15,
      completed: 0,
      owners: [
        { name: "Mike Johnson", initials: "MJ" },
        { name: "Emily Chen", initials: "EC" },
        { name: "David Park", initials: "DP" },
        { name: "Lisa Wang", initials: "LW" },
      ],
      archived: false,
    },
    {
      id: 4,
      title: "API Integration",
      description: "Complete API integration with third-party services",
      priority: "low",
      status: "completed",
      stories: 10,
      completed: 10,
      owners: [{ name: "Sarah Wilson", initials: "SW" }],
      archived: true,
    },
  ];

  const displayedEpics = showArchived
    ? epics.filter((e) => e.archived)
    : epics.filter((e) => !e.archived);

  const handleArchiveEpic = (epic: any) => {
    if (epic.completed !== epic.stories) {
      toast.error("Cannot archive epic", {
        description: "All tickets must be completed before archiving.",
      });
      return;
    }
    toast.success("Epic archived successfully");
  };

  return (
    <div className="w-full max-w-full p-6 space-y-8">
      <div className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70 mb-2">
            Roadmap
          </p>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Epics
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Group related work into product themes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showArchived ? "secondary" : "outline"}
            onClick={() => setShowArchived(!showArchived)}
            className="gap-2"
          >
            <Archive className="w-4 h-4" />
            {showArchived ? "Show Active" : "Show Archived"}
          </Button>
          <Button className="gap-2" onClick={() => router.push("/epics/new")}>
            <Plus className="w-4 h-4" />
            Create Epic
          </Button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search epics..." className="pl-10" />
        </div>
        <Select>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="divide-y divide-border border border-border rounded-md bg-card overflow-hidden">
        {displayedEpics.map((epic) => {
          const percentage = Math.round((epic.completed / epic.stories) * 100);
          const priorityDot =
            epic.priority === "high"
              ? "bg-destructive"
              : epic.priority === "medium"
                ? "bg-warning"
                : "bg-success";
          return (
            <div
              key={epic.id}
              className="group flex items-center gap-6 px-6 py-5 hover:bg-muted/30 cursor-pointer transition-colors"
              onClick={() => router.push(`/epics/${epic.id}`)}
            >
              {/* Progress ring */}
              <div className="relative w-12 h-12 flex-shrink-0">
                <svg className="w-12 h-12 -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 20}`}
                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - percentage / 100)}`}
                    className="text-primary transition-all"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-semibold tabular-nums">
                    {percentage}%
                  </span>
                </div>
              </div>

              {/* Title block */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${priorityDot}`} />
                  <h3 className="text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {epic.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {epic.description}
                </p>
              </div>

              {/* Meta */}
              <div className="hidden md:flex items-center gap-6 flex-shrink-0">
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                    Status
                  </div>
                  <div className="text-sm capitalize text-foreground">
                    {epic.status.replace("-", " ")}
                  </div>
                </div>
                <div className="text-right tabular-nums">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                    Stories
                  </div>
                  <div className="text-sm text-foreground">
                    {epic.completed}/{epic.stories}
                  </div>
                </div>
                <div className="flex flex-col items-start gap-1 min-w-[140px]">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                    Owners
                  </div>
                  <TooltipProvider delayDuration={100}>
                    <div className="flex -space-x-1.5">
                      {epic.owners.slice(0, 4).map((owner, i) => (
                        <Tooltip key={i}>
                          <TooltipTrigger asChild>
                            <Avatar className="w-7 h-7 ring-2 ring-card hover:z-10 hover:scale-110 transition-transform cursor-pointer">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
                                {owner.initials}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>{owner.name}</TooltipContent>
                        </Tooltip>
                      ))}
                      {epic.owners.length > 4 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Avatar className="w-7 h-7 ring-2 ring-card">
                              <AvatarFallback className="text-[10px] bg-muted text-muted-foreground font-medium">
                                +{epic.owners.length - 4}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            {epic.owners
                              .slice(4)
                              .map((o) => o.name)
                              .join(", ")}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TooltipProvider>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/epics/${epic.id}/edit`);
                    }}
                  >
                    Edit Epic
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/epics/${epic.id}`);
                    }}
                  >
                    View Stories
                  </DropdownMenuItem>
                  {!epic.archived && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchiveEpic(epic);
                      }}
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archive Epic
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Delete Epic
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>
    </div>
  );
}
