"use client";
import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from "@/actions/profile";
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
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProfileClient({
  user,
  role,
  joinedAt,
  isOwnProfile,
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
