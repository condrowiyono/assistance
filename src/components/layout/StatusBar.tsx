import { useEffect, useState } from "react";
import { Bot, FolderGit2, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { gitBranch } from "@/lib/workspace";
import { useActiveProject } from "@/store/useProjectStore";
import { useChatSessionStore } from "@/store/useChatSessionStore";

export function StatusBar() {
  const activeProject = useActiveProject();
  const sessionId = useChatSessionStore((s) => s.sessionId);
  const turnInProgress = useChatSessionStore((s) => s.turnInProgress);
  const [branch, setBranch] = useState<string | null>(null);

  useEffect(() => {
    setBranch(null);
    if (!activeProject) return;

    let cancelled = false;
    void gitBranch(activeProject.path)
      .then((result) => {
        if (!cancelled) setBranch(result);
      })
      .catch(() => {
        if (!cancelled) setBranch(null);
      });

    return () => {
      cancelled = true;
    };
  }, [activeProject?.path]);

  const claudeLabel = !sessionId ? "Idle" : turnInProgress ? "Working…" : "Ready";

  return (
    <footer className="flex h-7 shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-3 text-xs text-muted-foreground">
      <div className="flex min-w-0 items-center gap-3">
        {activeProject ? (
          <>
            <span className="flex min-w-0 items-center gap-1.5" title={activeProject.path}>
              <FolderGit2 className="size-3.5 shrink-0 stroke-2" />
              <span className="truncate">{activeProject.name}</span>
            </span>
            {branch && (
              <span className="flex shrink-0 items-center gap-1.5" title={`Branch: ${branch}`}>
                <GitBranch className="size-3.5 shrink-0 stroke-2" />
                {branch}
              </span>
            )}
          </>
        ) : (
          <span>No project selected</span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5" title={`Claude: ${claudeLabel}`}>
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            !sessionId ? "bg-muted-foreground/40" : turnInProgress ? "animate-pulse bg-amber-500" : "bg-emerald-500",
          )}
        />
        <Bot className="size-3.5 shrink-0 stroke-2" />
        <span>Claude · {claudeLabel}</span>
      </div>
    </footer>
  );
}
