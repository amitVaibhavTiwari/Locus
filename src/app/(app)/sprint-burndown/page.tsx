import { redirect } from "next/navigation";
import { getActiveOrg, getOrgSprintSummaries } from "@/lib/dal";
import { SprintBurndownClient } from "./SprintBurndownClient";

export default async function SprintBurndown() {
  const org = await getActiveOrg();
  if (!org) redirect("/login");

  const { activeSprint, completedSprints } = await getOrgSprintSummaries(
    org.id,
  );

  return (
    <SprintBurndownClient
      activeSprint={activeSprint}
      completedSprints={completedSprints}
    />
  );
}
