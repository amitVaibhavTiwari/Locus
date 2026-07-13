import { notFound, redirect } from "next/navigation";
import {
  getUserIdFromRequest,
  getOrgIdFromRequest,
  getProject,
  getOrgMemberRole,
} from "@/lib/dal";
import { ProjectSettingsClient } from "./ProjectSettingsClient";
import { ShieldOff } from "lucide-react";

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
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4 text-center p-6">
        <ShieldOff className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground max-w-sm">
          You don&apos;t have permission to view project settings.
        </p>
      </div>
    );
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
