import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { after } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadFile, getSignedDownloadUrl } from "@/lib/storage";
import sharp from "sharp";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

// MIME types that sharp can convert to WebP
const CONVERTIBLE_IMAGE_TYPES = new Set([
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
  console.log("upload API called");
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
    const issueId = formData.get("issueId")?.toString();

    if (!file || !issueId) {
      return NextResponse.json(
        { error: "Missing required fields: file, issueId" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 50 MB limit" },
        { status: 413 },
      );
    }

    const issue = await db
      .selectFrom("issues")
      .where("id", "=", issueId)
      .select(["organization_id", "project_id"])
      .executeTakeFirst();

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const membership = await db
      .selectFrom("organization_members")
      .where("organization_id", "=", issue.organization_id)
      .where("user_id", "=", session.user.id)
      .select("id")
      .executeTakeFirst();

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let buffer = Buffer.from(await file.arrayBuffer());
    let mimeType = file.type || "application/octet-stream";
    let filename = file.name;

    if (CONVERTIBLE_IMAGE_TYPES.has(mimeType)) {
      buffer = await sharp(buffer).webp({ quality: 85 }).toBuffer();
      mimeType = "image/webp";
      filename = filename.replace(/\.[^.]+$/, ".webp");
    }

    const attachmentId = randomUUID();
    const ext = filename.includes(".") ? filename.split(".").pop() : "bin";
    const storageKey = `attachments/${issue.organization_id}/${issueId}/${attachmentId}.${ext}`;

    await uploadFile(storageKey, buffer, mimeType);

    const now = new Date().toISOString();
    await db
      .insertInto("attachments")
      .values({
        id: attachmentId,
        issue_id: issueId,
        organization_id: issue.organization_id,
        filename,
        storage_key: storageKey,
        mime_type: mimeType,
        size: buffer.length,
        uploaded_by: session.user.id,
        created_at: now,
      })
      .execute();

    const signedUrl = await getSignedDownloadUrl(storageKey);

    after(async () => {
      await db
        .insertInto("activities")
        .values({
          id: randomUUID(),
          organization_id: issue.organization_id,
          project_id: issue.project_id,
          issue_id: issueId,
          user_id: session.user.id,
          type: "attachment_added",
          payload: JSON.stringify({ filename }),
          created_at: new Date().toISOString(),
        })
        .execute();
    });

    return NextResponse.json(
      {
        id: attachmentId,
        filename,
        mime_type: mimeType,
        size: buffer.length,
        created_at: now,
        url: signedUrl,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[upload] error:", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
