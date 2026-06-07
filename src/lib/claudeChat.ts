import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export async function spawnClaudeChat(cwd: string): Promise<string> {
  return invoke<string>("spawn_claude_chat", { cwd });
}

export async function sendClaudeChatMessage(sessionId: string, text: string): Promise<void> {
  await invoke("send_claude_chat_message", { sessionId, text });
}

export async function killClaudeChat(sessionId: string): Promise<void> {
  await invoke("kill_claude_chat", { sessionId });
}

export function onClaudeChatLine(sessionId: string, handler: (line: string) => void): Promise<UnlistenFn> {
  return listen<string>(`claude-chat://line:${sessionId}`, (event) => handler(event.payload));
}

export function onClaudeChatExit(sessionId: string, handler: () => void): Promise<UnlistenFn> {
  return listen(`claude-chat://exit:${sessionId}`, () => handler());
}

export function onClaudeChatError(sessionId: string, handler: (line: string) => void): Promise<UnlistenFn> {
  return listen<string>(`claude-chat://error:${sessionId}`, (event) => handler(event.payload));
}
