import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const q = req.nextUrl.searchParams.get("q") ?? "";

  const project = await db
    .selectFrom("projects")
    .where("id", "=", projectId)
    .select(["organization_id"])
    .executeTakeFirst();

  if (!project) return NextResponse.json([]);

  const users = await db
    .selectFrom("organization_members")
    .innerJoin("users", "users.id", "organization_members.user_id")
    .where("organization_members.organization_id", "=", project.organization_id)
    .$if(!!q, (qb) => qb.where("users.username", "like", `%${q}%`))
    .select(["users.id", "users.username", "users.avatar_url"])
    .orderBy("users.username", "asc")
    .limit(10)
    .execute();

  return NextResponse.json(users);
}
