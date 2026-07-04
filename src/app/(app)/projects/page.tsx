import { redirect } from "next/navigation";
import { getSessionUser, getActiveOrg, getPinnedProjects } from "@/lib/dal";
import { db } from "@/lib/db";
import { ProjectsClient } from "./ProjectsClient";

const PAGE_SIZE = 15;

export default async function ProjectsPage() {
  const [user, org] = await Promise.all([getSessionUser(), getActiveOrg()]);
  if (!org || !user) redirect("/onboarding/workspace");

  const projectsBaseQuery = db
    .selectFrom("projects")
    .where("organization_id", "=", org.id)
    .where("archived", "=", 0)
    .where((eb) =>
      eb.or([
        eb("visibility", "=", "public"),
        eb.exists(
          eb
            .selectFrom("project_members")
            .whereRef("project_members.project_id", "=", "projects.id")
            .where("project_members.user_id", "=", user.id)
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
    getPinnedProjects(user.id, org.id),
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
