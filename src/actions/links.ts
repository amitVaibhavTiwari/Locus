"use server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession, getOrgIdFromRequest } from "@/lib/dal";
import type { LinkData } from "@/components/dashboard/NotesSection";

export async function createLink(data: {
  label: string;
  url: string;
  tags?: string;
}): Promise<{ error?: string; link?: LinkData }> {
  const session = await verifySession();
  const orgId = await getOrgIdFromRequest();
  if (!orgId) return { error: "No active workspace" };

  const userId = session.user!.id;

  const maxRankRow = await db
    .selectFrom("links")
    .where("user_id", "=", userId)
    .where("organization_id", "=", orgId)
    .select((eb) => eb.fn.max("rank").as("max_rank"))
    .executeTakeFirst();
  const rank = (maxRankRow?.max_rank ?? -1) + 1;

  const id = randomUUID();
  const now = new Date().toISOString();
  const tagsStr = data.tags?.trim() || null;

  await db
    .insertInto("links")
    .values({
      id,
      user_id: userId,
      organization_id: orgId,
      label: data.label,
      url: data.url,
      tags: tagsStr,
      rank,
      created_at: now,
      updated_at: now,
    })
    .execute();

  revalidatePath("/dashboard");
  return {
    link: {
      id,
      label: data.label,
      url: data.url,
      tags: tagsStr
        ? tagsStr
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      rank,
    },
  };
}

export async function updateLink(
  linkId: string,
  data: { label: string; url: string; tags?: string },
): Promise<{ error?: string }> {
  const session = await verifySession();
  const userId = session.user!.id;

  const link = await db
    .selectFrom("links")
    .where("id", "=", linkId)
    .where("user_id", "=", userId)
    .select("id")
    .executeTakeFirst();
  if (!link) return { error: "Link not found" };

  await db
    .updateTable("links")
    .set({
      label: data.label,
      url: data.url,
      tags: data.tags?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .where("id", "=", linkId)
    .execute();

  revalidatePath("/dashboard");
  return {};
}

export async function deleteLink(linkId: string): Promise<{ error?: string }> {
  const session = await verifySession();
  const userId = session.user!.id;

  await db
    .deleteFrom("links")
    .where("id", "=", linkId)
    .where("user_id", "=", userId)
    .execute();

  revalidatePath("/dashboard");
  return {};
}

export async function reorderLinks(ids: string[]): Promise<void> {
  const session = await verifySession();
  const userId = session.user!.id;

  await Promise.all(
    ids.map((id, index) =>
      db
        .updateTable("links")
        .set({ rank: index, updated_at: new Date().toISOString() })
        .where("id", "=", id)
        .where("user_id", "=", userId)
        .execute(),
    ),
  );
}
