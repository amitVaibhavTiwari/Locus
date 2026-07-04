import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

async function main() {
  console.log("Seeding database...");

  const userId = randomUUID();
  const orgId = randomUUID();
  const project1Id = randomUUID();
  const project2Id = randomUUID();
  const board1Id = randomUUID();
  const board2Id = randomUUID();
  const now = new Date().toISOString();

  await db
    .insertInto("users")
    .values({
      id: userId,
      email: "admin@example.com",
      username: "Admin",
      password_hash: await bcrypt.hash("password123", 12),
      avatar_url: null,
      email_verified_at: now,
      created_at: now,
      updated_at: now,
    })
    .execute();

  await db
    .insertInto("organizations")
    .values({
      id: orgId,
      name: "My Workspace",
      slug: "my-workspace",
      logo_url: null,
      created_by: userId,
      created_at: now,
      updated_at: now,
    })
    .execute();

  await db
    .insertInto("organization_members")
    .values({
      id: randomUUID(),
      organization_id: orgId,
      user_id: userId,
      role: "owner",
      joined_at: now,
      last_active_at: now,
    })
    .execute();

  await db
    .insertInto("workspace_preferences")
    .values({
      id: randomUUID(),
      organization_id: orgId,
      display_name: "My Workspace",
      brand_color: "hsl(25 95% 53%)",
      logo_url: null,
      allow_admin_invite: 0,
      updated_at: now,
    })
    .execute();

  await db
    .insertInto("user_preferences")
    .values({
      id: randomUUID(),
      user_id: userId,
      pinned_project_ids: JSON.stringify([project1Id]),
      active_organization_id: orgId,
      updated_at: now,
    })
    .execute();

  // --- Projects ---

  await db
    .insertInto("projects")
    .values({
      id: project1Id,
      organization_id: orgId,
      name: "E-commerce Platform",
      key: "EP",
      slug: "e-commerce-platform",
      description: "Complete e-commerce solution with payment integration",
      visibility: "private",
      priority: null,
      archived: 0,
      allow_delete_tickets: 0,
      allow_manage_sprint: 1,
      allow_members_edit: 0,
      created_by: userId,
      created_at: now,
      updated_at: now,
    })
    .execute();

  await db
    .insertInto("projects")
    .values({
      id: project2Id,
      organization_id: orgId,
      name: "Mobile App Redesign",
      key: "MAR",
      slug: "mobile-app-redesign",
      description: "Modernizing the mobile app interface and user experience",
      visibility: "private",
      priority: null,
      archived: 0,
      allow_delete_tickets: 0,
      allow_manage_sprint: 1,
      allow_members_edit: 0,
      created_by: userId,
      created_at: now,
      updated_at: now,
    })
    .execute();

  await db
    .insertInto("project_members")
    .values([
      {
        id: randomUUID(),
        project_id: project1Id,
        user_id: userId,
        role: "manager",
        joined_at: now,
      },
      {
        id: randomUUID(),
        project_id: project2Id,
        user_id: userId,
        role: "manager",
        joined_at: now,
      },
    ])
    .execute();

  // --- Boards & Columns ---

  await db
    .insertInto("boards")
    .values([
      {
        id: board1Id,
        project_id: project1Id,
        name: "Main Board",
        created_at: now,
      },
      {
        id: board2Id,
        project_id: project2Id,
        name: "Main Board",
        created_at: now,
      },
    ])
    .execute();

  const defaultColumns = [
    { name: "Todo", key: "todo" },
    { name: "In Progress", key: "in-progress" },
    { name: "In QA", key: "qa" },
    { name: "Pending Deployment", key: "pending" },
    { name: "Done", key: "done" },
  ];

  const board1Cols: Record<string, string> = {};
  const board2Cols: Record<string, string> = {};

  for (let i = 0; i < defaultColumns.length; i++) {
    const col = defaultColumns[i];
    const col1Id = randomUUID();
    const col2Id = randomUUID();
    board1Cols[col.key] = col1Id;
    board2Cols[col.key] = col2Id;

    await db
      .insertInto("columns")
      .values([
        {
          id: col1Id,
          board_id: board1Id,
          name: col.name,
          key: col.key,
          order_index: i,
          wip_limit: null,
          created_at: now,
        },
        {
          id: col2Id,
          board_id: board2Id,
          name: col.name,
          key: col.key,
          order_index: i,
          wip_limit: null,
          created_at: now,
        },
      ])
      .execute();
  }

  // --- Sample Issues (project 1) ---

  const sampleIssues = [
    {
      title: "User Authentication System",
      status: "todo",
      priority: "high",
      type: "task" as const,
    },
    {
      title: "Dashboard UI Components",
      status: "in-progress",
      priority: "medium",
      type: "story" as const,
    },
    {
      title: "API Documentation",
      status: "qa",
      priority: "low",
      type: "task" as const,
    },
    {
      title: "Performance Optimization",
      status: "pending",
      priority: "high",
      type: "task" as const,
    },
    {
      title: "User Onboarding Flow",
      status: "done",
      priority: "medium",
      type: "story" as const,
    },
    {
      title: "Payment Gateway Integration",
      status: "todo",
      priority: "high",
      type: "task" as const,
    },
    {
      title: "Fix checkout bug on mobile",
      status: "in-progress",
      priority: "high",
      type: "bug" as const,
    },
    {
      title: "Write unit tests for cart",
      status: "qa",
      priority: "medium",
      type: "task" as const,
    },
  ];

  for (let i = 0; i < sampleIssues.length; i++) {
    const issue = sampleIssues[i];
    await db
      .insertInto("issues")
      .values({
        id: randomUUID(),
        organization_id: orgId,
        project_id: project1Id,
        board_id: board1Id,
        column_id: board1Cols[issue.status],
        parent_issue_id: null,
        issue_number: i + 1,
        title: issue.title,
        description: null,
        type: issue.type,
        status: issue.status,
        priority: issue.priority,
        reporter_id: userId,
        assignee_id: userId,
        due_date: null,
        completed_at: null,
        edit_permission: "anyone",
        archived: 0,
        archived_at: null,
        created_at: now,
        updated_at: now,
      })
      .execute();
  }

  console.log("Seed complete");
  console.log(`  User:     admin@example.com / password123`);
  console.log(`  Org:      My Workspace (${orgId})`);
  console.log(`  Project1: E-commerce Platform (${project1Id})`);
  console.log(`  Project2: Mobile App Redesign (${project2Id})`);
  await db.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
