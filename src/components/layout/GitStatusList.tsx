import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { gitStatus, type GitStatusEntry } from "@/lib/workspace";
import type { Project } from "@/store/useProjectStore";
import { usePreviewTabsStore } from "@/store/usePreviewTabsStore";

interface GitStatusListProps {
  project: Project;
}

interface StatusInfo {
  code: string;
  label: string;
  className: string;
}

function describeStatus(entry: GitStatusEntry): StatusInfo {
  const { indexStatus, worktreeStatus } = entry;
  if (indexStatus === "?" && worktreeStatus === "?") {
    return { code: "?", label: "Untracked", className: "border-muted-foreground/30 text-muted-foreground" };
  }
  if (indexStatus === "U" || worktreeStatus === "U") {
    return { code: "U", label: "Conflicted", className: "border-rose-500/40 text-rose-600 dark:text-rose-400" };
  }

  const status = worktreeStatus !== " " ? worktreeStatus : indexStatus;
  switch (status) {
    case "M":
      return { code: "M", label: "Modified", className: "border-amber-500/40 text-amber-600 dark:text-amber-400" };
    case "A":
      return { code: "A", label: "Added", className: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400" };
    case "D":
      return { code: "D", label: "Deleted", className: "border-rose-500/40 text-rose-600 dark:text-rose-400" };
    case "R":
      return { code: "R", label: "Renamed", className: "border-sky-500/40 text-sky-600 dark:text-sky-400" };
    case "C":
      return { code: "C", label: "Copied", className: "border-sky-500/40 text-sky-600 dark:text-sky-400" };
    default:
      return { code: status.trim() || "•", label: "Changed", className: "border-muted-foreground/30 text-muted-foreground" };
  }
}

export function GitStatusList({ project }: GitStatusListProps) {
  const [entries, setEntries] = useState<GitStatusEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await gitStatus(project.path);
      setEntries(result);
    } catch {
      setEntries([]);
      setError("Not a git repository.");
    } finally {
      setLoading(false);
    }
  }, [project.path]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs text-muted-foreground/70">{project.path}</p>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          aria-label="Refresh git status"
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:opacity-50"
        >
          <RefreshCw className={cn("size-3.5 stroke-2", loading && "animate-spin")} />
        </button>
      </div>

      {error ? (
        <p className="text-sm text-muted-foreground">{error}</p>
      ) : loading && entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Loading git status…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No changes.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {entries.map((entry) => {
            const status = describeStatus(entry);
            return (
              <li key={entry.path}>
                <button
                  type="button"
                  onClick={() => {
                    const fileName = entry.path.split("/").pop() ?? entry.path;
                    usePreviewTabsStore.getState().openDiff(project.path, entry.path, fileName);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <span
                    aria-label={status.label}
                    title={status.label}
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded border text-[0.65rem] font-semibold uppercase",
                      status.className,
                    )}
                  >
                    {status.code}
                  </span>
                  <span className="truncate">{entry.path}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
