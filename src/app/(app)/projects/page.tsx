import { redirect } from "next/navigation";
import {
  getUserIdFromRequest,
  getOrgIdFromRequest,
  getPinnedProjects,
} from "@/lib/dal";
import { db } from "@/lib/db";
import { ProjectsClient } from "./ProjectsClient";

const PAGE_SIZE = 15;

export default async function ProjectsPage() {
  const userId = await getUserIdFromRequest();
  if (!userId) redirect("/login");

  const orgId = await getOrgIdFromRequest();
  if (!orgId) redirect("/onboarding/workspace");

  const projectsBaseQuery = db
    .selectFrom("projects")
    .where("organization_id", "=", orgId)
    .where("archived", "=", 0)
    .where((eb) =>
      eb.or([
        eb("visibility", "=", "public"),
        eb.exists(
          eb
            .selectFrom("project_members")
            .whereRef("project_members.project_id", "=", "projects.id")
            .where("project_members.user_id", "=", userId)
            .select("project_members.id"),
        ),
      ]),
    );

  const [firstBatch, countRow, pinnedProjects] = await Promise.all([
    projectsBaseQuery
      .select([
        "id",
        "name",
        "description",
        "visibility",
        "created_at",
        "updated_at",
      ])
      .orderBy("created_at", "desc")
      .limit(PAGE_SIZE + 1)
      .execute(),
    projectsBaseQuery
      .select((eb) => eb.fn.countAll<number>().as("total"))
      .executeTakeFirst(),
    getPinnedProjects(userId, orgId),
  ]);

  const hasMore = firstBatch.length > PAGE_SIZE;
  const projects = firstBatch.slice(0, PAGE_SIZE);
  const pinnedIds = pinnedProjects.map((p) => p.id);
  const initialTotal = Number(countRow?.total ?? 0);

  return (
    <ProjectsClient
      initialProjects={projects}
      initialHasMore={hasMore}
      initialTotal={initialTotal}
      pinnedIds={pinnedIds}
    />
  );
}
