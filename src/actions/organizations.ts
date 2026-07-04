"use server";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";

const WorkspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(100),
  slug: z
    .string()
    .min(1, "Workspace URL is required")
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Only lowercase letters, numbers, and hyphens allowed",
    ),
  brand_color: z.string().optional(),
});

export type CreateWorkspaceState =
  | {
      errors?: { name?: string[]; slug?: string[] };
      error?: string;
    }
  | undefined;

export async function createWorkspace(
  state: CreateWorkspaceState,
  formData: FormData,
): Promise<CreateWorkspaceState> {
  const session = await verifySession();

  const parsed = WorkspaceSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    brand_color: formData.get("brand_color") || undefined,
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors as {
        name?: string[];
        slug?: string[];
      },
    };
  }

  const { name, slug, brand_color } = parsed.data;

  const existing = await db
    .selectFrom("organizations")
    .where("slug", "=", slug)
    .select(["id"])
    .executeTakeFirst();

  if (existing) {
    return {
      errors: { slug: ["This URL is already taken. Try a different one."] },
    };
  }

  const orgId = randomUUID();
  const now = new Date().toISOString();

  await db.transaction().execute(async (trx) => {
    await trx
      .insertInto("organizations")
      .values({
        id: orgId,
        name,
        slug,
        logo_url: null,
        created_by: session.user.id,
        created_at: now,
        updated_at: now,
      })
      .execute();

    await trx
      .insertInto("organization_members")
      .values({
        id: randomUUID(),
        organization_id: orgId,
        user_id: session.user.id,
        role: "owner",
        joined_at: now,
        last_active_at: now,
      })
      .execute();

    await trx
      .insertInto("workspace_preferences")
      .values({
        id: randomUUID(),
        organization_id: orgId,
        display_name: name,
        brand_color: brand_color ?? "hsl(25 95% 53%)",
        logo_url: null,
        allow_admin_invite: 0,
        updated_at: now,
      })
      .execute();

    await trx
      .updateTable("user_preferences")
      .set({ active_organization_id: orgId, updated_at: now })
      .where("user_id", "=", session.user.id)
      .execute();
  });

  redirect("/onboarding/invite");
}

export type UpdateWorkspaceSettingsState = { error?: string } | undefined;

export async function updateWorkspaceSettings(
  state: UpdateWorkspaceSettingsState,
  formData: FormData,
): Promise<UpdateWorkspaceSettingsState> {
  const session = await verifySession();

  const name = formData.get("name")?.toString().trim();
  if (!name) return { error: "Workspace name is required" };

  const brandColor = formData.get("brand_color")?.toString() || null;
  const allowAdminInvite = formData.get("allow_admin_invite") === "1" ? 1 : 0;

  const prefs = await db
    .selectFrom("user_preferences")
    .where("user_id", "=", session.user.id)
    .select(["active_organization_id"])
    .executeTakeFirst();

  if (!prefs?.active_organization_id)
    return { error: "No active workspace found" };

  const orgId = prefs.active_organization_id;

  // Only owners can update workspace settings
  const membership = await db
    .selectFrom("organization_members")
    .where("organization_id", "=", orgId)
    .where("user_id", "=", session.user.id)
    .select(["role"])
    .executeTakeFirst();

  if (membership?.role !== "owner")
    return { error: "Only workspace owners can change settings" };

  const now = new Date().toISOString();

  await db.transaction().execute(async (trx) => {
    await trx
      .updateTable("organizations")
      .set({ name, updated_at: now })
      .where("id", "=", orgId)
      .execute();

    await trx
      .updateTable("workspace_preferences")
      .set({
        display_name: name,
        brand_color: brandColor,
        allow_admin_invite: allowAdminInvite,
        updated_at: now,
      })
      .where("organization_id", "=", orgId)
      .execute();
  });

  revalidatePath("/", "layout");
  return undefined;
}

export async function switchWorkspace(orgId: string): Promise<void> {
  const session = await verifySession();

  const membership = await db
    .selectFrom("organization_members")
    .where("organization_id", "=", orgId)
    .where("user_id", "=", session.user.id)
    .select(["id"])
    .executeTakeFirst();

  if (!membership) return;

  await db
    .updateTable("user_preferences")
    .set({ active_organization_id: orgId, updated_at: new Date().toISOString() })
    .where("user_id", "=", session.user.id)
    .execute();

  redirect("/dashboard");
}
