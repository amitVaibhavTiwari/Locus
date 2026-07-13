import { redirect } from "next/navigation";
import {
  getUserIdFromRequest,
  getOrgIdFromRequest,
  getOrgMembers,
} from "@/lib/dal";
import { CreateProjectClient } from "./CreateProjectClient";

export default async function CreateProjectPage() {
  const userId = await getUserIdFromRequest();
  if (!userId) redirect("/login");

  const orgId = await getOrgIdFromRequest();
  if (!orgId) redirect("/onboarding/workspace");

  const members = await getOrgMembers(orgId);

  return <CreateProjectClient members={members} />;
}
