import { redirect } from "next/navigation";
import {
  getSessionUser,
  getActiveOrg,
  getProjects,
  getProjectEpics,
} from "@/lib/dal";
import { EpicsClient } from "./EpicsClient";

export default async function EpicsPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { projectId } = await searchParams;

  const [user, org] = await Promise.all([getSessionUser(), getActiveOrg()]);
  if (!org || !user) redirect("/onboarding/workspace");

  const projects = await getProjects(org.id, user.id);
  const resolvedProjectId = projectId ?? projects[0]?.id ?? null;

  const epics = resolvedProjectId
    ? await getProjectEpics(resolvedProjectId)
    : [];

  return (
    <EpicsClient
      projects={projects.map((p) => ({ id: p.id, name: p.name }))}
      selectedProjectId={resolvedProjectId}
      epics={epics}
    />
  );
}
