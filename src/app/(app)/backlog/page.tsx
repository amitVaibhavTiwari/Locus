import { redirect } from "next/navigation";
import {
  getSessionUser,
  getActiveOrg,
  getProjects,
  getBacklogIssues,
  getProjectSprints,
} from "@/lib/dal";
import { BacklogClient } from "./BacklogClient";

export default async function BacklogPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { projectId } = await searchParams;

  const [user, org] = await Promise.all([getSessionUser(), getActiveOrg()]);
  if (!org || !user) redirect("/onboarding/workspace");

  const projects = await getProjects(org.id, user.id);

  const resolvedProjectId = projectId ?? projects[0]?.id ?? null;

  const [issues, sprints] = resolvedProjectId
    ? await Promise.all([
        getBacklogIssues(resolvedProjectId),
        getProjectSprints(resolvedProjectId),
      ])
    : [[], []];

  const plannedOrActiveSprints = sprints.filter(
    (s) => s.status === "planned" || s.status === "active",
  );

  return (
    <BacklogClient
      projects={projects.map((p) => ({ id: p.id, name: p.name }))}
      selectedProjectId={resolvedProjectId}
      issues={issues}
      sprints={plannedOrActiveSprints.map((s) => ({ id: s.id, name: s.name, status: s.status }))}
    />
  );
}
