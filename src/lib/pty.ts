import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export async function spawnTerminal(cwd: string): Promise<string> {
  return invoke<string>("spawn_terminal", { cwd });
}

export async function writeToTerminal(sessionId: string, data: string): Promise<void> {
  await invoke("write_to_terminal", { sessionId, data });
}

export async function resizeTerminal(sessionId: string, rows: number, cols: number): Promise<void> {
  await invoke("resize_terminal", { sessionId, rows, cols });
}

export async function killTerminal(sessionId: string): Promise<void> {
  await invoke("kill_terminal", { sessionId });
}

export function onTerminalData(sessionId: string, handler: (chunk: string) => void): Promise<UnlistenFn> {
  return listen<string>(`pty://data:${sessionId}`, (event) => handler(event.payload));
}

export function onTerminalExit(sessionId: string, handler: () => void): Promise<UnlistenFn> {
  return listen(`pty://exit:${sessionId}`, () => handler());
}
