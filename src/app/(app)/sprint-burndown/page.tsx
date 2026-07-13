import { redirect } from "next/navigation";
import {
  getUserIdFromRequest,
  getOrgIdFromRequest,
  getOrgSprintSummaries,
} from "@/lib/dal";
import { SprintBurndownClient } from "./SprintBurndownClient";

export default async function SprintBurndown() {
  const userId = await getUserIdFromRequest();
  if (!userId) redirect("/login");

  const orgId = await getOrgIdFromRequest();
  if (!orgId) redirect("/onboarding/workspace");

  const { activeSprint, completedSprints } = await getOrgSprintSummaries(orgId);

  return (
    <SprintBurndownClient
      activeSprint={activeSprint}
      completedSprints={completedSprints}
    />
  );
}
