"use client";
import React, { useState } from "react";
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

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Super Admin" | "Admin" | "Member";
  initials: string;
  joinDate: string;
}

const teamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah@company.com",
    role: "Super Admin",
    initials: "SJ",
    joinDate: "2023-01-15",
  },
  {
    id: "2",
    name: "Mike Harrison",
    email: "mike@company.com",
    role: "Member",
    initials: "MH",
    joinDate: "2023-03-20",
  },
  {
    id: "3",
    name: "Lisa Thompson",
    email: "lisa@company.com",
    role: "Member",
    initials: "LT",
    joinDate: "2023-06-10",
  },
  {
    id: "4",
    name: "Robert Kim",
    email: "robert@company.com",
    role: "Member",
    initials: "RK",
    joinDate: "2023-02-28",
  },
  {
    id: "5",
    name: "Anna Miller",
    email: "anna@company.com",
    role: "Admin",
    initials: "AM",
    joinDate: "2023-08-05",
  },
  {
    id: "6",
    name: "David Chen",
    email: "david@company.com",
    role: "Member",
    initials: "DC",
    joinDate: "2023-09-12",
  },
  {
    id: "7",
    name: "Emily Davis",
    email: "emily@company.com",
    role: "Member",
    initials: "ED",
    joinDate: "2023-10-01",
  },
  {
    id: "8",
    name: "James Wilson",
    email: "james@company.com",
    role: "Admin",
    initials: "JW",
    joinDate: "2023-11-15",
  },
  {
    id: "9",
    name: "Olivia Brown",
    email: "olivia@company.com",
    role: "Member",
    initials: "OB",
    joinDate: "2024-01-08",
  },
  {
    id: "10",
    name: "Daniel Garcia",
    email: "daniel@company.com",
    role: "Member",
    initials: "DG",
    joinDate: "2024-02-14",
  },
  {
    id: "11",
    name: "Sophia Martinez",
    email: "sophia@company.com",
    role: "Member",
    initials: "SM",
    joinDate: "2024-03-22",
  },
  {
    id: "12",
    name: "William Taylor",
    email: "william@company.com",
    role: "Member",
    initials: "WT",
    joinDate: "2024-04-10",
  },
  {
    id: "13",
    name: "Ava Anderson",
    email: "ava@company.com",
    role: "Member",
    initials: "AA",
    joinDate: "2024-05-05",
  },
  {
    id: "14",
    name: "Lucas Thomas",
    email: "lucas@company.com",
    role: "Member",
    initials: "LT",
    joinDate: "2024-06-18",
  },
];

const Team = () => {
  const router = useRouter();
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
  const { toast } = useToast();

  const MEMBERS_PER_PAGE = 10;

  const filteredMembers = teamMembers.filter((member) => {
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
    toast({
      title: "Invitation sent",
      description: `Invitation sent to ${newMemberEmail}`,
    });
    setNewMemberEmail("");
    setNewMemberRole("");
    setInviteDialogOpen(false);
  };

  const handleArchiveMember = () => {
    if (memberToArchive) {
      toast({
        title: "Member archived",
        description: `${memberToArchive.name} has been archived${unassignTasks ? " and all tasks have been unassigned" : ""}`,
      });
      setMemberToArchive(null);
      setUnassignTasks(false);
      setArchiveDialogOpen(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team</h1>
          <p className="text-muted-foreground mt-1">
            Manage your team members and their roles
          </p>
        </div>

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
                <Select value={newMemberRole} onValueChange={setNewMemberRole}>
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
      </div>

      {/* Filters */}
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

      {/* Team Members List */}
      <div className="space-y-3">
        {paginatedMembers.map((member) => (
          <div
            key={member.id}
            onClick={() => router.push(`/team/${member.id}`)}
            className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="text-xs">
                  {member.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {member.name}
                </h3>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground hidden md:flex">
                <CalendarDays className="w-4 h-4" />
                <span>{new Date(member.joinDate).toLocaleDateString()}</span>
              </div>
              <span className="text-sm text-muted-foreground w-24 text-right">
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
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMemberToArchive(member);
                      setUnassignTasks(false);
                      setArchiveDialogOpen(true);
                    }}
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    Archive Member
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
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
            <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
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

      {/* Archive Member Confirmation Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Team Member</DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <span className="block">
                Are you sure you want to archive{" "}
                <span className="font-semibold text-foreground">
                  {memberToArchive?.name}
                </span>
                ?
              </span>
              <span className="block text-destructive">
                All tasks associated with this member must be either cleared or
                unassigned before archiving.
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
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
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
              Archive Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Team;
