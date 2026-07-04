import { notFound, redirect } from "next/navigation";
import {
  getSessionUser,
  getActiveOrg,
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

  const [user, org] = await Promise.all([getSessionUser(), getActiveOrg()]);
  if (!org || !user) redirect("/onboarding/workspace");

  const [project, pinnedProjects, board, projectMembers, activeSprint] =
    await Promise.all([
      getProject(projectId, org.id, user.id),
      getPinnedProjects(user.id, org.id),
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
