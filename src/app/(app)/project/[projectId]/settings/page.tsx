import { notFound, redirect } from "next/navigation";
import {
  getSessionUser,
  getActiveOrg,
  getProject,
  getCurrentUserOrgRole,
} from "@/lib/dal";
import { ProjectSettingsClient } from "./ProjectSettingsClient";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const [user, org, userRole] = await Promise.all([
    getSessionUser(),
    getActiveOrg(),
    getCurrentUserOrgRole(),
  ]);
  if (!org || !user) redirect("/onboarding/workspace");

  if (!userRole || !["owner", "admin"].includes(userRole)) {
    redirect(`/project/${projectId}`);
  }

  const project = await getProject(projectId, org.id, user.id);
  if (!project) notFound();

  return (
    <ProjectSettingsClient
      project={project}
      userRole={userRole as "owner" | "admin"}
    />
  );
}
