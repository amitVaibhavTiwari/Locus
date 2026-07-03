import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadFile } from "@/lib/storage";
import sharp from "sharp";

// This is for images pasted directly into description of a ticket. We don't have issueID before so this is stored in different location.
// Stored at editor-images/{org_id}/{uuid}.webp and served via /api/image?key=...

const CONVERTIBLE = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/bmp",
  "image/tiff",
  "image/avif",
  "image/heic",
  "image/heif",
]);

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId")?.toString();

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image exceeds 20 MB limit" },
        { status: 413 },
      );
    }

    let orgId: string | null = null;
    if (projectId) {
      const project = await db
        .selectFrom("projects")
        .where("id", "=", projectId)
        .select("organization_id")
        .executeTakeFirst();
      orgId = project?.organization_id ?? null;
    }
    if (!orgId) {
      const membership = await db
        .selectFrom("organization_members")
        .where("user_id", "=", session.user.id)
        .select("organization_id")
        .executeTakeFirst();
      orgId = membership?.organization_id ?? null;
    }
    if (!orgId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 403 },
      );
    }

    let buffer = Buffer.from(await file.arrayBuffer());
    let mimeType = file.type || "application/octet-stream";

    if (CONVERTIBLE.has(mimeType)) {
      buffer = await sharp(buffer).webp({ quality: 85 }).toBuffer();
      mimeType = "image/webp";
    }

    const key = `editor-images/${orgId}/${randomUUID()}.webp`;
    await uploadFile(key, buffer, mimeType);

    // This returned  proxy URL never expires and has auth. This gets stored in DB as img src and whenwver the user opens task, the GET /api/image endpoint will verify the user and will get file from s3 and send it to user.
    const url = `/api/image?key=${encodeURIComponent(key)}`;
    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    console.error("[upload-image] error:", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
