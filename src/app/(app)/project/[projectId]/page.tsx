import { notFound, redirect } from "next/navigation";
import {
  getUserIdFromRequest,
  getOrgIdFromRequest,
  getProject,
  getPinnedProjects,
  getProjectBoard,
  getProjectMembers,
  getActiveSprint,
} from "@/lib/dal";
import { ProjectBoardClient } from "./ProjectBoardClient";

export default async function ProjectBoardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const userId = await getUserIdFromRequest();
  if (!userId) redirect("/login");

  const orgId = await getOrgIdFromRequest();
  if (!orgId) redirect("/onboarding/workspace");

  const [project, pinnedProjects, board, projectMembers, activeSprint] =
    await Promise.all([
      getProject(projectId, orgId, userId),
      getPinnedProjects(userId, orgId),
      getProjectBoard(projectId),
      getProjectMembers(projectId),
      getActiveSprint(projectId),
    ]);

  if (!project) notFound();

  const pinnedIds = pinnedProjects.map((p) => p.id);

  const boardColumns = (board?.columns ?? [])
    .filter((c) => c.key)
    .map((c) => ({ id: c.key!, title: c.name }));

  const members = projectMembers.map((m) => ({
    id: m.userId,
    username: m.username,
  }));

  return (
    <ProjectBoardClient
      projectId={project.id}
      projectName={project.name}
      pinnedIds={pinnedIds}
      boardColumns={boardColumns}
      projectMembers={members}
      activeSprintId={activeSprint?.id ?? null}
    />
  );
}
