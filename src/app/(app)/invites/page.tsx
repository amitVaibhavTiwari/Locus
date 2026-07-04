import { redirect } from "next/navigation";
import { getActiveOrg, getCurrentUserOrgRole, verifySession } from "@/lib/dal";
import { db } from "@/lib/db";
import { InvitesClient } from "./InvitesClient";

export default async function InvitesPage() {
  const [session, org, userRole] = await Promise.all([
    verifySession(),
    getActiveOrg(),
    getCurrentUserOrgRole(),
  ]);

  if (!org) redirect("/onboarding/workspace");
  if (userRole !== "owner") redirect("/dashboard");

  //  all non-accepted invitations with inviter info
  const inviteRows = await db
    .selectFrom("organization_invitations")
    .leftJoin("users", "users.id", "organization_invitations.invited_by")
    .where("organization_invitations.organization_id", "=", org.id)
    .where("organization_invitations.accepted_at", "is", null)
    .select([
      "organization_invitations.id",
      "organization_invitations.email",
      "organization_invitations.role",
      "organization_invitations.token",
      "organization_invitations.expires_at",
      "organization_invitations.created_at",
      "users.username as invited_by_name",
    ])
    .orderBy("organization_invitations.created_at", "desc")
    .execute();

  const now = new Date();

  const invites = inviteRows.map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role as "admin" | "member",
    token: row.token,
    expires_at: row.expires_at,
    created_at: row.created_at,
    invited_by_name: row.invited_by_name ?? "Unknown",
    status: (new Date(row.expires_at) > now ? "pending" : "expired") as
      | "pending"
      | "expired",
  }));

  return <InvitesClient invites={invites} currentUserId={session.user.id} />;
}
