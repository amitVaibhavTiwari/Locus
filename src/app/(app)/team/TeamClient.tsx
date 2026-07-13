"use client";
import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUserStore } from "@/stores/userStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  UserPlus,
  Search,
  Mail,
  CalendarDays,
  MoreHorizontal,
  Archive,
  Loader2,
} from "lucide-react";
import { inviteTeammates, removeMember } from "@/actions/members";
import { formatDateTime } from "@/lib/date";
import { mapOrgRole } from "@/lib/utils";

interface Member {
  memberId: string;
  userId: string;
  username: string;
  email: string;
  role: "owner" | "admin" | "member" | "viewer";
  joined_at: string;
  avatar_url: string | null;
}

interface TeamClientProps {
  initialMembers: Member[];
  initialHasMore: boolean;
  initialTotal: number;
  allowAdminInvite: boolean;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TeamClient({
  initialMembers,
  initialHasMore,
  initialTotal,
  allowAdminInvite,
}: TeamClientProps) {
  const currentUserId = useUserStore((s) => s.id);
  const currentUserRole = useUserStore((s) => s.orgRole) ?? "member";
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [memberToArchive, setMemberToArchive] = useState<Member | null>(null);
  const [unassignTasks, setUnassignTasks] = useState(false);

  const offsetRef = useRef(initialMembers.length);
  const searchRef = useRef("");
  const roleRef = useRef("all");
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(initialHasMore);
  const sentinelRef = useRef<HTMLDivElement>(null);

  hasMoreRef.current = hasMore;
  loadingRef.current = loading;

  const canInvite =
    currentUserRole === "owner" ||
    (currentUserRole === "admin" && allowAdminInvite);
  const canRemove = currentUserRole === "owner";

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
        const res = await fetch(`/api/org/members?${params}`);
        if (!res.ok) return;
        const data: { members: Member[]; hasMore: boolean; total: number } =
          await res.json();
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
  }, [searchQuery, roleFilter]);

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
        const res = await fetch(`/api/org/members?${params}`);
        if (!res.ok) return;
        const data: { members: Member[]; hasMore: boolean } = await res.json();
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
  }, []);

  const handleInviteMember = () => {
    if (!newMemberEmail.trim() || !newMemberRole) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    startTransition(async () => {
      const result = await inviteTeammates([
        { email: newMemberEmail, role: newMemberRole.toLowerCase() },
      ]);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Invitation sent",
          description: `Invitation sent to ${newMemberEmail}`,
        });
        setNewMemberEmail("");
        setNewMemberRole("");
        setInviteDialogOpen(false);
      }
    });
  };

  const handleArchiveMember = () => {
    if (!memberToArchive) return;
    startTransition(async () => {
      const result = await removeMember(memberToArchive.memberId);
      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Member removed",
          description: `${memberToArchive.username} has been removed from the workspace`,
        });
        setMembers((prev) =>
          prev.filter((m) => m.memberId !== memberToArchive.memberId),
        );
      }
      setMemberToArchive(null);
      setUnassignTasks(false);
      setArchiveDialogOpen(false);
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground">Team</h1>
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold -mb-1.5">
              {total}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">
            Manage your team members and their roles
          </p>
        </div>

        {canInvite && (
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/invites">See Pending Invites</Link>
            </Button>
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to add a new member to your team.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role *</Label>
                    <Select
                      value={newMemberRole}
                      onValueChange={setNewMemberRole}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Member">Member</SelectItem>
                        <SelectItem value="Viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setInviteDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleInviteMember}>
                      Send Invitation
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
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
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {members.map((member) => {
          const isSelf = member.userId === currentUserId;
          const isSuperAdmin = member.role === "owner";
          const showMenu = canRemove && !isSelf && !isSuperAdmin;

          return (
            <div
              key={member.memberId}
              className="flex items-center justify-between p-4 rounded-lg border border-border dark:border-none bg-card hover:bg-muted/50 transition-all duration-200 group"
            >
              <div
                className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
                onClick={() => router.push(`/team/${member.userId}`)}
              >
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="text-xs">
                    {getInitials(member.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground transition-colors">
                      {member.username}
                    </h3>
                    {isSelf && (
                      <span className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">
                        You
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
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
                <span className="text-sm text-muted-foreground w-24 text-right">
                  {mapOrgRole(member.role)}
                </span>

                {showMenu ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          setMemberToArchive(member);
                          setUnassignTasks(false);
                          setArchiveDialogOpen(true);
                        }}
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="w-8 h-8 shrink-0" />
                )}
              </div>
            </div>
          );
        })}

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

      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <span className="block">
                Are you sure you want to remove{" "}
                <span className="font-semibold text-foreground">
                  {memberToArchive?.username}
                </span>{" "}
                from the workspace?
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-2">
            <Checkbox
              id="unassign-tasks"
              checked={unassignTasks}
              onCheckedChange={(checked) =>
                setUnassignTasks(checked as boolean)
              }
            />
            <label
              htmlFor="unassign-tasks"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              Unassign all tasks associated with this member
            </label>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setArchiveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleArchiveMember}>
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
