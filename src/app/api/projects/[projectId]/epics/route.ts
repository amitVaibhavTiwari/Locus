import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const PAGE_SIZE = 20;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") ?? "";
  const priority = searchParams.get("priority") ?? "";
  const status = searchParams.get("status") ?? "";
  const ownerId = searchParams.get("ownerId") ?? "";
  const archived = searchParams.get("archived") === "1" ? 1 : 0;
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));

  const project = await db
    .selectFrom("projects")
    .where("id", "=", projectId)
    .select(["id", "organization_id"])
    .executeTakeFirst();

  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await db
    .selectFrom("organization_members")
    .where("organization_id", "=", project.organization_id)
    .where("user_id", "=", session.user.id)
    .select("id")
    .executeTakeFirst();

  if (!membership)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const baseQuery = db
    .selectFrom("epics")
    .where("project_id", "=", projectId)
    .where("archived", "=", archived)
    .$if(!!search, (qb) => qb.where("name", "like", `%${search}%`))
    .$if(!!priority && priority !== "all", (qb) =>
      qb.where("priority", "=", priority),
    )
    .$if(!!status && status !== "all", (qb) => qb.where("status", "=", status))
    .$if(ownerId === "none", (qb) => qb.where("owner_id", "is", null))
    .$if(!!ownerId && ownerId !== "none", (qb) =>
      qb.where("owner_id", "=", ownerId),
    );

  const [rows, countRow] = await Promise.all([
    baseQuery
      .selectAll()
      .orderBy("created_at", "desc")
      .offset(offset)
      .limit(PAGE_SIZE + 1)
      .execute(),
    baseQuery
      .select((eb) => eb.fn.countAll<number>().as("total"))
      .executeTakeFirst(),
  ]);

  const hasMore = rows.length > PAGE_SIZE;
  const epics = rows.slice(0, PAGE_SIZE);
  const total = Number(countRow?.total ?? 0);

  if (epics.length === 0) {
    return NextResponse.json({ epics: [], hasMore: false, total });
  }

  const epicIds = epics.map((e) => e.id);
  const ownerIds = [
    ...new Set(epics.map((e) => e.owner_id).filter(Boolean)),
  ] as string[];

  const [issueRows, owners] = await Promise.all([
    db
      .selectFrom("issues")
      .where("epic_id", "in", epicIds)
      .select(["epic_id", "completed_at"])
      .execute(),
    ownerIds.length > 0
      ? db
          .selectFrom("users")
          .where("id", "in", ownerIds)
          .select(["id", "username", "avatar_url"])
          .execute()
      : Promise.resolve(
          [] as { id: string; username: string; avatar_url: string | null }[],
        ),
  ]);

  const totalMap = new Map<string, number>();
  const doneMap = new Map<string, number>();
  issueRows.forEach((row) => {
    if (!row.epic_id) return;
    totalMap.set(row.epic_id, (totalMap.get(row.epic_id) ?? 0) + 1);
    if (row.completed_at !== null)
      doneMap.set(row.epic_id, (doneMap.get(row.epic_id) ?? 0) + 1);
  });

  const ownerMap = new Map(owners.map((u) => [u.id, u]));

  const enriched = epics.map((epic) => ({
    id: epic.id,
    name: epic.name,
    description: epic.description,
    priority: epic.priority,
    status: epic.status,
    start_date: epic.start_date,
    end_date: epic.end_date,
    archived_at: epic.archived_at,
    totalIssues: totalMap.get(epic.id) ?? 0,
    doneIssues: doneMap.get(epic.id) ?? 0,
    owner: epic.owner_id ? (ownerMap.get(epic.owner_id) ?? null) : null,
  }));

  return NextResponse.json({ epics: enriched, hasMore, total });
}
