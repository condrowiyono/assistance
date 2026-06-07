import { Bot, User, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContentBlock } from "@/lib/claudeChatSchema";
import type { ChatTurn } from "@/store/useChatSessionStore";

function stringifyToolPayload(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function ToolBlock({ name, summary, payload }: { name: string; summary: string; payload: unknown }) {
  return (
    <details className="group rounded-lg border border-border/60 bg-muted/40 text-xs">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2.5 py-1.5 text-muted-foreground transition-colors hover:text-foreground">
        <Wrench className="size-3.5 shrink-0 stroke-2" />
        <span className="font-medium text-foreground/80">{name}</span>
        <span className="truncate text-muted-foreground/70">{summary}</span>
      </summary>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words border-t border-border/60 px-2.5 py-2 text-[0.7rem] text-muted-foreground">
        {stringifyToolPayload(payload)}
      </pre>
    </details>
  );
}

function ContentBlockView({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "text":
      return <p className="whitespace-pre-wrap text-sm leading-relaxed">{block.text}</p>;
    case "tool_use":
      return <ToolBlock name={block.name} summary="called" payload={block.input} />;
    case "tool_result":
      return (
        <ToolBlock
          name="Result"
          summary={block.is_error ? "error" : "ok"}
          payload={typeof block.content === "string" ? block.content : block.content.map((c) => c.text).join("\n")}
        />
      );
    default:
      return null;
  }
}

interface MessageBubbleProps {
  turn: ChatTurn;
}

export function MessageBubble({ turn }: MessageBubbleProps) {
  const isUser = turn.role === "user";

  return (
    <div className={cn("flex w-full gap-2", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground",
        )}
      >
        {isUser ? <User className="size-3.5 stroke-2" /> : <Bot className="size-3.5 stroke-2" />}
      </div>
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-1.5 rounded-xl px-3 py-2",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
      >
        {turn.blocks.map((block, index) => (
          <ContentBlockView key={index} block={block} />
        ))}
        {turn.role === "assistant" && turn.status === "streaming" && turn.blocks.length === 0 && (
          <p className="text-sm text-muted-foreground">Thinking…</p>
        )}
      </div>
    </div>
  );
}
