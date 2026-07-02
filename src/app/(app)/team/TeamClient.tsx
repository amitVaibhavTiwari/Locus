"use client";
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { inviteTeammates, removeMember } from "@/actions/members";

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: "Super Admin" | "Admin" | "Member";
  dbRole: "owner" | "admin" | "member";
  initials: string;
  joinDate: string;
}

interface TeamClientProps {
  initialMembers: TeamMember[];
  currentUserId: string;
  currentUserRole: "owner" | "admin" | "member";
  allowAdminInvite: boolean;
}

const MEMBERS_PER_PAGE = 15;

export function TeamClient({
  initialMembers,
  currentUserId,
  currentUserRole,
  allowAdminInvite,
}: TeamClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [memberToArchive, setMemberToArchive] = useState<TeamMember | null>(
    null,
  );
  const [unassignTasks, setUnassignTasks] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const canInvite =
    currentUserRole === "owner" ||
    (currentUserRole === "admin" && allowAdminInvite);
  const canRemove = currentUserRole === "owner";

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredMembers.length / MEMBERS_PER_PAGE);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * MEMBERS_PER_PAGE,
    currentPage * MEMBERS_PER_PAGE,
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

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
      const result = await removeMember(memberToArchive.id);
      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Member removed",
          description: `${memberToArchive.name} has been removed from the workspace`,
        });
        setMembers((prev) => prev.filter((m) => m.id !== memberToArchive.id));
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
          <h1 className="text-3xl font-bold text-foreground">Team</h1>
          <p className="text-muted-foreground mt-1">
            Manage your team members and their roles
          </p>
        </div>

        {canInvite && (
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
                  <Button onClick={handleInviteMember}>Send Invitation</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="Super Admin">Super Admin</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
            <SelectItem value="Member">Member</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {paginatedMembers.map((member) => {
          const isSelf = member.userId === currentUserId;
          const isSuperAdmin = member.dbRole === "owner";
          const showMenu = canRemove && !isSelf && !isSuperAdmin;

          return (
            <div
              key={member.id}
              onClick={() => router.push(`/team/${member.userId}`)}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="text-xs">
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {member.name}
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
                  <span>{new Date(member.joinDate).toLocaleDateString()}</span>
                </div>
                <span className="text-sm text-muted-foreground w-24 text-right">
                  {member.role}
                </span>

                {showMenu ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
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
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
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
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No team members found</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * MEMBERS_PER_PAGE + 1}–
            {Math.min(currentPage * MEMBERS_PER_PAGE, filteredMembers.length)}{" "}
            of {filteredMembers.length} members
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-12 text-center">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <span className="block">
                Are you sure you want to remove{" "}
                <span className="font-semibold text-foreground">
                  {memberToArchive?.name}
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
