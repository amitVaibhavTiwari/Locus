import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const PAGE_SIZE = 15;

async function getOrgId(userId: string): Promise<string | null> {
  const prefs = await db
    .selectFrom("user_preferences")
    .where("user_id", "=", userId)
    .select(["active_organization_id"])
    .executeTakeFirst();
  return prefs?.active_organization_id ?? null;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(session.user.id);
  if (!orgId)
    return NextResponse.json({ error: "No active org" }, { status: 400 });

  const offset = Math.max(
    0,
    parseInt(req.nextUrl.searchParams.get("offset") ?? "0", 10),
  );

  const [rows, countRow] = await Promise.all([
    db
      .selectFrom("notifications")
      .where("user_id", "=", session.user.id)
      .where("organization_id", "=", orgId)
      .selectAll()
      .orderBy("created_at", "desc")
      .limit(PAGE_SIZE + 1)
      .offset(offset)
      .execute(),
    db
      .selectFrom("notifications")
      .where("user_id", "=", session.user.id)
      .where("organization_id", "=", orgId)
      .where("is_read", "=", 0)
      .select((eb) => eb.fn.count<number>("id").as("count"))
      .executeTakeFirst(),
  ]);

  const hasMore = rows.length > PAGE_SIZE;
  return NextResponse.json({
    notifications: rows.slice(0, PAGE_SIZE),
    hasMore,
    unreadCount: Number(countRow?.count ?? 0),
  });
}

export async function PATCH() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(session.user.id);
  if (!orgId)
    return NextResponse.json({ error: "No active org" }, { status: 400 });

  await db
    .updateTable("notifications")
    .set({ is_read: 1 })
    .where("user_id", "=", session.user.id)
    .where("organization_id", "=", orgId)
    .execute();

  return NextResponse.json({ ok: true });
}
