import React from "react";
import { redirect } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  getSessionUser,
  getActiveOrg,
  getCurrentUserOrgRole,
  getPinnedProjects,
  getUserWorkspaces,
} from "@/lib/dal";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, org, userRole, workspaces] = await Promise.all([
    getSessionUser(),
    getActiveOrg(),
    getCurrentUserOrgRole(),
    getUserWorkspaces(),
  ]);
  if (!org) redirect("/onboarding/workspace");

  const orgName = org.workspacePrefs?.display_name ?? org.name;
  const brandColor = org.workspacePrefs?.brand_color ?? null;

  const pinnedProjects = user ? await getPinnedProjects(user.id, org.id) : [];

  return (
    <MainLayout
      user={user}
      orgName={orgName}
      activeOrgId={org.id}
      brandColor={brandColor}
      userRole={userRole ?? "member"}
      pinnedProjects={pinnedProjects}
      workspaces={workspaces}
    >
      {children}
    </MainLayout>
  );
}
