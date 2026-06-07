import { useEffect, useRef } from "react";
import { Bot } from "lucide-react";
import {
  killClaudeChat,
  onClaudeChatError,
  onClaudeChatExit,
  onClaudeChatLine,
  sendClaudeChatMessage,
  spawnClaudeChat,
} from "@/lib/claudeChat";
import { parseClaudeChatLine } from "@/lib/claudeChatSchema";
import { useActiveProject } from "@/store/useProjectStore";
import { useChatSessionStore } from "@/store/useChatSessionStore";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import s from "./ChatPanel.module.css";

export function ChatPanel() {
  const activeProject = useActiveProject();
  const sessionIdRef = useRef<string | null>(null);

  const sessionId = useChatSessionStore((state) => state.sessionId);
  const turns = useChatSessionStore((state) => state.turns);
  const turnInProgress = useChatSessionStore((state) => state.turnInProgress);
  const setSession = useChatSessionStore((state) => state.setSession);
  const reset = useChatSessionStore((state) => state.reset);
  const appendUserTurn = useChatSessionStore((state) => state.appendUserTurn);
  const ingestEvent = useChatSessionStore((state) => state.ingestEvent);
  const ingestRawError = useChatSessionStore((state) => state.ingestRawError);

  // Spawn/respawn a claude chat session scoped to the active project's directory
  useEffect(() => {
    if (!activeProject) return;

    let cancelled = false;
    let unlistenLine: (() => void) | null = null;
    let unlistenError: (() => void) | null = null;
    let unlistenExit: (() => void) | null = null;
    const previousSessionId = sessionIdRef.current;

    reset();

    void (async () => {
      if (previousSessionId) await killClaudeChat(previousSessionId);

      const sessionId = await spawnClaudeChat(activeProject.path);
      if (cancelled) {
        await killClaudeChat(sessionId);
        return;
      }
      sessionIdRef.current = sessionId;
      setSession(sessionId);

      unlistenLine = await onClaudeChatLine(sessionId, (line) => {
        const event = parseClaudeChatLine(line);
        if (event) ingestEvent(event);
      });
      unlistenError = await onClaudeChatError(sessionId, (line) => {
        ingestRawError(line);
      });
      unlistenExit = await onClaudeChatExit(sessionId, () => {
        reset();
      });
    })();

    return () => {
      cancelled = true;
      unlistenLine?.();
      unlistenError?.();
      unlistenExit?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.id]);

  // Kill the session when the component unmounts entirely
  useEffect(() => {
    return () => {
      const sessionId = sessionIdRef.current;
      if (sessionId) void killClaudeChat(sessionId);
    };
  }, []);

  function handleSend(text: string) {
    const id = sessionIdRef.current;
    if (!id || turnInProgress || !text.trim()) return;
    appendUserTurn(text);
    void sendClaudeChatMessage(id, text);
  }

  return (
    <div className={s.shell}>
      {activeProject ? (
        <>
          <MessageList turns={turns} />
          <MessageInput disabled={turnInProgress || !sessionId} onSend={handleSend} />
        </>
      ) : (
        <div className={s.empty} aria-label="No project selected">
          <Bot className="size-8" />
          <strong>No project selected</strong>
          <span>Choose a project from the selector to start a chat session.</span>
        </div>
      )}
    </div>
  );
}
