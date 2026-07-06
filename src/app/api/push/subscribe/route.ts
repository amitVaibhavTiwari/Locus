import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { endpoint, keys, orgId } = body as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
    orgId?: string;
  };

  if (!endpoint || !keys?.p256dh || !keys?.auth || !orgId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  await db
    .deleteFrom("push_subscriptions")
    .where("endpoint", "=", endpoint)
    .where("organization_id", "=", orgId)
    .execute();

  await db
    .insertInto("push_subscriptions")
    .values({
      id: randomUUID(),
      user_id: session.user.id,
      organization_id: orgId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      is_valid: 1,
      user_agent: req.headers.get("user-agent") ?? null,
      created_at: new Date().toISOString(),
    })
    .execute();

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { endpoint, orgId } = (await req.json()) as {
    endpoint?: string;
    orgId?: string;
  };

  if (!endpoint || !orgId) {
    return NextResponse.json(
      { error: "Missing endpoint or orgId" },
      { status: 400 },
    );
  }

  await db
    .deleteFrom("push_subscriptions")
    .where("endpoint", "=", endpoint)
    .where("organization_id", "=", orgId)
    .where("user_id", "=", session.user.id)
    .execute();

  return NextResponse.json({ success: true });
}
