import { notFound, redirect } from "next/navigation";
import { getSessionUser, getActiveOrg, getProject, getProjectSprints, getSprintIssues } from "@/lib/dal";
import { SprintDetailClient } from "./SprintDetailClient";

export default async function SprintDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; sprintId: string }>;
}) {
  const { projectId, sprintId } = await params;

  const [user, org] = await Promise.all([getSessionUser(), getActiveOrg()]);
  if (!org || !user) redirect("/onboarding/workspace");

  const [project, allSprints, issues] = await Promise.all([
    getProject(projectId, org.id, user.id),
    getProjectSprints(projectId),
    getSprintIssues(sprintId),
  ]);

  if (!project) notFound();

  const sprint = allSprints.find((s) => s.id === sprintId);
  if (!sprint) notFound();

  const hasNextSprint = allSprints.some(
    (s) => s.status === "planned" && s.id !== sprintId,
  );

  return (
    <SprintDetailClient
      projectId={projectId}
      projectName={project.name}
      sprint={sprint}
      issues={issues}
      hasNextSprint={hasNextSprint}
    />
  );
}
