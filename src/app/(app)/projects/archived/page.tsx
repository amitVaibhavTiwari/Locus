import { redirect } from "next/navigation";
import { getSessionUser, getActiveOrg, getCurrentUserOrgRole } from "@/lib/dal";
import { db } from "@/lib/db";
import { ArchivedProjectsClient } from "./ArchivedProjectsClient";

export default async function ArchivedProjectsPage() {
  const [user, org, userRole] = await Promise.all([
    getSessionUser(),
    getActiveOrg(),
    getCurrentUserOrgRole(),
  ]);

  if (!org || !user) redirect("/onboarding/workspace");
  if (userRole !== "owner") redirect("/projects");

  const projects = await db
    .selectFrom("projects")
    .where("organization_id", "=", org.id)
    .where("archived", "=", 1)
    .select(["id", "name", "description", "visibility", "updated_at"])
    .orderBy("updated_at", "desc")
    .execute();

  return <ArchivedProjectsClient projects={projects} />;
}
