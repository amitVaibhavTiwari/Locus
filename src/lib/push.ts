import webpush from "web-push";
import { db } from "@/lib/db";

if (
  process.env.VAPID_SUBJECT &&
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

export function isPushConfigured(): boolean {
  return !!(
    process.env.VAPID_SUBJECT &&
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushToUser(
  userId: string,
  orgId: string,
  payload: PushPayload,
): Promise<void> {
  if (!isPushConfigured()) return;

  const subscriptions = await db
    .selectFrom("push_subscriptions")
    .where("user_id", "=", userId)
    .where("organization_id", "=", orgId)
    .where("is_valid", "=", 1)
    .select(["id", "endpoint", "p256dh", "auth"])
    .execute();

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        // 410 Gone means subscription expired or user revoked permission
        // In this case we mark invalid instead of deleting full row so status API knows user previously allowed and we can silently re register if endpoint rotates (browser update, something goes wrong, act of god, etc)
        if (statusCode === 410) {
          await db
            .updateTable("push_subscriptions")
            .set({ is_valid: 0 })
            .where("id", "=", sub.id)
            .execute();
        }
      }
    }),
  );
}
