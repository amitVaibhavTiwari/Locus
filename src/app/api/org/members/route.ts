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
  const role = searchParams.get("role") ?? "";
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));

  const prefs = await db
    .selectFrom("user_preferences")
    .where("user_id", "=", userId)
    .select(["active_organization_id"])
    .executeTakeFirst();

  if (!prefs?.active_organization_id) {
    return NextResponse.json({ members: [], hasMore: false });
  }
  const orgId = prefs.active_organization_id;

  const baseQuery = db
    .selectFrom("organization_members")
    .innerJoin("users", "users.id", "organization_members.user_id")
    .where("organization_members.organization_id", "=", orgId)
    .$if(!!search, (qb) =>
      qb.where((eb) =>
        eb.or([
          eb("users.username", "like", `%${search}%`),
          eb("users.email", "like", `%${search}%`),
        ]),
      ),
    )
    .$if(!!role && role !== "all", (qb) =>
      qb.where(
        "organization_members.role",
        "=",
        role as "owner" | "admin" | "member",
      ),
    );

  const [rows, countRow] = await Promise.all([
    baseQuery
      .select([
        "organization_members.id as memberId",
        "organization_members.user_id as userId",
        "organization_members.role",
        "organization_members.joined_at",
        "users.username",
        "users.email",
        "users.avatar_url",
      ])
      .orderBy("organization_members.joined_at", "asc")
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
