import { notFound, redirect } from "next/navigation";
import { getSessionUser, getActiveOrg, getProject, getProjectSprints } from "@/lib/dal";
import { SprintsClient } from "./SprintsClient";

export default async function SprintsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const [user, org] = await Promise.all([getSessionUser(), getActiveOrg()]);
  if (!org || !user) redirect("/onboarding/workspace");

  const [project, sprints] = await Promise.all([
    getProject(projectId, org.id, user.id),
    getProjectSprints(projectId),
  ]);

  if (!project) notFound();

  return (
    <SprintsClient
      projectId={projectId}
      projectName={project.name}
      sprints={sprints}
    />
  );
}
