"use client";
import { create } from "zustand";

type ProjectRole = "manager" | "member" | "viewer" | null;

interface ProjectRoleStore {
  roles: Record<string, ProjectRole>;
  getRole: (projectId: string) => Promise<ProjectRole>;
  setRole: (projectId: string, role: ProjectRole) => void;
  clearRoles: () => void;
}

export const useProjectRoleStore = create<ProjectRoleStore>((set, get) => ({
  roles: {},

  getRole: async (projectId: string): Promise<ProjectRole> => {
    const cached = get().roles[projectId];
    if (cached !== undefined) return cached;

    const res = await fetch(`/api/projects/${projectId}/my-role`);
    const role: ProjectRole = res.ok ? (await res.json()).role : null;

    set((state) => ({ roles: { ...state.roles, [projectId]: role } }));
    return role;
  },

  setRole: (projectId, role) =>
    set((state) => ({ roles: { ...state.roles, [projectId]: role } })),

  clearRoles: () => set({ roles: {} }),
}));
