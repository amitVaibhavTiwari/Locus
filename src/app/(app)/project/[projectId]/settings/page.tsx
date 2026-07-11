import { notFound, redirect } from "next/navigation";
import {
  getUserIdFromRequest,
  getOrgIdFromRequest,
  getProject,
  getOrgMemberRole,
} from "@/lib/dal";
import { ProjectSettingsClient } from "./ProjectSettingsClient";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const userId = await getUserIdFromRequest();
  if (!userId) redirect("/login");

  const orgId = await getOrgIdFromRequest();
  if (!orgId) redirect("/onboarding/workspace");

  const userRole = await getOrgMemberRole(userId, orgId);

  if (!userRole || !["owner", "admin"].includes(userRole)) {
    redirect(`/project/${projectId}`);
  }

  const project = await getProject(projectId, orgId, userId);
  if (!project) notFound();

  return (
    <ProjectSettingsClient
      project={project}
      userRole={userRole as "owner" | "admin"}
    />
  );
}
