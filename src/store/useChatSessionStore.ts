import { create } from "zustand";
import type { ClaudeChatEvent, ContentBlock } from "@/lib/claudeChatSchema";

export interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  blocks: ContentBlock[];
  status: "streaming" | "complete";
}

interface ChatSessionStore {
  sessionId: string | null;
  turns: ChatTurn[];
  turnInProgress: boolean;
  lastError: string | null;

  setSession: (sessionId: string) => void;
  clearSession: () => void;
  appendUserTurn: (text: string) => void;
  ingestEvent: (event: ClaudeChatEvent) => void;
  ingestRawError: (line: string) => void;
  reset: () => void;
}

export const useChatSessionStore = create<ChatSessionStore>((set) => ({
  sessionId: null,
  turns: [],
  turnInProgress: false,
  lastError: null,

  setSession: (sessionId) => set({ sessionId, lastError: null }),

  clearSession: () => set({ sessionId: null, turnInProgress: false }),

  appendUserTurn: (text) =>
    set((s) => ({
      turns: [
        ...s.turns,
        { id: crypto.randomUUID(), role: "user", blocks: [{ type: "text", text }], status: "complete" },
      ],
      turnInProgress: true,
    })),

  ingestEvent: (event) => {
    switch (event.type) {
      case "assistant": {
        const message = (event as { message?: { content?: ContentBlock[] } }).message;
        const blocks = Array.isArray(message?.content) ? message.content : [];
        set((s) => {
          const turns = [...s.turns];
          const last = turns[turns.length - 1];
          if (last?.role === "assistant" && last.status === "streaming") {
            turns[turns.length - 1] = { ...last, blocks: [...last.blocks, ...blocks] };
          } else {
            turns.push({ id: crypto.randomUUID(), role: "assistant", blocks, status: "streaming" });
          }
          return { turns };
        });
        break;
      }
      case "result": {
        set((s) => {
          const turns = [...s.turns];
          const last = turns[turns.length - 1];
          if (last?.role === "assistant") {
            turns[turns.length - 1] = { ...last, status: "complete" };
          }
          return { turns, turnInProgress: false };
        });
        break;
      }
      default:
        break;
    }
  },

  ingestRawError: (line) => set({ lastError: line }),

  reset: () => set({ sessionId: null, turns: [], turnInProgress: false, lastError: null }),
}));
