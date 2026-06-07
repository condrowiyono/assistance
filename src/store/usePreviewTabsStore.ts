import { create } from "zustand";

export type PreviewTab =
  | { id: "web"; kind: "web"; title: "Web"; pinned: true }
  | { id: string; kind: "file"; title: string; path: string }
  | { id: string; kind: "diff"; title: string; projectPath: string; filePath: string };

const WEB_TAB: PreviewTab = { id: "web", kind: "web", title: "Web", pinned: true };

interface PreviewTabsStore {
  tabs: PreviewTab[];
  activeTabId: string;
  openFile: (path: string, title: string) => void;
  openDiff: (projectPath: string, filePath: string, title: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  resetFileTabs: () => void;
}

export const usePreviewTabsStore = create<PreviewTabsStore>((set, get) => ({
  tabs: [WEB_TAB],
  activeTabId: WEB_TAB.id,

  openFile: (path, title) => {
    const existing = get().tabs.find((t) => t.kind === "file" && t.path === path);
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }
    const tab: PreviewTab = { id: path, kind: "file", title, path };
    set((s) => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }));
  },

  openDiff: (projectPath, filePath, title) => {
    const id = `diff:${filePath}`;
    const existing = get().tabs.find((t) => t.id === id);
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }
    const tab: PreviewTab = { id, kind: "diff", title, projectPath, filePath };
    set((s) => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }));
  },

  closeTab: (id) => {
    const { tabs, activeTabId } = get();
    const index = tabs.findIndex((t) => t.id === id);
    if (index === -1) return;
    if (tabs[index].kind === "web") return;

    const nextTabs = tabs.filter((t) => t.id !== id);
    const nextActiveId = activeTabId === id ? (nextTabs[index - 1]?.id ?? WEB_TAB.id) : activeTabId;
    set({ tabs: nextTabs, activeTabId: nextActiveId });
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  resetFileTabs: () => set({ tabs: [WEB_TAB], activeTabId: WEB_TAB.id }),
}));

export function useActivePreviewTab(): PreviewTab {
  return usePreviewTabsStore((s) => s.tabs.find((t) => t.id === s.activeTabId) ?? s.tabs[0]);
}
