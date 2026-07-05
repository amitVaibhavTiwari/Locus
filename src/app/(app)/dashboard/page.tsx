import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  getActiveOrg,
  getMyAssignedIssues,
  getMyAssignedProjectNames,
  getSessionUser,
} from "@/lib/dal";
import { db } from "@/lib/db";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import type { NoteData, LinkData } from "@/components/dashboard/NotesSection";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; project?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const [org, user] = await Promise.all([getActiveOrg(), getSessionUser()]);
  if (!org || !user) redirect("/login");

  const search = params.q?.trim() || undefined;
  const project = params.project || undefined;
  const sort = params.sort || undefined;

  const [tasks, projects, rawNotes, rawLinks] = await Promise.all([
    getMyAssignedIssues(org.id, user.id, search, project, sort),
    getMyAssignedProjectNames(org.id, user.id),
    db
      .selectFrom("notes")
      .where("user_id", "=", user.id)
      .where("organization_id", "=", org.id)
      .selectAll()
      .orderBy("rank", "asc")
      .execute(),
    db
      .selectFrom("links")
      .where("user_id", "=", user.id)
      .where("organization_id", "=", org.id)
      .selectAll()
      .orderBy("rank", "asc")
      .execute(),
  ]);

  const noteIds = rawNotes.map((n) => n.id);
  const rawItems =
    noteIds.length > 0
      ? await db
          .selectFrom("note_items")
          .where("note_id", "in", noteIds)
          .selectAll()
          .orderBy("rank", "asc")
          .execute()
      : [];

  const itemsByNote = new Map<string, typeof rawItems>();
  for (const item of rawItems) {
    const arr = itemsByNote.get(item.note_id) ?? [];
    arr.push(item);
    itemsByNote.set(item.note_id, arr);
  }

  const notes: NoteData[] = rawNotes.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    content: n.content,
    items: (itemsByNote.get(n.id) ?? []).map((i) => ({
      id: i.id,
      text: i.text,
      checked: i.checked === 1,
      rank: i.rank,
    })),
    created_at: n.created_at,
  }));

  const links: LinkData[] = rawLinks.map((l) => ({
    id: l.id,
    label: l.label,
    url: l.url,
    tags: l.tags
      ? l.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
    rank: l.rank,
  }));

  return (
    <Suspense>
      <DashboardOverview
        tasks={tasks}
        username={user.username}
        initialNotes={notes}
        initialLinks={links}
        projects={projects}
      />
    </Suspense>
  );
}
