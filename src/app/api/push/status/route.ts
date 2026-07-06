import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const orgId = searchParams.get("orgId");
  const endpoint = searchParams.get("endpoint");

  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  }

  // checking if any record exists for this user + workspace (everAllowed send in resp)
  const anyRecord = await db
    .selectFrom("push_subscriptions")
    .where("user_id", "=", session.user.id)
    .where("organization_id", "=", orgId)
    .select(["id"])
    .executeTakeFirst();

  const everAllowed = !!anyRecord;

  // checking weather the push subscription is still valid or not (we compare both endpoint and workspace to make sure the endpoint is still valid for this workspace.If this is true then nothing is needed to be done.)
  if (endpoint) {
    const record = await db
      .selectFrom("push_subscriptions")
      .where("user_id", "=", session.user.id)
      .where("organization_id", "=", orgId)
      .where("endpoint", "=", endpoint)
      .select(["is_valid"])
      .executeTakeFirst();

    return NextResponse.json({
      isValid: record ? record.is_valid === 1 : null,
      everAllowed,
    });
  }

  return NextResponse.json({ isValid: null, everAllowed });
}
