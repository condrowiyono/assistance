import { create } from "zustand";
import { load, type Store } from "@tauri-apps/plugin-store";

export interface Project {
  id: string;
  name: string;
  path: string;
}

interface ProjectStore {
  projects: Project[];
  activeProjectId: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addProject: (path: string) => Promise<Project>;
  removeProject: (id: string) => Promise<void>;
  setActiveProject: (id: string) => void;
}

const STORE_FILE = "projects.json";
let storePromise: Promise<Store> | null = null;

function getStore() {
  if (!storePromise) storePromise = load(STORE_FILE, { autoSave: true, defaults: {} });
  return storePromise;
}

function projectName(path: string) {
  return path.replace(/\/+$/, "").split("/").pop() || path;
}

async function persist(projects: Project[], activeProjectId: string | null) {
  const store = await getStore();
  await store.set("projects", projects);
  await store.set("activeProjectId", activeProjectId);
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  activeProjectId: null,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const store = await getStore();
    const projects = (await store.get<Project[]>("projects")) ?? [];
    const activeProjectId = (await store.get<string | null>("activeProjectId")) ?? null;
    set({ projects, activeProjectId, hydrated: true });
  },

  addProject: async (path) => {
    const existing = get().projects.find((p) => p.path === path);
    if (existing) {
      get().setActiveProject(existing.id);
      return existing;
    }
    const project: Project = { id: crypto.randomUUID(), name: projectName(path), path };
    const projects = [...get().projects, project];
    set({ projects, activeProjectId: project.id });
    await persist(projects, project.id);
    return project;
  },

  removeProject: async (id) => {
    const projects = get().projects.filter((p) => p.id !== id);
    const activeProjectId = get().activeProjectId === id ? (projects[0]?.id ?? null) : get().activeProjectId;
    set({ projects, activeProjectId });
    await persist(projects, activeProjectId);
  },

  setActiveProject: (id) => {
    set({ activeProjectId: id });
    void persist(get().projects, id);
  },
}));

export function useActiveProject(): Project | null {
  return useProjectStore((s) => s.projects.find((p) => p.id === s.activeProjectId) ?? null);
}
