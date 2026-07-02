import { notFound, redirect } from "next/navigation";
import {
  getSessionUser,
  getActiveOrg,
  getProject,
  getProjectMembers,
  getOrgMembers,
} from "@/lib/dal";
import { ProjectTeamClient } from "./ProjectTeamClient";

export default async function ProjectTeamPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const [user, org] = await Promise.all([getSessionUser(), getActiveOrg()]);
  if (!org || !user) redirect("/onboarding/workspace");

  const [project, projectMembers, orgMembers] = await Promise.all([
    getProject(projectId, org.id, user.id),
    getProjectMembers(projectId),
    getOrgMembers(org.id),
  ]);

  if (!project) notFound();

  const projectMemberUserIds = new Set(projectMembers.map((m) => m.userId));
  const availableMembers = orgMembers
    .filter((m) => !projectMemberUserIds.has(m.userId))
    .map((m) => ({
      userId: m.userId,
      username: m.username,
      email: m.email,
      avatar_url: m.avatar_url,
    }));

  const members = projectMembers.map((m) => ({
    memberId: m.memberId,
    userId: m.userId,
    username: m.username,
    email: m.email,
    avatar_url: m.avatar_url,
    role: m.role,
    joined_at: m.joined_at,
  }));

  return (
    <ProjectTeamClient
      projectId={projectId}
      projectName={project.name}
      projectMembers={members}
      availableMembers={availableMembers}
      currentUserId={user.id}
    />
  );
}
