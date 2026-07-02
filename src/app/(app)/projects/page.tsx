import { redirect } from "next/navigation";
import {
  getSessionUser,
  getActiveOrg,
  getProjects,
  getPinnedProjects,
} from "@/lib/dal";
import { ProjectsClient } from "./ProjectsClient";

export default async function ProjectsPage() {
  const [user, org] = await Promise.all([getSessionUser(), getActiveOrg()]);
  if (!org || !user) redirect("/onboarding/workspace");

  const [projects, pinnedProjects] = await Promise.all([
    getProjects(org.id, user.id),
    getPinnedProjects(user.id, org.id),
  ]);

  const pinnedIds = new Set(pinnedProjects.map((p) => p.id));

  return <ProjectsClient projects={projects} pinnedIds={[...pinnedIds]} />;
}
