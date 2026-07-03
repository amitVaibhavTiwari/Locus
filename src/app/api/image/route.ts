import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFileBuffer } from "@/lib/storage";

// This is a proxy endpoint for file attachments. Whenever an attachment is made, this API endpoint is called
// The key is never exposed as a direct S3 URL — all access flows through here.
// Cache-Control: private so the browser caches it per-session but CDNs don't.

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const key = req.nextUrl.searchParams.get("key");
  if (!key) {
    return new NextResponse("Missing key", { status: 400 });
  }

  // extracting org_id from the key structure:
  //   editor-images/{org_id}/...
  //   attachments/{org_id}/...
  const parts = key.split("/");
  const orgId = parts[1] ?? null;

  if (!orgId) {
    return new NextResponse("Invalid key", { status: 400 });
  }

  // To verify user belongs to the org embedded in the key
  const membership = await db
    .selectFrom("organization_members")
    .where("organization_id", "=", orgId)
    .where("user_id", "=", session.user.id)
    .select("id")
    .executeTakeFirst();

  if (!membership) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const { buffer, contentType } = await getFileBuffer(key);
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[image] fetch error:", err);
    return new NextResponse("Not found", { status: 404 });
  }
}
