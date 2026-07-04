import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const PAGE_SIZE = 15;

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
  const role = searchParams.get("role") ?? "";
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));

  const baseQuery = db
    .selectFrom("project_members")
    .innerJoin("users", "users.id", "project_members.user_id")
    .where("project_members.project_id", "=", projectId)
    .$if(!!search, (qb) =>
      qb.where((eb) =>
        eb.or([
          eb("users.username", "like", `%${search}%`),
          eb("users.email", "like", `%${search}%`),
        ]),
      ),
    )
    .$if(!!role && role !== "all", (qb) =>
      qb.where("project_members.role", "=", role as "manager" | "member"),
    );

  const [rows, countRow] = await Promise.all([
    baseQuery
      .select([
        "project_members.id as memberId",
        "project_members.user_id as userId",
        "project_members.role",
        "project_members.joined_at",
        "users.username",
        "users.email",
        "users.avatar_url",
      ])
      .orderBy("project_members.joined_at", "asc")
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
    members: rows.slice(0, PAGE_SIZE),
    hasMore,
    total,
  });
}
