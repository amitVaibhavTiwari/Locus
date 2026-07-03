import { notFound, redirect } from "next/navigation";
import {
  getSessionUser,
  getActiveOrg,
  getProject,
  getPinnedProjects,
  getProjectIssues,
  getProjectBoard,
  getProjectMembers,
  getActiveSprint,
} from "@/lib/dal";
import { ProjectBoardClient } from "./ProjectBoardClient";
import type { Task } from "@/components/kanban/KanbanBoard";

function getInitials(username: string): string {
  return username
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function ProjectBoardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const [user, org] = await Promise.all([getSessionUser(), getActiveOrg()]);
  if (!org || !user) redirect("/onboarding/workspace");

  const [project, pinnedProjects, rawIssues, board, projectMembers, activeSprint] =
    await Promise.all([
      getProject(projectId, org.id, user.id),
      getPinnedProjects(user.id, org.id),
      getProjectIssues(projectId),
      getProjectBoard(projectId),
      getProjectMembers(projectId),
      getActiveSprint(projectId),
    ]);

  if (!project) notFound();

  const pinnedIds = pinnedProjects.map((p) => p.id);

  const boardColumns = (board?.columns ?? [])
    .filter((c) => c.key)
    .map((c) => ({ id: c.key!, title: c.name }));

  const initialIssues: Task[] = rawIssues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description ?? undefined,
    status: issue.status,
    priority: issue.priority as Task["priority"],
    dueDate: issue.due_date ?? undefined,
    assignee: issue.assignee
      ? {
          name: issue.assignee.username,
          avatar: issue.assignee.avatar_url ?? undefined,
          initials: getInitials(issue.assignee.username),
        }
      : undefined,
    reporter: issue.reporter
      ? {
          name: issue.reporter.username,
          initials: getInitials(issue.reporter.username),
        }
      : undefined,
    issueNumber: issue.issue_number,
    assigneeId: issue.assignee_id,
    reporterId: issue.reporter_id,
    type: issue.type,
    createdAt: issue.created_at,
    labels: issue.labels,
    sprintId: issue.sprint_id ?? null,
    epicId: issue.epic_id ?? null,
    epicName: issue.epic_name ?? null,
  }));

  const memberNames = projectMembers.map((m) => m.username);

  return (
    <ProjectBoardClient
      projectId={project.id}
      projectName={project.name}
      pinnedIds={pinnedIds}
      initialIssues={initialIssues}
      boardColumns={boardColumns}
      memberNames={memberNames}
      activeSprintId={activeSprint?.id ?? null}
    />
  );
}
