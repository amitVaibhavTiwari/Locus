import { redirect } from "next/navigation";
import {
  getUserIdFromRequest,
  getOrgIdFromRequest,
  getOrgMemberRole,
} from "@/lib/dal";
import { db } from "@/lib/db";
import { ArchivedProjectsClient } from "./ArchivedProjectsClient";

export default async function ArchivedProjectsPage() {
  const userId = await getUserIdFromRequest();
  if (!userId) redirect("/login");

  const orgId = await getOrgIdFromRequest();
  if (!orgId) redirect("/onboarding/workspace");

  const userRole = await getOrgMemberRole(userId, orgId);
  if (userRole !== "owner") redirect("/projects");

  const projects = await db
    .selectFrom("projects")
    .where("organization_id", "=", orgId)
    .where("archived", "=", 1)
    .select(["id", "name", "description", "visibility", "updated_at"])
    .orderBy("updated_at", "desc")
    .execute();

  return <ArchivedProjectsClient projects={projects} />;
}
