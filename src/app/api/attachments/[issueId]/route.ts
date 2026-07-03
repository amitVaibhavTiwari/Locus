import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSignedDownloadUrl, deleteFile } from "@/lib/storage";

// GET /api/attachments/[issueId] — This API lists attachments with fresh signed URLs
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { issueId } = await params;

  const issue = await db
    .selectFrom("issues")
    .where("id", "=", issueId)
    .select("organization_id")
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

  const rows = await db
    .selectFrom("attachments")
    .innerJoin("users", "users.id", "attachments.uploaded_by")
    .where("attachments.issue_id", "=", issueId)
    .select([
      "attachments.id",
      "attachments.filename",
      "attachments.storage_key",
      "attachments.mime_type",
      "attachments.size",
      "attachments.created_at",
      "users.username as uploader_name",
    ])
    .orderBy("attachments.created_at", "asc")
    .execute();

  // This generates a fresh signed URL for every attachment
  const attachments = await Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      filename: row.filename,
      mime_type: row.mime_type,
      size: row.size,
      created_at: row.created_at,
      uploader_name: row.uploader_name,
      url: await getSignedDownloadUrl(row.storage_key),
    })),
  );

  return NextResponse.json(attachments);
}

// DELETE /api/attachments/[issueId]?attachmentId=xxx
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { issueId } = await params;
  const attachmentId = req.nextUrl.searchParams.get("attachmentId");

  if (!attachmentId) {
    return NextResponse.json(
      { error: "Missing attachmentId" },
      { status: 400 },
    );
  }

  const attachment = await db
    .selectFrom("attachments")
    .where("id", "=", attachmentId)
    .where("issue_id", "=", issueId)
    .select(["storage_key", "organization_id", "uploaded_by"])
    .executeTakeFirst();

  if (!attachment) {
    return NextResponse.json(
      { error: "Attachment not found" },
      { status: 404 },
    );
  }

  // Only the uploader or an org admin/owner can delete
  const member = await db
    .selectFrom("organization_members")
    .where("organization_id", "=", attachment.organization_id)
    .where("user_id", "=", session.user.id)
    .select(["id", "role"])
    .executeTakeFirst();

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const canDelete =
    attachment.uploaded_by === session.user.id ||
    member.role === "owner" ||
    member.role === "admin";

  if (!canDelete) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteFile(attachment.storage_key);
  await db.deleteFrom("attachments").where("id", "=", attachmentId).execute();

  return new NextResponse(null, { status: 204 });
}
