import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

export interface NotifyPayload {
  type: string;
  title: string;
  body: string;
  url?: string;
  entityType?: string;
  entityId?: string;
}

export async function notify(
  userId: string,
  organizationId: string,
  payload: NotifyPayload,
): Promise<void> {
  const now = new Date().toISOString();

  await db
    .insertInto("notifications")
    .values({
      id: randomUUID(),
      user_id: userId,
      organization_id: organizationId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      url: payload.url ?? null,
      entity_type: payload.entityType ?? null,
      entity_id: payload.entityId ?? null,
      is_read: 0,
      created_at: now,
    })
    .execute();

  await sendPushToUser(userId, organizationId, {
    title: payload.title,
    body: payload.body,
    url: payload.url,
  });
}
