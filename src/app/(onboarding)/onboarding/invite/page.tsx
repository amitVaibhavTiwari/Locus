"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthShell } from "@/components/auth/AuthShell";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { inviteTeammates } from "@/actions/members";

interface Invite {
  id: number;
  email: string;
  role: string;
}

const INITIAL: Invite[] = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  email: "",
  role: "member",
}));

export default function InviteTeammates() {
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>(INITIAL);
  const [isPending, startTransition] = useTransition();

  const update = (id: number, patch: Partial<Invite>) =>
    setInvites((arr) => arr.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const validCount = invites.filter((i) => i.email.trim()).length;

  const send = () => {
    if (!validCount) return toast.error("Add at least one teammate");

    const valid = invites
      .filter((i) => i.email.trim())
      .map((i) => ({ email: i.email, role: i.role }));

    startTransition(async () => {
      const result = await inviteTeammates(valid);
      if (result.error) {
        toast.error(result.error);
      } else {
        const count = result.successCount ?? 0;
        toast.success(
          count > 0
            ? `Invitations sent to ${count} teammate${count > 1 ? "s" : ""}`
            : "All invitations were already sent",
        );
        router.push("/dashboard");
      }
    });
  };

  return (
    <AuthShell>
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Step 2 of 2
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Invite your teammates
          </h1>
          <p className="text-sm text-muted-foreground">
            Work happens best with your team. Invite them to your workspace now.
          </p>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_140px] gap-3 text-xs font-medium text-muted-foreground">
            <span>Email</span>
            <span>Role</span>
          </div>
          {invites.map((inv) => (
            <div
              key={inv.id}
              className="grid grid-cols-[1fr_140px] gap-3 items-center"
            >
              <Input
                type="email"
                value={inv.email}
                onChange={(e) => update(inv.id, { email: e.target.value })}
                placeholder="name@company.com"
              />
              <Select
                value={inv.role}
                onValueChange={(v) => update(inv.id, { role: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-2">
          <Button onClick={send} disabled={isPending} className="w-full">
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : validCount > 0 ? (
              `Send ${validCount} invitation${validCount > 1 ? "s" : ""}`
            ) : (
              "Send invitations"
            )}
          </Button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => router.push("/dashboard")}
            className="block mx-auto text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            I&apos;ll do it later
          </button>
        </div>
      </div>
    </AuthShell>
  );
}
