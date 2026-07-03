import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  const { searchParams } = req.nextUrl;
  const projectId = searchParams.get("projectId");
  const q = searchParams.get("q") ?? "";

  if (!projectId) return NextResponse.json([]);

  const epics = await db
    .selectFrom("epics")
    .where("project_id", "=", projectId)
    .$if(!!q.trim(), (qb) => qb.where("name", "like", `%${q.trim()}%`))
    .select(["id", "name", "status"])
    .orderBy("name", "asc")
    .limit(10)
    .execute();

  return NextResponse.json(epics);
}
