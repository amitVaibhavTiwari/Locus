import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ epicId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { epicId } = await params;

  const activities = await db
    .selectFrom("activities")
    .innerJoin("users", "users.id", "activities.user_id")
    .where("activities.epic_id", "=", epicId)
    .select([
      "activities.id",
      "activities.type",
      "activities.payload",
      "activities.created_at",
      "users.id as user_id",
      "users.username",
      "users.avatar_url",
    ])
    .orderBy("activities.created_at", "asc")
    .execute();

  return NextResponse.json(activities);
}
