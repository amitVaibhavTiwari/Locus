import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const verifySession = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session;
});

export const getSessionUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  return db
    .selectFrom("users")
    .where("id", "=", session.user.id)
    .select(["id", "email", "username", "avatar_url"])
    .executeTakeFirst()
    .then((u) => u ?? null);
});

export const getActiveOrg = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const prefs = await db
    .selectFrom("user_preferences")
    .where("user_id", "=", session.user.id)
    .select(["active_organization_id"])
    .executeTakeFirst();

  if (!prefs?.active_organization_id) return null;

  const [org, workspacePrefs] = await Promise.all([
    db
      .selectFrom("organizations")
      .where("id", "=", prefs.active_organization_id)
      .select([
        "id",
        "name",
        "slug",
        "logo_url",
        "created_by",
        "created_at",
        "updated_at",
      ])
      .executeTakeFirst(),
    db
      .selectFrom("workspace_preferences")
      .where("organization_id", "=", prefs.active_organization_id)
      .select([
        "id",
        "organization_id",
        "display_name",
        "brand_color",
        "logo_url",
        "allow_admin_invite",
        "updated_at",
      ])
      .executeTakeFirst(),
  ]);

  if (!org) return null;
  return { ...org, workspacePrefs: workspacePrefs ?? null };
});

export const getCurrentUserOrgRole = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const prefs = await db
    .selectFrom("user_preferences")
    .where("user_id", "=", session.user.id)
    .select(["active_organization_id"])
    .executeTakeFirst();

  if (!prefs?.active_organization_id) return null;

  const member = await db
    .selectFrom("organization_members")
    .where("organization_id", "=", prefs.active_organization_id)
    .where("user_id", "=", session.user.id)
    .select(["role"])
    .executeTakeFirst();

  return member?.role ?? null;
});

export const getProjects = cache(async (orgId: string, userId: string) => {
  return db
    .selectFrom("projects")
    .where("organization_id", "=", orgId)
    .where("archived", "=", 0)
    .where((eb) =>
      eb.or([
        eb("visibility", "=", "public"),
        eb.exists(
          eb
            .selectFrom("project_members")
            .whereRef("project_members.project_id", "=", "projects.id")
            .where("project_members.user_id", "=", userId)
            .select("project_members.id"),
        ),
      ]),
    )
    .select([
      "id",
      "name",
      "key",
      "slug",
      "description",
      "visibility",
      "created_by",
      "created_at",
      "updated_at",
    ])
    .orderBy("created_at", "desc")
    .execute();
});

export const getProject = cache(
  async (projectId: string, orgId: string, userId: string) => {
    const project = await db
      .selectFrom("projects")
      .where("id", "=", projectId)
      .where("organization_id", "=", orgId)
      .selectAll()
      .executeTakeFirst();

    if (!project) return null;

    if (project.visibility === "private") {
      const membership = await db
        .selectFrom("project_members")
        .where("project_id", "=", projectId)
        .where("user_id", "=", userId)
        .select("id")
        .executeTakeFirst();
      if (!membership) return null;
    }

    return project;
  },
);

export const getProjectBoard = cache(async (projectId: string) => {
  const board = await db
    .selectFrom("boards")
    .where("project_id", "=", projectId)
    .select(["id", "name"])
    .executeTakeFirst();

  if (!board) return null;

  const columns = await db
    .selectFrom("columns")
    .where("board_id", "=", board.id)
    .select(["id", "name", "key", "order_index", "wip_limit"])
    .orderBy("order_index", "asc")
    .execute();

  return { ...board, columns };
});

export const getPinnedProjects = cache(
  async (userId: string, orgId: string) => {
    const prefs = await db
      .selectFrom("user_preferences")
      .where("user_id", "=", userId)
      .select(["pinned_project_ids"])
      .executeTakeFirst();

    const ids: string[] = JSON.parse(prefs?.pinned_project_ids ?? "[]");
    if (ids.length === 0) return [];

    const projects = await db
      .selectFrom("projects")
      .where("id", "in", ids)
      .where("organization_id", "=", orgId)
      .where("archived", "=", 0)
      .select(["id", "name"])
      .execute();

    const projectMap = new Map(projects.map((p) => [p.id, p]));
    return ids
      .filter((id) => projectMap.has(id))
      .map((id) => projectMap.get(id)!);
  },
);

export const getProjectSprints = cache(async (projectId: string) => {
  return db
    .selectFrom("sprints")
    .where("project_id", "=", projectId)
    .selectAll()
    .orderBy("created_at", "desc")
    .execute();
});

export const getActiveSprint = cache(async (projectId: string) => {
  const sprint = await db
    .selectFrom("sprints")
    .where("project_id", "=", projectId)
    .where("status", "=", "active")
    .selectAll()
    .executeTakeFirst();
  return sprint ?? null;
});

export const getSprintIssues = cache(async (sprintId: string) => {
  const issues = await db
    .selectFrom("issues")
    .where("sprint_id", "=", sprintId)
    .where("parent_issue_id", "is", null)
    .select([
      "id",
      "issue_number",
      "title",
      "description",
      "status",
      "priority",
      "type",
      "sprint_id",
      "assignee_id",
      "reporter_id",
      "due_date",
      "created_at",
      "completed_at",
    ])
    .orderBy("issue_number", "asc")
    .execute();

  if (issues.length === 0) return [];

  const userIds = new Set<string>();
  issues.forEach((i) => {
    if (i.assignee_id) userIds.add(i.assignee_id);
    if (i.reporter_id) userIds.add(i.reporter_id);
  });

  const users =
    userIds.size > 0
      ? await db
          .selectFrom("users")
          .where("id", "in", [...userIds])
          .select(["id", "username", "avatar_url"])
          .execute()
      : [];

  const userMap = new Map(users.map((u) => [u.id, u]));

  return issues.map((issue) => ({
    ...issue,
    assignee: issue.assignee_id
      ? (userMap.get(issue.assignee_id) ?? null)
      : null,
    reporter: issue.reporter_id
      ? (userMap.get(issue.reporter_id) ?? null)
      : null,
  }));
});

export const getBacklogIssues = cache(async (projectId: string) => {
  const issues = await db
    .selectFrom("issues")
    .where("project_id", "=", projectId)
    .where("sprint_id", "is", null)
    .where("parent_issue_id", "is", null)
    .select([
      "id",
      "issue_number",
      "title",
      "description",
      "status",
      "priority",
      "type",
      "assignee_id",
      "reporter_id",
      "due_date",
      "created_at",
    ])
    .orderBy("issue_number", "asc")
    .execute();

  if (issues.length === 0) return [];

  const userIds = new Set<string>();
  issues.forEach((i) => {
    if (i.assignee_id) userIds.add(i.assignee_id);
    if (i.reporter_id) userIds.add(i.reporter_id);
  });

  const users =
    userIds.size > 0
      ? await db
          .selectFrom("users")
          .where("id", "in", [...userIds])
          .select(["id", "username", "avatar_url"])
          .execute()
      : [];

  const userMap = new Map(users.map((u) => [u.id, u]));

  return issues.map((issue) => ({
    ...issue,
    assignee: issue.assignee_id
      ? (userMap.get(issue.assignee_id) ?? null)
      : null,
    reporter: issue.reporter_id
      ? (userMap.get(issue.reporter_id) ?? null)
      : null,
  }));
});

export const getProjectEpics = cache(async (projectId: string) => {
  const epics = await db
    .selectFrom("epics")
    .where("project_id", "=", projectId)
    .selectAll()
    .orderBy("created_at", "desc")
    .execute();

  if (epics.length === 0) return [];

  const epicIds = epics.map((e) => e.id);

  const issueRows = await db
    .selectFrom("issues")
    .where("epic_id", "in", epicIds)
    .select(["epic_id", "completed_at"])
    .execute();

  const totalMap = new Map<string, number>();
  const doneMap = new Map<string, number>();
  issueRows.forEach((row) => {
    const eid = row.epic_id;
    if (!eid) return;
    totalMap.set(eid, (totalMap.get(eid) ?? 0) + 1);
    if (row.completed_at !== null)
      doneMap.set(eid, (doneMap.get(eid) ?? 0) + 1);
  });

  const ownerIds = [
    ...new Set(epics.map((e) => e.owner_id).filter(Boolean)),
  ] as string[];
  const owners =
    ownerIds.length > 0
      ? await db
          .selectFrom("users")
          .where("id", "in", ownerIds)
          .select(["id", "username", "avatar_url"])
          .execute()
      : [];
  const ownerMap = new Map(owners.map((u) => [u.id, u]));

  return epics.map((epic) => ({
    ...epic,
    totalIssues: totalMap.get(epic.id) ?? 0,
    doneIssues: doneMap.get(epic.id) ?? 0,
    owner: epic.owner_id ? (ownerMap.get(epic.owner_id) ?? null) : null,
  }));
});

export const getEpic = cache(async (epicId: string) => {
  const epic = await db
    .selectFrom("epics")
    .where("id", "=", epicId)
    .selectAll()
    .executeTakeFirst();

  if (!epic) return null;

  let owner: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null = null;
  if (epic.owner_id) {
    owner =
      (await db
        .selectFrom("users")
        .where("id", "=", epic.owner_id)
        .select(["id", "username", "avatar_url"])
        .executeTakeFirst()) ?? null;
  }

  const issueRows = await db
    .selectFrom("issues")
    .where("epic_id", "=", epicId)
    .select(["id", "completed_at"])
    .execute();

  return {
    ...epic,
    owner,
    totalIssues: issueRows.length,
    doneIssues: issueRows.filter((i) => i.completed_at !== null).length,
  };
});

export const getEpicIssues = cache(async (epicId: string) => {
  const issues = await db
    .selectFrom("issues")
    .where("epic_id", "=", epicId)
    .select([
      "id",
      "issue_number",
      "title",
      "description",
      "status",
      "priority",
      "type",
      "assignee_id",
      "reporter_id",
      "due_date",
      "created_at",
    ])
    .orderBy("issue_number", "asc")
    .execute();

  if (issues.length === 0) return [];

  const userIds = new Set<string>();
  issues.forEach((i) => {
    if (i.assignee_id) userIds.add(i.assignee_id);
    if (i.reporter_id) userIds.add(i.reporter_id);
  });
  const users =
    userIds.size > 0
      ? await db
          .selectFrom("users")
          .where("id", "in", [...userIds])
          .select(["id", "username", "avatar_url"])
          .execute()
      : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const issueIds = issues.map((i) => i.id);
  const labelRows =
    issueIds.length > 0
      ? await db
          .selectFrom("issue_labels")
          .innerJoin("labels", "labels.id", "issue_labels.label_id")
          .where("issue_labels.issue_id", "in", issueIds)
          .select(["issue_labels.issue_id", "labels.name"])
          .execute()
      : [];
  const labelMap = new Map<string, string[]>();
  labelRows.forEach((r) => {
    const arr = labelMap.get(r.issue_id) ?? [];
    arr.push(r.name);
    labelMap.set(r.issue_id, arr);
  });

  return issues.map((i) => ({
    ...i,
    assignee: i.assignee_id ? (userMap.get(i.assignee_id) ?? null) : null,
    reporter: i.reporter_id ? (userMap.get(i.reporter_id) ?? null) : null,
    labels: labelMap.get(i.id) ?? [],
  }));
});

export const getProjectIssues = cache(async (projectId: string) => {
  const issues = await db
    .selectFrom("issues")
    .where("project_id", "=", projectId)
    .where("parent_issue_id", "is", null)
    .select([
      "id",
      "issue_number",
      "title",
      "description",
      "status",
      "priority",
      "type",
      "sprint_id",
      "epic_id",
      "assignee_id",
      "reporter_id",
      "due_date",
      "created_at",
    ])
    .orderBy("issue_number", "asc")
    .execute();

  if (issues.length === 0) return [];

  const userIds = new Set<string>();
  issues.forEach((i) => {
    if (i.assignee_id) userIds.add(i.assignee_id);
    if (i.reporter_id) userIds.add(i.reporter_id);
  });

  const users =
    userIds.size > 0
      ? await db
          .selectFrom("users")
          .where("id", "in", [...userIds])
          .select(["id", "username", "avatar_url"])
          .execute()
      : [];

  const userMap = new Map(users.map((u) => [u.id, u]));

  const issueIds = issues.map((i) => i.id);
  const labelRows =
    issueIds.length > 0
      ? await db
          .selectFrom("issue_labels")
          .innerJoin("labels", "labels.id", "issue_labels.label_id")
          .where("issue_labels.issue_id", "in", issueIds)
          .select(["issue_labels.issue_id", "labels.name"])
          .execute()
      : [];

  const labelMap = new Map<string, string[]>();
  labelRows.forEach((r) => {
    const arr = labelMap.get(r.issue_id) ?? [];
    arr.push(r.name);
    labelMap.set(r.issue_id, arr);
  });

  const epicIds = [
    ...new Set(issues.map((i) => i.epic_id).filter(Boolean)),
  ] as string[];
  const epicRows =
    epicIds.length > 0
      ? await db
          .selectFrom("epics")
          .where("id", "in", epicIds)
          .select(["id", "name"])
          .execute()
      : [];
  const epicMap = new Map(epicRows.map((e) => [e.id, e.name]));

  return issues.map((issue) => ({
    ...issue,
    assignee: issue.assignee_id
      ? (userMap.get(issue.assignee_id) ?? null)
      : null,
    reporter: issue.reporter_id
      ? (userMap.get(issue.reporter_id) ?? null)
      : null,
    labels: labelMap.get(issue.id) ?? [],
    sprint_id: issue.sprint_id,
    epic_id: issue.epic_id,
    epic_name: issue.epic_id ? (epicMap.get(issue.epic_id) ?? null) : null,
  }));
});

export const getIssue = cache(async (issueId: string) => {
  return db
    .selectFrom("issues")
    .where("id", "=", issueId)
    .selectAll()
    .executeTakeFirst()
    .then((i) => i ?? null);
});

export const getIssueActivities = cache(async (issueId: string) => {
  const activities = await db
    .selectFrom("activities")
    .where("issue_id", "=", issueId)
    .select(["id", "user_id", "type", "payload", "created_at"])
    .orderBy("created_at", "asc")
    .execute();

  if (activities.length === 0) return [];

  const userIds = [...new Set(activities.map((a) => a.user_id))];
  const users = await db
    .selectFrom("users")
    .where("id", "in", userIds)
    .select(["id", "username"])
    .execute();

  const userMap = new Map(users.map((u) => [u.id, u]));

  return activities.map((a) => ({
    ...a,
    user: userMap.get(a.user_id) ?? null,
    payloadParsed: JSON.parse(a.payload) as Record<string, unknown>,
  }));
});

export const getProjectMembers = cache(async (projectId: string) => {
  const members = await db
    .selectFrom("project_members")
    .where("project_id", "=", projectId)
    .select(["id", "user_id", "role", "joined_at"])
    .execute();

  if (members.length === 0) return [];

  const userIds = members.map((m) => m.user_id);
  const users = await db
    .selectFrom("users")
    .where("id", "in", userIds)
    .select(["id", "username", "email", "avatar_url"])
    .execute();

  const userMap = new Map(users.map((u) => [u.id, u]));

  return members.map((m) => ({
    memberId: m.id,
    userId: m.user_id,
    role: m.role,
    joined_at: m.joined_at,
    ...userMap.get(m.user_id)!,
  }));
});

export const getOrgMembers = cache(async (orgId: string) => {
  const members = await db
    .selectFrom("organization_members")
    .where("organization_id", "=", orgId)
    .select(["id", "user_id", "role", "joined_at"])
    .execute();

  if (members.length === 0) return [];

  const userIds = members.map((m) => m.user_id);
  const users = await db
    .selectFrom("users")
    .where("id", "in", userIds)
    .select(["id", "username", "email", "avatar_url"])
    .execute();

  const userMap = new Map(users.map((u) => [u.id, u]));

  return members.map((m) => ({
    memberId: m.id,
    userId: m.user_id,
    role: m.role,
    joined_at: m.joined_at,
    ...userMap.get(m.user_id)!,
  }));
});
