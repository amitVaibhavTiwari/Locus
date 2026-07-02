import { redirect } from "next/navigation";
import { getActiveOrg, getCurrentUserOrgRole } from "@/lib/dal";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const [org, userRole] = await Promise.all([
    getActiveOrg(),
    getCurrentUserOrgRole(),
  ]);

  if (userRole !== "owner") redirect("/dashboard");

  const workspaceName =
    org?.workspacePrefs?.display_name ?? org?.name ?? "My Workspace";
  const brandColor = org?.workspacePrefs?.brand_color ?? null;
  const allowAdminInvite = (org?.workspacePrefs?.allow_admin_invite ?? 0) === 1;

  return (
    <SettingsClient
      initialWorkspaceName={workspaceName}
      initialBrandColor={brandColor}
      initialAllowAdminInvite={allowAdminInvite}
    />
  );
}
