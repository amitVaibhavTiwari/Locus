"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeColor =
  | "orange"
  | "blue"
  | "green"
  | "purple"
  | "red"
  | "custom";

interface WorkspaceSettings {
  themeColor: ThemeColor;
  customAccentColor: string;
  setThemeColor: (color: ThemeColor) => void;
  setCustomAccentColor: (color: string) => void;
}

export const useWorkspaceStore = create<WorkspaceSettings>()(
  persist(
    (set) => ({
      themeColor: "green",
      customAccentColor: "142 76% 36%",
      setThemeColor: (color) => set({ themeColor: color }),
      setCustomAccentColor: (color) => set({ customAccentColor: color }),
    }),
    {
      name: "workspace-settings",
    },
  ),
);
