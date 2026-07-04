"use client";
import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  UserPlus,
  Search,
  Check,
  Mail,
  CalendarDays,
  MoreHorizontal,
  UserMinus,
  Shield,
  Loader2,
} from "lucide-react";
import {
  addProjectMember,
  removeProjectMember,
  changeProjectMemberRole,
} from "@/actions/project-team";
import { formatDateTime } from "@/lib/date";

interface ProjectMember {
  memberId: string;
  userId: string;
  username: string;
  email: string;
  avatar_url: string | null;
  role: string;
  joined_at: string;
}

interface AvailableMember {
  userId: string;
  username: string;
  email: string;
  avatar_url: string | null;
}

interface ProjectTeamClientProps {
  projectId: string;
  projectName: string;
  initialMembers: ProjectMember[];
  initialHasMore: boolean;
  initialTotal: number;
  availableMembers: AvailableMember[];
  currentUserId: string;
}

function getInitials(username: string) {
  return username
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProjectTeamClient({
  projectId,
  projectName,
  initialMembers,
  initialHasMore,
  initialTotal,
  availableMembers: initialAvailableMembers,
  currentUserId,
}: ProjectTeamClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const [members, setMembers] = useState<ProjectMember[]>(initialMembers);
  const [available, setAvailable] = useState<AvailableMember[]>(
    initialAvailableMembers,
  );
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [addRole, setAddRole] = useState<"manager" | "member">("member");

  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<ProjectMember | null>(
    null,
  );
  const [unassignTasksOnRemove, setUnassignTasksOnRemove] = useState(false);

  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [memberToChangeRole, setMemberToChangeRole] =
    useState<ProjectMember | null>(null);
  const [newRole, setNewRole] = useState<"manager" | "member">("member");

  const offsetRef = useRef(initialMembers.length);
  const searchRef = useRef("");
  const roleRef = useRef("all");
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(initialHasMore);
  const sentinelRef = useRef<HTMLDivElement>(null);

  hasMoreRef.current = hasMore;
  loadingRef.current = loading;

  useEffect(() => {
    const t = setTimeout(async () => {
      searchRef.current = searchQuery;
      roleRef.current = roleFilter;
      offsetRef.current = 0;
      setLoading(true);
      loadingRef.current = true;
      try {
        const params = new URLSearchParams({ offset: "0" });
        if (searchQuery) params.set("search", searchQuery);
        if (roleFilter !== "all") params.set("role", roleFilter);
        const res = await fetch(`/api/projects/${projectId}/members?${params}`);
        if (!res.ok) return;
        const data: {
          members: ProjectMember[];
          hasMore: boolean;
          total: number;
        } = await res.json();
        setMembers(data.members);
        setHasMore(data.hasMore);
        setTotal(data.total);
        hasMoreRef.current = data.hasMore;
        offsetRef.current = data.members.length;
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, roleFilter, projectId]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const loadMore = async () => {
      if (loadingRef.current || !hasMoreRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const params = new URLSearchParams({
          offset: String(offsetRef.current),
        });
        if (searchRef.current) params.set("search", searchRef.current);
        if (roleRef.current !== "all") params.set("role", roleRef.current);
        const res = await fetch(`/api/projects/${projectId}/members?${params}`);
        if (!res.ok) return;
        const data: { members: ProjectMember[]; hasMore: boolean } =
          await res.json();
        setMembers((prev) => [...prev, ...data.members]);
        setHasMore(data.hasMore);
        hasMoreRef.current = data.hasMore;
        offsetRef.current += data.members.length;
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1, rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [projectId]);

  const handleAddMember = () => {
    if (!selectedUserId) {
      toast({
        title: "Error",
        description: "Please select a team member",
        variant: "destructive",
      });
      return;
    }
    const member = available.find((m) => m.userId === selectedUserId);
    if (!member) return;

    startTransition(async () => {
      const result = await addProjectMember(projectId, selectedUserId, addRole);
      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      setMembers((prev) => [
        ...prev,
        {
          memberId: "",
          userId: member.userId,
          username: member.username,
          email: member.email,
          avatar_url: member.avatar_url,
          role: addRole,
          joined_at: new Date().toISOString(),
        },
      ]);
      setAvailable((prev) => prev.filter((m) => m.userId !== selectedUserId));
      toast({
        title: "Member added",
        description: `${member.username} has been added to the project`,
      });
      setSelectedUserId("");
      setAddRole("member");
      setAddMemberOpen(false);
      router.refresh();
    });
  };

  const handleRemoveMember = () => {
    if (!memberToRemove) return;
    const name = memberToRemove.username;
    startTransition(async () => {
      const result = await removeProjectMember(
        projectId,
        memberToRemove.userId,
        unassignTasksOnRemove,
      );
      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        setRemoveDialogOpen(false);
        return;
      }
      setMembers((prev) =>
        prev.filter((m) => m.userId !== memberToRemove.userId),
      );
      setAvailable((prev) => [
        ...prev,
        {
          userId: memberToRemove.userId,
          username: memberToRemove.username,
          email: memberToRemove.email,
          avatar_url: memberToRemove.avatar_url,
        },
      ]);
      toast({
        title: "Member removed",
        description: `${name} has been removed from the project${unassignTasksOnRemove ? " and all tasks have been unassigned" : ""}`,
      });
      setMemberToRemove(null);
      setUnassignTasksOnRemove(false);
      setRemoveDialogOpen(false);
      router.refresh();
    });
  };

  const handleChangeRole = () => {
    if (!memberToChangeRole) return;
    const name = memberToChangeRole.username;
    startTransition(async () => {
      const result = await changeProjectMemberRole(
        projectId,
        memberToChangeRole.userId,
        newRole,
      );
      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        setChangeRoleDialogOpen(false);
        return;
      }
      setMembers((prev) =>
        prev.map((m) =>
          m.userId === memberToChangeRole.userId ? { ...m, role: newRole } : m,
        ),
      );
      toast({
        title: "Role updated",
        description: `${name}'s role has been changed to ${newRole}`,
      });
      setMemberToChangeRole(null);
      setChangeRoleDialogOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-2 -ml-4 hover:bg-transparent text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">
              {projectName} - Team
            </h1>
            <span className="flex items-center justify-center min-w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold px-2">
              {total}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">
            Manage team members for this project
          </p>
        </div>

        <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Member to Project</DialogTitle>
              <DialogDescription>
                Select a team member to add to this project.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Popover open={commandOpen} onOpenChange={setCommandOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedUserId
                      ? (available.find((m) => m.userId === selectedUserId)
                          ?.username ?? "Select team member...")
                      : "Select team member..."}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search team members..." />
                    <CommandList>
                      <CommandEmpty>No team member found.</CommandEmpty>
                      <CommandGroup>
                        {available.map((member) => (
                          <CommandItem
                            key={member.userId}
                            value={member.username}
                            onSelect={() => {
                              setSelectedUserId(member.userId);
                              setCommandOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${selectedUserId === member.userId ? "opacity-100" : "opacity-0"}`}
                            />
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                {member.avatar_url && (
                                  <AvatarImage src={member.avatar_url} />
                                )}
                                <AvatarFallback className="text-xs">
                                  {getInitials(member.username)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-sm font-medium">
                                  {member.username}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {member.email}
                                </div>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={addRole}
                  onValueChange={(v) => setAddRole(v as "manager" | "member")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {addRole === "manager"
                    ? "Managers can add/remove members and change roles"
                    : "Members can view and contribute to the project"}
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setAddMemberOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddMember}>Add Member</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.userId}
            onClick={() => router.push(`/team/${member.userId}`)}
            className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Avatar className="w-8 h-8 flex-shrink-0">
                {member.avatar_url && <AvatarImage src={member.avatar_url} />}
                <AvatarFallback className="text-xs">
                  {getInitials(member.username)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {member.username}
                  {member.userId === currentUserId && (
                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                      (you)
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="w-4 h-4" />
                <span>
                  {formatDateTime(member.joined_at, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <span className="text-sm text-muted-foreground w-20 text-right capitalize">
                {member.role}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setMemberToChangeRole(member);
                      setNewRole(
                        member.role === "manager" ? "manager" : "member",
                      );
                      setChangeRoleDialogOpen(true);
                    }}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Change Role
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMemberToRemove(member);
                      setUnassignTasksOnRemove(false);
                      setRemoveDialogOpen(true);
                    }}
                  >
                    <UserMinus className="w-4 h-4 mr-2" />
                    Remove from Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}

        {!loading && members.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No team members found
            </p>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />

      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <span className="block">
                Are you sure you want to remove{" "}
                <span className="font-semibold text-foreground">
                  {memberToRemove?.username}
                </span>{" "}
                from this project?
              </span>
              <span className="block text-destructive">
                All tasks associated with this member must be either cleared or
                unassigned before removing.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-2">
            <Checkbox
              id="unassign-tasks-remove"
              checked={unassignTasksOnRemove}
              onCheckedChange={(checked) =>
                setUnassignTasksOnRemove(checked as boolean)
              }
            />
            <label
              htmlFor="unassign-tasks-remove"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              Unassign all tasks associated with this member
            </label>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRemoveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveMember}>
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={changeRoleDialogOpen}
        onOpenChange={setChangeRoleDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Update the role for{" "}
              <span className="font-semibold text-foreground">
                {memberToChangeRole?.username}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={newRole}
              onValueChange={(v) => setNewRole(v as "manager" | "member")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setChangeRoleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleChangeRole}>Update Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
