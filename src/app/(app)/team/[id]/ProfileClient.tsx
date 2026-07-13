"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from "@/actions/profile";
import { getInitials } from "@/lib/utils";
import {
  Mail,
  Calendar,
  Shield,
  Save,
  X,
  Pencil,
  Camera,
  ImagePlus,
  Loader2,
  Bell,
  BellOff,
} from "lucide-react";

interface ProfileUser {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
}

interface ProfileClientProps {
  user: ProfileUser;
  role: string;
  joinedAt: string | null;
  isOwnProfile: boolean;
  activeOrgId: string | null;
}

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer as ArrayBuffer;
}

function NotificationSection({ activeOrgId }: { activeOrgId: string }) {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setLoading(false);
      return;
    }
    setPermission(Notification.permission);

    navigator.serviceWorker.register("/sw.js").catch(console.error);

    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      const endpoint = sub?.endpoint ?? null;
      setCurrentEndpoint(endpoint);

      const params = new URLSearchParams({ orgId: activeOrgId });
      if (endpoint) params.set("endpoint", endpoint);

      const res = await fetch(`/api/push/status?${params}`);
      const data = (await res.json()) as {
        isValid: boolean | null;
        everAllowed: boolean;
      };
      setSubscribed(data.isValid === true);
      setLoading(false);
    });
  }, [activeOrgId]);

  async function handleToggle(enabled: boolean) {
    setLoading(true);
    try {
      if (enabled) {
        const perm = await Notification.requestPermission();
        setPermission(perm);
        if (perm !== "granted") return;

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) return;

        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        setCurrentEndpoint(sub.endpoint);

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...sub.toJSON(), orgId: activeOrgId }),
        });

        localStorage.removeItem(`push_rejected_${activeOrgId}`);
        setSubscribed(true);
      } else {
        if (currentEndpoint) {
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              endpoint: currentEndpoint,
              orgId: activeOrgId,
            }),
          });
        }
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        await sub?.unsubscribe();
        setCurrentEndpoint(null);
        setSubscribed(false);
      }
    } finally {
      setLoading(false);
    }
  }

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return null;

  return (
    <div className="space-y-5">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Notifications
      </h2>

      <div className="flex items-center justify-between gap-4 px-3 py-3 border rounded bg-muted/20">
        <div className="flex items-start gap-3">
          {subscribed ? (
            <Bell className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          ) : (
            <BellOff className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          )}
          <div>
            <p className="text-sm font-medium">Push notifications</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {permission === "denied"
                ? "Blocked in browser — enable in browser site settings"
                : subscribed
                  ? "You'll receive alerts for task assignments and updates"
                  : "Enable to get notified even when the app is closed"}
            </p>
          </div>
        </div>

        {permission === "denied" ? (
          <span className="text-xs text-destructive font-medium shrink-0">
            Blocked
          </span>
        ) : (
          <Switch
            checked={subscribed}
            disabled={loading}
            onCheckedChange={handleToggle}
          />
        )}
      </div>
    </div>
  );
}

export function ProfileClient({
  user,
  role,
  joinedAt,
  isOwnProfile,
  activeOrgId,
}: ProfileClientProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [state, action, isPending] = useActionState(
    async (prev: { error?: string } | undefined, formData: FormData) => {
      const result = await updateProfile(prev, formData);
      if (!result?.error) {
        toast({
          title: "Profile updated",
          description: "Your changes have been saved.",
        });
        setIsEditing(false);
      }
      return result;
    },
    undefined,
  );

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarPreview(null);
    setBannerPreview(null);
  };

  const initials = getInitials(user.username);

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full py-6 px-4 lg:px-8">
        {/* Banner */}
        <div className="relative mb-20">
          <div
            className="h-40 rounded-md border border-border overflow-hidden bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5"
            style={
              bannerPreview
                ? {
                    backgroundImage: `url(${bannerPreview})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          />
          {isEditing && (
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="absolute top-4 left-4 inline-flex items-center gap-2 rounded bg-background/80 backdrop-blur px-3 py-1.5 text-xs font-medium border border-border hover:bg-background"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              Change cover
            </button>
          )}
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e, setBannerPreview)}
          />

          {/* Avatar */}
          <div className="absolute -bottom-14 left-6">
            <div className="relative">
              <Avatar className="w-28 h-28 ring-4 ring-background">
                {(avatarPreview || user.avatar_url) && (
                  <AvatarImage
                    src={avatarPreview ?? user.avatar_url!}
                    alt={user.username}
                  />
                )}
                <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-1 right-1 inline-flex items-center justify-center w-8 h-8 rounded bg-primary text-primary-foreground border-2 border-background hover:opacity-90"
                  aria-label="Change avatar"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e, setAvatarPreview)}
              />
            </div>
          </div>

          {isOwnProfile && !isEditing && (
            <div className="absolute top-4 right-4">
              <Button
                onClick={() => setIsEditing(true)}
                size="sm"
                variant="secondary"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          )}
        </div>

        {/* Name & role */}
        <div className="mb-8 px-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">{user.username}</h1>
            <Badge variant="secondary" className="gap-1">
              <Shield className="w-3 h-3" />
              {role}
            </Badge>
            {isOwnProfile && (
              <span className="text-sm text-muted-foreground border border-border rounded px-2 py-0.5">
                You
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1">{user.email}</p>
        </div>

        {/* Details grid */}
        <form action={action}>
          <input type="hidden" name="user_id" value={user.id} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
            {/* Left side */}
            <div className="space-y-5">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Personal Information
              </h2>

              <div className="space-y-2">
                <Label htmlFor="username">Display Name</Label>
                <Input
                  id="username"
                  name="username"
                  defaultValue={user.username}
                  disabled={!isEditing}
                  placeholder="How your name appears to others"
                />
                {state?.error && (
                  <p className="text-xs text-destructive">{state.error}</p>
                )}
              </div>
            </div>

            {/* Right side */}
            <div className="space-y-5">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Account Details
              </h2>

              <div className="space-y-2">
                <Label>Email</Label>
                <div className="flex items-center gap-2 px-3 py-2 border rounded bg-muted/40">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{user.email}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <div className="flex items-center gap-2 px-3 py-2 border rounded bg-muted/40">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{role}</span>
                </div>
              </div>

              {joinedAt && (
                <div className="space-y-2">
                  <Label>Member Since</Label>
                  <div className="flex items-center gap-2 px-3 py-2 border rounded bg-muted/40">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(joinedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {isOwnProfile && activeOrgId && (
            <div className="mt-8 px-2">
              <NotificationSection activeOrgId={activeOrgId} />
            </div>
          )}

          {isEditing && (
            <div className="flex gap-2 mt-8 px-2">
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isPending}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
