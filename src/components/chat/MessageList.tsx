import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import type { ChatTurn } from "@/store/useChatSessionStore";

interface MessageListProps {
  turns: ChatTurn[];
}

export function MessageList({ turns }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [turns]);

  if (turns.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground">Send a message to start the conversation.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3">
      <div className="flex flex-col gap-3">
        {turns.map((turn) => (
          <MessageBubble key={turn.id} turn={turn} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
