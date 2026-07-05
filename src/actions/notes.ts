"use server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession, getActiveOrg } from "@/lib/dal";
import type { NoteData } from "@/components/dashboard/NotesSection";

export async function createNote(data: {
  type: "text" | "checklist";
  title: string;
  content?: string;
  items?: string[];
}): Promise<{ error?: string; note?: NoteData }> {
  const session = await verifySession();
  const org = await getActiveOrg();
  if (!org) return { error: "No active workspace" };

  const userId = session.user!.id;

  const maxRankRow = await db
    .selectFrom("notes")
    .where("user_id", "=", userId)
    .where("organization_id", "=", org.id)
    .select((eb) => eb.fn.max("rank").as("max_rank"))
    .executeTakeFirst();
  const rank = (maxRankRow?.max_rank ?? -1) + 1;

  const id = randomUUID();
  const now = new Date().toISOString();

  await db
    .insertInto("notes")
    .values({
      id,
      user_id: userId,
      organization_id: org.id,
      type: data.type,
      title: data.title,
      content: data.content ?? null,
      rank,
      created_at: now,
      updated_at: now,
    })
    .execute();

  const items: NoteData["items"] = [];
  if (data.type === "checklist" && data.items && data.items.length > 0) {
    const filtered = data.items.filter((t) => t.trim());
    if (filtered.length > 0) {
      const rows = filtered.map((text, index) => ({
        id: randomUUID(),
        note_id: id,
        text,
        checked: 0,
        rank: index,
        created_at: now,
      }));
      await db.insertInto("note_items").values(rows).execute();
      rows.forEach((r) =>
        items.push({ id: r.id, text: r.text, checked: false, rank: r.rank }),
      );
    }
  }

  revalidatePath("/dashboard");
  return {
    note: {
      id,
      type: data.type,
      title: data.title,
      content: data.content ?? null,
      items,
      created_at: now,
    },
  };
}

export async function updateNote(
  noteId: string,
  data: {
    title: string;
    type: "text" | "checklist";
    content?: string;
    items?: { text: string; checked: boolean }[];
  },
): Promise<{ error?: string }> {
  const session = await verifySession();
  const userId = session.user!.id;

  const note = await db
    .selectFrom("notes")
    .where("id", "=", noteId)
    .where("user_id", "=", userId)
    .select("id")
    .executeTakeFirst();
  if (!note) return { error: "Note not found" };

  const now = new Date().toISOString();

  await db
    .updateTable("notes")
    .set({
      title: data.title,
      type: data.type,
      content: data.type === "text" ? (data.content ?? null) : null,
      updated_at: now,
    })
    .where("id", "=", noteId)
    .execute();

  await db.deleteFrom("note_items").where("note_id", "=", noteId).execute();

  if (data.type === "checklist" && data.items && data.items.length > 0) {
    const filtered = data.items.filter((i) => i.text.trim());
    if (filtered.length > 0) {
      await db
        .insertInto("note_items")
        .values(
          filtered.map((item, index) => ({
            id: randomUUID(),
            note_id: noteId,
            text: item.text,
            checked: item.checked ? 1 : 0,
            rank: index,
            created_at: now,
          })),
        )
        .execute();
    }
  }

  revalidatePath("/dashboard");
  return {};
}

export async function deleteNote(noteId: string): Promise<{ error?: string }> {
  const session = await verifySession();
  const userId = session.user!.id;

  await db
    .deleteFrom("notes")
    .where("id", "=", noteId)
    .where("user_id", "=", userId)
    .execute();

  revalidatePath("/dashboard");
  return {};
}

export async function reorderNotes(ids: string[]): Promise<void> {
  const session = await verifySession();
  const userId = session.user!.id;

  await Promise.all(
    ids.map((id, index) =>
      db
        .updateTable("notes")
        .set({ rank: index, updated_at: new Date().toISOString() })
        .where("id", "=", id)
        .where("user_id", "=", userId)
        .execute(),
    ),
  );
}

export async function toggleNoteItem(
  noteId: string,
  itemId: string,
): Promise<{ error?: string }> {
  const session = await verifySession();
  const userId = session.user!.id;

  const note = await db
    .selectFrom("notes")
    .where("id", "=", noteId)
    .where("user_id", "=", userId)
    .select("id")
    .executeTakeFirst();
  if (!note) return { error: "Note not found" };

  const item = await db
    .selectFrom("note_items")
    .where("id", "=", itemId)
    .where("note_id", "=", noteId)
    .select(["id", "checked"])
    .executeTakeFirst();
  if (!item) return { error: "Item not found" };

  await db
    .updateTable("note_items")
    .set({ checked: item.checked ? 0 : 1 })
    .where("id", "=", itemId)
    .execute();

  revalidatePath("/dashboard");
  return {};
}
