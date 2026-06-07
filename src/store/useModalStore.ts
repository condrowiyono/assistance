import type { ReactNode } from "react";
import { create } from "zustand";

export type ModalSize = "sm" | "md" | "lg";

export interface ModalConfig {
  id: string;
  title?: string;
  description?: string;
  content: ReactNode;
  size?: ModalSize;
  dismissible?: boolean;
}

export type OpenModalConfig = Omit<ModalConfig, "id"> & { id?: string };

interface ModalStore {
  modal: ModalConfig | null;
  open: (config: OpenModalConfig) => string;
  close: (id?: string) => void;
}

let modalCounter = 0;

export const useModalStore = create<ModalStore>((set, get) => ({
  modal: null,

  open: (config) => {
    const id = config.id ?? `modal-${++modalCounter}`;
    set({ modal: { ...config, id, dismissible: config.dismissible ?? true } });
    return id;
  },

  close: (id) => {
    const current = get().modal;
    if (!current) return;
    if (id !== undefined && current.id !== id) return;
    set({ modal: null });
  },
}));
