import { Bot, TerminalSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore, type CenterMode } from "@/store/useUIStore";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { TerminalPanel } from "@/components/terminal/TerminalPanel";

const MODES: Array<{ id: CenterMode; label: string; icon: typeof Bot }> = [
  { id: "chat", label: "Chat", icon: Bot },
  { id: "terminal", label: "Terminal", icon: TerminalSquare },
];

export function CenterPanel() {
  const centerMode = useUIStore((s) => s.centerMode);
  const setCenterMode = useUIStore((s) => s.setCenterMode);

  return (
    <div className="flex h-full min-w-0 w-full flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-1 border-b border-border px-2 py-2">
        {MODES.map(({ id, label, icon: Icon }) => {
          const active = id === centerMode;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setCenterMode(id)}
              aria-current={active ? "true" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                active && "bg-accent text-primary",
              )}
            >
              <Icon className="size-3.5 stroke-2" />
              {label}
            </button>
          );
        })}
      </header>
      <div className="relative flex-1 min-h-0">
        <div className={cn("absolute inset-0", centerMode !== "chat" && "hidden")}>
          <ChatPanel />
        </div>
        <div className={cn("absolute inset-0", centerMode !== "terminal" && "hidden")}>
          <TerminalPanel />
        </div>
      </div>
    </div>
  );
}
