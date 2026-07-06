"use client";
import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const REJECTED_KEY = (orgId: string) => `push_rejected_${orgId}`;

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer as ArrayBuffer;
}

async function registerSubscription(orgId: string): Promise<void> {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return;

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...sub.toJSON(), orgId }),
  });
}

export function PushNotificationManager({
  activeOrgId,
}: {
  activeOrgId: string;
}) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (
      !vapidKey ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator)
    )
      return;

    // this is browser level denying (we can't do anything here so let's go back)
    if (Notification.permission === "denied") return;

    if (localStorage.getItem(REJECTED_KEY(activeOrgId))) return;

    navigator.serviceWorker.register("/sw.js").catch(console.error);

    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      const endpoint = sub?.endpoint ?? null;

      const params = new URLSearchParams({ orgId: activeOrgId });
      if (endpoint) params.set("endpoint", endpoint);

      const res = await fetch(`/api/push/status?${params}`);
      const { isValid, everAllowed } = (await res.json()) as {
        isValid: boolean | null;
        everAllowed: boolean;
      };

      if (isValid === true) {
        return;
      }

      if (isValid === false) {
        //  workspace is same but endpoint got invalidated so re registering silently. (I have no idea weather this case will ever happen or not but just in case for protection)
        await registerSubscription(activeOrgId);
        return;
      }

      // isValid === null: no record for this endpoint + workspace
      if (everAllowed && Notification.permission === "granted") {
        // This is a very interesting case: user has allowed push for this workspace but the endpoint got rotated (maybe due to browser update or something else). Now when we try to check in DB there is no record with the newer push endpoint of browser but since there is a record for this workspace with some older endpoint we can assume that the user has allowed push for this workspace and now we can re-register the new endpoint silently without showing the banner again.
        await registerSubscription(activeOrgId);
        return;
      }

      //   no record means new user, show popup
      setShowBanner(true);
    });
  }, [activeOrgId]);

  async function handleEnable() {
    setShowBanner(false);
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      localStorage.setItem(REJECTED_KEY(activeOrgId), "1");
      return;
    }
    await registerSubscription(activeOrgId);
  }

  function handleDismiss() {
    setShowBanner(false);
    localStorage.setItem(REJECTED_KEY(activeOrgId), "1");
  }

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      <div className="relative z-10 w-full max-w-sm mx-4 rounded-xl border border-border bg-background shadow-2xl p-6 flex flex-col gap-4">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center gap-3 pt-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Enable notifications</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Get notified about task assignments, sprint updates, mentions and
              more.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-1">
          <Button className="w-full h-10" onClick={handleEnable}>
            Enable notifications
          </Button>
          <Button
            variant="ghost"
            className="w-full h-10"
            onClick={handleDismiss}
          >
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}
