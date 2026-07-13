import { redirect } from "next/navigation";
import {
  getUserIdFromRequest,
  getOrgIdFromRequest,
  getOrgMemberRole,
} from "@/lib/dal";
import { db } from "@/lib/db";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const userId = await getUserIdFromRequest();
  if (!userId) redirect("/login");

  const orgId = await getOrgIdFromRequest();
  if (!orgId) redirect("/onboarding/workspace");

  const [userRole, org, workspacePrefs] = await Promise.all([
    getOrgMemberRole(userId, orgId),
    db
      .selectFrom("organizations")
      .where("id", "=", orgId)
      .select(["name"])
      .executeTakeFirst(),
    db
      .selectFrom("workspace_preferences")
      .where("organization_id", "=", orgId)
      .select(["display_name", "brand_color", "allow_admin_invite"])
      .executeTakeFirst(),
  ]);

  if (userRole !== "owner") redirect("/dashboard");

  const workspaceName =
    workspacePrefs?.display_name ?? org?.name ?? "My Workspace";
  const brandColor = workspacePrefs?.brand_color ?? null;
  const allowAdminInvite = (workspacePrefs?.allow_admin_invite ?? 0) === 1;

  return (
    <SettingsClient
      initialWorkspaceName={workspaceName}
      initialBrandColor={brandColor}
      initialAllowAdminInvite={allowAdminInvite}
    />
  );
}
