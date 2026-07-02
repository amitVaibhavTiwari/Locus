"use client";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { acceptInvite } from "@/actions/invites";
import { toast } from "sonner";

export function AcceptInviteButton({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();

  const handleAccept = () => {
    startTransition(async () => {
      const result = await acceptInvite(token);
      if (result?.error) toast.error(result.error);
    });
  };

  return (
    <Button onClick={handleAccept} disabled={isPending} className="w-full h-11">
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        "Accept Invitation"
      )}
    </Button>
  );
}
