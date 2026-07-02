import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/AuthShell";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function InvalidInvite({ message }: { message: string }) {
  return (
    <AuthShell>
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-semibold">Invalid Invitation</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        <Link href="/login">
          <Button variant="outline" className="w-full">
            Go to login
          </Button>
        </Link>
      </div>
    </AuthShell>
  );
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await db
    .selectFrom("organization_invitations")
    .where("token", "=", token)
    .where("accepted_at", "is", null)
    .select(["id", "email", "organization_id", "expires_at"])
    .executeTakeFirst();

  if (!invite) {
    return (
      <InvalidInvite message="This invitation link is invalid or has already been accepted." />
    );
  }

  const expiresAt = new Date(invite.expires_at);

  if (expiresAt < new Date()) {
    return <InvalidInvite message="This invitation has expired." />;
  }

  const [org, inviter] = await Promise.all([
    db
      .selectFrom("organizations")
      .where("id", "=", invite.organization_id)
      .select(["name"])
      .executeTakeFirst(),
    db
      .selectFrom("organization_invitations as i")
      .innerJoin("users as u", "u.id", "i.invited_by")
      .where("i.token", "=", token)
      .select(["u.username"])
      .executeTakeFirst(),
  ]);

  const orgName = org?.name ?? "a workspace";
  const inviterName = inviter?.username ?? "Someone";

  // Check if user is already logged in
  const session = await auth();

  if (session?.user?.id) {
    // Check if already a member
    const existing = await db
      .selectFrom("organization_members")
      .where("organization_id", "=", invite.organization_id)
      .where("user_id", "=", session.user.id)
      .select(["id"])
      .executeTakeFirst();

    if (existing) {
      redirect("/dashboard");
    }

    // Auto-accept
    const now = new Date().toISOString();

    await db.transaction().execute(async (trx) => {
      await trx
        .insertInto("organization_members")
        .values({
          id: randomUUID(),
          organization_id: invite.organization_id,
          user_id: session.user.id,
          role: "member",
          joined_at: now,
          last_active_at: now,
        })
        .execute();

      await trx
        .updateTable("organization_invitations")
        .set({ accepted_at: now })
        .where("id", "=", invite.id)
        .execute();

      const prefs = await trx
        .selectFrom("user_preferences")
        .where("user_id", "=", session.user.id)
        .select(["active_organization_id"])
        .executeTakeFirst();

      if (!prefs?.active_organization_id) {
        await trx
          .updateTable("user_preferences")
          .set({
            active_organization_id: invite.organization_id,
            updated_at: now,
          })
          .where("user_id", "=", session.user.id)
          .execute();
      }
    });

    redirect("/dashboard");
  }

  // Not logged in then show invitation card
  const signupUrl = `/signup?invite=${encodeURIComponent(token)}`;
  const loginUrl = `/login?redirect=${encodeURIComponent(`/invite/${token}`)}`;

  return (
    <AuthShell>
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="text-[26px] leading-tight font-semibold tracking-tight">
            You&apos;re invited!
          </h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{inviterName}</span>{" "}
            invited you to join{" "}
            <span className="font-medium text-foreground">{orgName}</span> on
            Locus.
          </p>
        </div>

        <div className="space-y-3">
          <Link href={signupUrl} className="block">
            <Button className="w-full h-11">Create account &amp; join</Button>
          </Link>
          <Link href={loginUrl} className="block">
            <Button variant="outline" className="w-full h-11">
              Sign in to accept
            </Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          This invitation expires on{" "}
          {expiresAt.toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
          .
        </p>
      </div>
    </AuthShell>
  );
}
