import React from "react";
import { redirect } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  getUserIdFromRequest,
  getOrgIdFromRequest,
  getUserById,
  getOrgMemberRole,
  getPinnedProjects,
  getUserWorkspaces,
} from "@/lib/dal";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getUserIdFromRequest();
  if (!userId) redirect("/login");

  const orgId = await getOrgIdFromRequest();
  if (!orgId) redirect("/onboarding/workspace");

  // I may optimize this in future but it is 4 queries and run only once so for now it is fine. This is server side so I can't use zustand store here.
  const [user, userRole, workspaces, pinnedProjects] = await Promise.all([
    getUserById(userId),
    getOrgMemberRole(userId, orgId),
    getUserWorkspaces(userId),
    getPinnedProjects(userId, orgId),
  ]);

  const currentOrg = workspaces.find((w) => w.id === orgId);
  const orgName = currentOrg?.name ?? "";
  const brandColor = currentOrg?.brandColor ?? null;

  return (
    <MainLayout
      user={user ?? null}
      orgName={orgName}
      activeOrgId={orgId}
      brandColor={brandColor}
      userRole={userRole ?? "member"}
      pinnedProjects={pinnedProjects}
      workspaces={workspaces}
    >
      {children}
    </MainLayout>
  );
}
