import { redirect } from "next/navigation";
import { getActiveOrg, getMyAssignedIssues, getSessionUser } from "@/lib/dal";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";

export default async function DashboardPage() {
  const [org, user] = await Promise.all([getActiveOrg(), getSessionUser()]);
  if (!org || !user) redirect("/login");

  const tasks = await getMyAssignedIssues(org.id, user.id);

  return <DashboardOverview tasks={tasks} username={user.username} />;
}
