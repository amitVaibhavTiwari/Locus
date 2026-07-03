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

  return (
    <CreateEpicClient
      projects={projects.map((p) => ({ id: p.id, name: p.name }))}
      defaultProjectId={resolvedProjectId}
      members={orgMembers.map((m) => ({
        id: m.id,
        username: m.username,
        avatar_url: m.avatar_url,
      }))}
      currentUserId={user.id}
    />
  );
}
