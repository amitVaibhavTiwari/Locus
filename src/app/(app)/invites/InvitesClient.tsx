"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Mail,
  CalendarDays,
  Clock,
  XCircle,
  Send,
  Copy,
  Check,
  UserPlus,
} from "lucide-react";
import { cancelInvite, inviteTeammates } from "@/actions/members";
import { formatDateTime } from "@/lib/date";

interface Invite {
  id: string;
  email: string;
  role: "admin" | "member";
  token: string;
  expires_at: string;
  created_at: string;
  invited_by_name: string;
  status: "pending" | "expired";
}

interface InvitesClientProps {
  invites: Invite[];
  currentUserId: string;
}

export function InvitesClient({ invites: initialInvites }: InvitesClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const [invites, setInvites] = useState<Invite[]>(initialInvites);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [inviteToCancel, setInviteToCancel] = useState<Invite | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("");

  const filtered = invites.filter((inv) => {
    const ms =
      inv.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invited_by_name.toLowerCase().includes(searchQuery.toLowerCase());
    const mr = roleFilter === "all" || inv.role === roleFilter;
    const mst = statusFilter === "all" || inv.status === statusFilter;
    return ms && mr && mst;
  });

  const pendingCount = invites.filter((i) => i.status === "pending").length;

  const handleCopyLink = (invite: Invite) => {
    const url = `${window.location.origin}/invite/${invite.token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(invite.id);
      toast({ title: "Invite link copied to clipboard" });
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleCancel = () => {
    if (!inviteToCancel) return;
    startTransition(async () => {
      const result = await cancelInvite(inviteToCancel.id);
      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setInvites((prev) => prev.filter((i) => i.id !== inviteToCancel.id));
        toast({
          title: "Invitation cancelled",
          description: `Invitation to ${inviteToCancel.email} has been cancelled.`,
        });
      }
      setInviteToCancel(null);
      setCancelDialogOpen(false);
    });
  };

  const handleInvite = () => {
    if (!newEmail.trim() || !newRole) return;
    startTransition(async () => {
      const result = await inviteTeammates([
        { email: newEmail.trim(), role: newRole },
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
          description: `Invitation sent to ${newEmail.trim()}`,
        });
        setNewEmail("");
        setNewRole("");
        setInviteDialogOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sent Invites</h1>
          <p className="text-muted-foreground mt-1">
            {pendingCount > 0
              ? `${pendingCount} pending invitation${pendingCount !== 1 ? "s" : ""} awaiting acceptance`
              : "No pending invitations"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 border border-border rounded-lg px-4 py-2">
            <Send className="w-4 h-4" />
            <span>
              {invites.length} total invite{invites.length !== 1 ? "s" : ""}
            </span>
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
                  Send an invitation to add a new member to your workspace.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email Address *</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter email address"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleInvite();
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
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
                  <Button
                    onClick={handleInvite}
                    disabled={!newEmail.trim() || !newRole}
                  >
                    Send Invitation
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by email or invited by..."
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
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center justify-between p-4 rounded-lg border border-border bg-card transition-all duration-200 group"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-full bg-muted/60 border border-border flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-muted-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground truncate">
                    {invite.email}
                  </h3>
                  {invite.status === "expired" && (
                    <Badge
                      variant="outline"
                      className="text-[11px] shrink-0 bg-muted text-muted-foreground border-border"
                    >
                      Expired
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-0.5 flex-wrap">
                  <span className="text-sm text-muted-foreground capitalize">
                    Role: {invite.role === "admin" ? "Admin" : "Member"}
                  </span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>
                      Sent{" "}
                      {formatDateTime(invite.created_at, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {invite.status === "expired" ? "Expired" : "Expires"}{" "}
                      {formatDateTime(invite.expires_at, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Invited by{" "}
                    <span className="font-medium text-foreground">
                      {invite.invited_by_name}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {invite.status === "pending" && (
              <div className="ml-4 shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  onClick={() => handleCopyLink(invite)}
                >
                  {copiedId === invite.id ? (
                    <Check className="w-4 h-4 mr-1.5 text-success" />
                  ) : (
                    <Copy className="w-4 h-4 mr-1.5" />
                  )}
                  {copiedId === invite.id ? "Copied!" : "Copy Link"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setInviteToCancel(invite);
                    setCancelDialogOpen(true);
                  }}
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Send className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {invites.length === 0
                ? "No invitations sent yet."
                : "No invitations match the current filters."}
            </p>
          </div>
        )}
      </div>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Invitation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the invitation sent to{" "}
              <span className="font-semibold text-foreground">
                {inviteToCancel?.email}
              </span>
              ? The invite link will no longer work.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              Keep Invite
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              Cancel Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
