"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AccountType = "superAdmin" | "admin" | "member";
export type SubscriptionType = "free" | "pro" | "enterprise";
export type ThemeColor =
  | "orange"
  | "blue"
  | "green"
  | "purple"
  | "red"
  | "custom";

export interface PinnedProject {
  id: string;
  name: string;
  color: string;
}

interface WorkspaceSettings {
  workspaceName: string;
  themeColor: ThemeColor;
  customAccentColor: string;
  accountType: AccountType;
  subscriptionType: SubscriptionType;
  pinnedProjects: PinnedProject[];
  setWorkspaceName: (name: string) => void;
  setThemeColor: (color: ThemeColor) => void;
  setCustomAccentColor: (color: string) => void;
  setAccountType: (type: AccountType) => void;
  setSubscriptionType: (type: SubscriptionType) => void;
  pinProject: (project: PinnedProject) => void;
  unpinProject: (projectId: string) => void;
  isProjectPinned: (projectId: string) => boolean;
}

export const useWorkspaceStore = create<WorkspaceSettings>()(
  persist(
    (set, get) => ({
      workspaceName: "Locus",
      themeColor: "green",
      customAccentColor: "142 76% 36%",
      accountType: "admin",
      subscriptionType: "pro",
      pinnedProjects: [
        { id: "1", name: "E-commerce Platform", color: "todo" },
        { id: "2", name: "Mobile App Redesign", color: "in-progress" },
      ],
      setWorkspaceName: (name) => set({ workspaceName: name }),
      setThemeColor: (color) => set({ themeColor: color }),
      setCustomAccentColor: (color) => set({ customAccentColor: color }),
      setAccountType: (type) => set({ accountType: type }),
      setSubscriptionType: (type) => set({ subscriptionType: type }),
      pinProject: (project) =>
        set((state) => ({
          pinnedProjects: [...state.pinnedProjects, project],
        })),
      unpinProject: (projectId) =>
        set((state) => ({
          pinnedProjects: state.pinnedProjects.filter(
            (p) => p.id !== projectId,
          ),
        })),
      isProjectPinned: (projectId) =>
        get().pinnedProjects.some((p) => p.id === projectId),
    }),
    {
      name: "workspace-settings",
    },
  ),
);
