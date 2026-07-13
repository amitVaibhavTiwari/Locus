import { redirect } from "next/navigation";
import {
  getUserIdFromRequest,
  getOrgIdFromRequest,
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

  const userId = await getUserIdFromRequest();
  if (!userId) redirect("/login");

  const orgId = await getOrgIdFromRequest();
  if (!orgId) redirect("/onboarding/workspace");

  const [projects, orgMembers] = await Promise.all([
    getProjects(orgId, userId),
    getOrgMembers(orgId),
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
      currentUserId={userId}
    />
  );
}
