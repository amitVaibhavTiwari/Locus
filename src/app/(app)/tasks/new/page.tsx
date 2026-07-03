import { notFound, redirect } from "next/navigation";
import {
  getSessionUser,
  getActiveOrg,
  getProject,
  getProjectBoard,
  getProjectMembers,
  getProjectSprints,
} from "@/lib/dal";
import { CreateTaskClient } from "./CreateTaskClient";

export default async function CreateTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; status?: string }>;
}) {
  const { projectId, status: statusParam } = await searchParams;

  if (!projectId) redirect("/projects");

  const [user, org] = await Promise.all([getSessionUser(), getActiveOrg()]);
  if (!org || !user) redirect("/onboarding/workspace");

  const [project, board, projectMembers, allSprints] = await Promise.all([
    getProject(projectId, org.id, user.id),
    getProjectBoard(projectId),
    getProjectMembers(projectId),
    getProjectSprints(projectId),
  ]);

  if (!project) notFound();

  const statuses = (board?.columns ?? [])
    .filter((c) => c.key)
    .map((c) => ({ key: c.key!, name: c.name }));

  // Only active and planned sprints are valid targets for new tasks
  const sprints = allSprints
    .filter((s) => s.status === "active" || s.status === "planned")
    .map((s) => ({ id: s.id, name: s.name, status: s.status }));

  const defaultStatus = statusParam ?? statuses[0]?.key ?? "todo";

  const initialMembers = projectMembers.slice(0, 6).map((m) => ({
    id: m.userId,
    username: m.username,
    email: m.email,
    avatar_url: m.avatar_url,
  }));

  return (
    <CreateTaskClient
      projectId={project.id}
      projectName={project.name}
      statuses={statuses}
      sprints={sprints}
      initialMembers={initialMembers}
      currentUserId={user.id}
      defaultStatus={defaultStatus}
    />
  );
}
