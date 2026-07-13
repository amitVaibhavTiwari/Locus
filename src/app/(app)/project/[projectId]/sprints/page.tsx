import { notFound, redirect } from "next/navigation";
import {
  getUserIdFromRequest,
  getOrgIdFromRequest,
  getProject,
  getProjectSprints,
} from "@/lib/dal";
import { SprintsClient } from "./SprintsClient";

export default async function SprintsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const userId = await getUserIdFromRequest();
  if (!userId) redirect("/login");

  const orgId = await getOrgIdFromRequest();
  if (!orgId) redirect("/onboarding/workspace");

  const [project, sprints] = await Promise.all([
    getProject(projectId, orgId, userId),
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
