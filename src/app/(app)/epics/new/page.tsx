import { redirect } from "next/navigation";
import {
  getSessionUser,
  getActiveOrg,
  getProjects,
  getOrgMembers,
} from "@/lib/dal";
import { CreateEpicClient } from "./CreateEpicClient";

export default async function NewEpicPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { projectId } = await searchParams;

  const [user, org] = await Promise.all([getSessionUser(), getActiveOrg()]);
  if (!org || !user) redirect("/onboarding/workspace");

  const [projects, orgMembers] = await Promise.all([
    getProjects(org.id, user.id),
    getOrgMembers(org.id),
  ]);

  const resolvedProjectId = projectId ?? projects[0]?.id ?? null;
  if (!resolvedProjectId) redirect("/projects");

  const project = projects.find((p) => p.id === resolvedProjectId);
  if (!project) redirect("/projects");

  return (
    <CreateEpicClient
      projectId={resolvedProjectId}
      projectName={project.name}
      members={orgMembers.map((m) => ({
        id: m.id,
        username: m.username,
        avatar_url: m.avatar_url,
      }))}
      currentUserId={user.id}
    />
  );
}
