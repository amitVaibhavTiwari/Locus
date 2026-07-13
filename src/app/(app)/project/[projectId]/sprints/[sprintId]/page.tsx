import { notFound, redirect } from "next/navigation";
import {
  getUserIdFromRequest,
  getOrgIdFromRequest,
  getProject,
  getProjectSprints,
  getSprintIssues,
} from "@/lib/dal";
import { SprintDetailClient } from "./SprintDetailClient";

export default async function SprintDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; sprintId: string }>;
}) {
  const { projectId, sprintId } = await params;

  const userId = await getUserIdFromRequest();
  if (!userId) redirect("/login");

  const orgId = await getOrgIdFromRequest();
  if (!orgId) redirect("/onboarding/workspace");

  const [project, allSprints, issues] = await Promise.all([
    getProject(projectId, orgId, userId),
    getProjectSprints(projectId),
    getSprintIssues(sprintId),
  ]);

  if (!project) notFound();

  const sprint = allSprints.find((s) => s.id === sprintId);
  if (!sprint) notFound();

  const hasActiveSprint = allSprints.some(
    (s) => s.id !== sprintId && s.status === "active",
  );

  return (
    <SprintDetailClient
      projectId={projectId}
      projectName={project.name}
      sprint={sprint}
      issues={issues}
      hasActiveSprint={hasActiveSprint}
    />
  );
}
