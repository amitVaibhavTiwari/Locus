import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { after } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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

  const comments = await db
    .selectFrom("issue_comments")
    .innerJoin("users", "users.id", "issue_comments.user_id")
    .where("issue_comments.issue_id", "=", issueId)
    .select([
      "issue_comments.id",
      "issue_comments.body",
      "issue_comments.user_id",
      "issue_comments.edited_at",
      "issue_comments.created_at",
      "users.username",
      "users.avatar_url",
    ])
    .orderBy("issue_comments.created_at", "asc")
    .execute();

  const currentUser = await db
    .selectFrom("users")
    .where("id", "=", session.user.id)
    .select(["username"])
    .executeTakeFirst();

  return NextResponse.json({
    comments: comments.map((c) => ({
      ...c,
      is_own: c.user_id === session.user.id,
    })),
    currentUsername: currentUser?.username ?? null,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { issueId } = await params;
    const { body } = await req.json().catch(() => ({}));

    if (!body?.trim()) {
      return NextResponse.json(
        { error: "Comment body required" },
        { status: 400 },
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

    const id = randomUUID();
    const now = new Date().toISOString();

    await db
      .insertInto("issue_comments")
      .values({
        id,
        issue_id: issueId,
        organization_id: issue.organization_id,
        user_id: session.user.id,
        body: body.trim(),
        edited_at: null,
        created_at: now,
        updated_at: now,
      })
      .execute();

    const user = await db
      .selectFrom("users")
      .where("id", "=", session.user.id)
      .select(["username", "avatar_url"])
      .executeTakeFirst();

    after(async () => {
      await db
        .insertInto("activities")
        .values({
          id: randomUUID(),
          organization_id: issue.organization_id,
          project_id: issue.project_id,
          issue_id: issueId,
          user_id: session.user.id,
          type: "commented",
          payload: JSON.stringify({ preview: body.trim().slice(0, 100) }),
          created_at: new Date().toISOString(),
        })
        .execute();
    });

    return NextResponse.json(
      {
        id,
        body: body.trim(),
        user_id: session.user.id,
        edited_at: null,
        created_at: now,
        username: user?.username ?? "Unknown",
        avatar_url: user?.avatar_url ?? null,
        is_own: true,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[comments POST] error:", err);
    return NextResponse.json(
      { error: "Failed to post comment" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { issueId } = await params;
    const commentId = req.nextUrl.searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json({ error: "Missing commentId" }, { status: 400 });
    }

    const comment = await db
      .selectFrom("issue_comments")
      .where("id", "=", commentId)
      .where("issue_id", "=", issueId)
      .select(["user_id", "organization_id"])
      .executeTakeFirst();

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const member = await db
      .selectFrom("organization_members")
      .where("organization_id", "=", comment.organization_id)
      .where("user_id", "=", session.user.id)
      .select(["id", "role"])
      .executeTakeFirst();

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const canDelete =
      comment.user_id === session.user.id ||
      member.role === "owner" ||
      member.role === "admin";

    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.deleteFrom("issue_comments").where("id", "=", commentId).execute();

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[comments DELETE] error:", err);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 },
    );
  }
}
