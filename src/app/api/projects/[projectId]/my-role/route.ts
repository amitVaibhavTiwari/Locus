import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const member = await db
    .selectFrom("project_members")
    .where("project_id", "=", projectId)
    .where("user_id", "=", session.user.id)
    .select("role")
    .executeTakeFirst();

  return NextResponse.json({ role: member?.role ?? null });
}
