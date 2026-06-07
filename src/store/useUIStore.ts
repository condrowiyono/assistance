import { create } from "zustand";

export type CenterMode = "chat" | "terminal";

interface UIStore {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  centerMode: CenterMode;
  setCenterMode: (mode: CenterMode) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  centerMode: "chat",
  setCenterMode: (mode) => set({ centerMode: mode }),
}));
