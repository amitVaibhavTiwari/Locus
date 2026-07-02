import {
  getActiveOrg,
  getOrgMembers,
  getCurrentUserOrgRole,
  verifySession,
} from "@/lib/dal";
import { TeamClient, TeamMember } from "./TeamClient";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function mapRole(
  role: "owner" | "admin" | "member",
): "Super Admin" | "Admin" | "Member" {
  if (role === "owner") return "Super Admin";
  if (role === "admin") return "Admin";
  return "Member";
}

export default async function TeamPage() {
  const [session, org, userRole] = await Promise.all([
    verifySession(),
    getActiveOrg(),
    getCurrentUserOrgRole(),
  ]);
  if (!org) return null;

  const rawMembers = await getOrgMembers(org.id);
  const allowAdminInvite = (org.workspacePrefs?.allow_admin_invite ?? 0) === 1;

  const members: TeamMember[] = rawMembers.map((m) => ({
    id: m.memberId,
    userId: m.userId,
    name: m.username,
    email: m.email,
    role: mapRole(m.role),
    dbRole: m.role,
    initials: getInitials(m.username),
    joinDate: String(m.joined_at),
  }));

  return (
    <TeamClient
      initialMembers={members}
      currentUserId={session.user.id}
      currentUserRole={userRole ?? "member"}
      allowAdminInvite={allowAdminInvite}
    />
  );
}
