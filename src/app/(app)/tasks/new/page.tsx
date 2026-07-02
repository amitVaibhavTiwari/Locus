import { notFound, redirect } from "next/navigation";
import {
  getSessionUser,
  getActiveOrg,
  getProject,
  getProjectBoard,
  getProjectMembers,
} from "@/lib/dal";
import { CreateTaskClient } from "./CreateTaskClient";

export default async function CreateTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; status?: string }>;
}) {
  const { projectId, status: defaultStatus = "todo" } = await searchParams;

  if (!projectId) redirect("/projects");

  const [user, org] = await Promise.all([getSessionUser(), getActiveOrg()]);
  if (!org || !user) redirect("/onboarding/workspace");

  const [project, board, projectMembers] = await Promise.all([
    getProject(projectId, org.id, user.id),
    getProjectBoard(projectId),
    getProjectMembers(projectId),
  ]);

  if (!project) notFound();

  const statuses = (board?.columns ?? [])
    .filter((c) => c.key)
    .map((c) => ({ key: c.key!, name: c.name }));

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
      initialMembers={initialMembers}
      currentUserId={user.id}
      defaultStatus={defaultStatus}
    />
  );
}
