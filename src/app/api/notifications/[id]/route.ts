import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await db
    .updateTable("notifications")
    .set({ is_read: 1 })
    .where("id", "=", id)
    .where("user_id", "=", session.user.id)
    .execute();

  return NextResponse.json({ ok: true });
}
