"use client";
import React, { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  Calendar,
  Shield,
  Save,
  X,
  Pencil,
  Camera,
  ImagePlus,
} from "lucide-react";

const teamMembers = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah@company.com",
    role: "Admin",
    initials: "SJ",
    joinDate: "2023-01-15",
  },
  {
    id: "2",
    name: "Mike Harrison",
    email: "mike@company.com",
    role: "Member",
    initials: "MH",
    joinDate: "2023-03-20",
  },
];

const TeamMemberProfile = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const member = teamMembers.find((m) => m.id === id);

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(member?.name.split(" ")[0] || "");
  const [lastName, setLastName] = useState(member?.name.split(" ")[1] || "");
  const [displayName, setDisplayName] = useState(member?.name || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  if (!member) {
    return <div className="p-6">Member not found</div>;
  }

  const handleSave = () => {
    toast({
      title: "Profile updated",
      description: "Your changes have been saved successfully",
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFirstName(member.name.split(" ")[0]);
    setLastName(member.name.split(" ")[1]);
    setDisplayName(member.name);
    setIsEditing(false);
  };

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

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full py-6 px-4 lg:px-8 max-w-5xl">
        {/* Header banner */}
        <div className="relative mb-20">
          <div
            className="h-40 rounded-md border border-border overflow-hidden bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5"
            style={
              bannerUrl
                ? {
                    backgroundImage: `url(${bannerUrl})`,
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
            onChange={(e) => handleFile(e, setBannerUrl)}
          />

          <div className="absolute -bottom-14 left-6 flex items-end gap-4">
            <div className="relative">
              <Avatar className="w-28 h-28 ring-4 ring-background">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                  {member.initials}
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
                onChange={(e) => handleFile(e, setAvatarUrl)}
              />
            </div>
          </div>

          {!isEditing && (
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
            <h1 className="text-3xl font-bold">
              {displayName || `${firstName} ${lastName}`}
            </h1>
            <Badge variant="secondary" className="gap-1">
              <Shield className="w-3 h-3" />
              {member.role}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{member.email}</p>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Personal Information
            </h2>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={!isEditing}
                placeholder="How your name appears to others"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Account Details
            </h2>
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center gap-2 px-3 py-2 border rounded bg-muted/40">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{member.email}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex items-center gap-2 px-3 py-2 border rounded bg-muted/40">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{member.role}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Join Date</Label>
              <div className="flex items-center gap-2 px-3 py-2 border rounded bg-muted/40">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {new Date(member.joinDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-2 mt-8 px-2">
            <Button onClick={handleSave} size="sm">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamMemberProfile;
