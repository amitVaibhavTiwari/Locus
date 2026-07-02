import { redirect } from "next/navigation";
import { getSessionUser, getActiveOrg, getOrgMembers } from "@/lib/dal";
import { CreateProjectClient } from "./CreateProjectClient";

export default async function CreateProjectPage() {
  const [user, org] = await Promise.all([getSessionUser(), getActiveOrg()]);
  if (!org || !user) redirect("/onboarding/workspace");

  const members = await getOrgMembers(org.id);

  return <CreateProjectClient members={members} />;
}
