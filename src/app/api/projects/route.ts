import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const PAGE_SIZE = 15;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") ?? "";
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));

  const prefs = await db
    .selectFrom("user_preferences")
    .where("user_id", "=", userId)
    .select(["active_organization_id"])
    .executeTakeFirst();

  if (!prefs?.active_organization_id) {
    return NextResponse.json({ projects: [], hasMore: false });
  }
  const orgId = prefs.active_organization_id;

  const baseQuery = db
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
    )
    .$if(!!search, (qb) => qb.where("name", "like", `%${search}%`));

  const [rows, countRow] = await Promise.all([
    baseQuery
      .select([
        "id",
        "name",
        "description",
        "visibility",
        "created_at",
        "updated_at",
      ])
      .orderBy("created_at", "desc")
      .offset(offset)
      .limit(PAGE_SIZE + 1)
      .execute(),
    baseQuery
      .select((eb) => eb.fn.countAll<number>().as("total"))
      .executeTakeFirst(),
  ]);

  const hasMore = rows.length > PAGE_SIZE;
  const total = Number(countRow?.total ?? 0);
  return NextResponse.json({
    projects: rows.slice(0, PAGE_SIZE),
    hasMore,
    total,
  });
}
