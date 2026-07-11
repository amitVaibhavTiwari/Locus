"use client";
import { create } from "zustand";

interface UserState {
  id: string | null;
  username: string | null;
  email: string | null;
  avatarUrl: string | null;
  orgRole: "owner" | "admin" | "member" | "viewer" | null;
  activeOrgId: string | null;
  setUser: (data: {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
    orgRole: "owner" | "admin" | "member" | "viewer";
    activeOrgId: string;
  }) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  id: null,
  username: null,
  email: null,
  avatarUrl: null,
  orgRole: null,
  activeOrgId: null,

  setUser: (data) =>
    set({
      id: data.id,
      username: data.username,
      email: data.email,
      avatarUrl: data.avatarUrl,
      orgRole: data.orgRole,
      activeOrgId: data.activeOrgId,
    }),

  clearUser: () =>
    set({
      id: null,
      username: null,
      email: null,
      avatarUrl: null,
      orgRole: null,
      activeOrgId: null,
    }),
}));
