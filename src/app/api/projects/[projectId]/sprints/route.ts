import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const sprints = await db
    .selectFrom("sprints")
    .where("project_id", "=", projectId)
    .where("status", "=", "planned")
    .select(["id", "name", "start_date", "end_date"])
    .orderBy("created_at", "asc")
    .execute();

  return NextResponse.json({ sprints });
}
