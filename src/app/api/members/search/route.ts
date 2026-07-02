import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const projectId = searchParams.get("projectId");
  const q = searchParams.get("q") ?? "";

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const members = await db
    .selectFrom("project_members")
    .innerJoin("users", "users.id", "project_members.user_id")
    .where("project_members.project_id", "=", projectId)
    .$if(!!q, (qb) =>
      qb.where((eb) =>
        eb.or([
          eb("users.username", "like", `%${q}%`),
          eb("users.email", "like", `%${q}%`),
        ]),
      ),
    )
    .select(["users.id", "users.username", "users.email", "users.avatar_url"])
    .limit(6)
    .execute();

  return NextResponse.json(members);
}
