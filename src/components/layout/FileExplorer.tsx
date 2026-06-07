import { useEffect, useState } from "react";
import { ChevronRight, File, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { listDirectory, type DirEntry } from "@/lib/workspace";
import type { Project } from "@/store/useProjectStore";
import { usePreviewTabsStore } from "@/store/usePreviewTabsStore";

interface FileExplorerProps {
  project: Project;
}

function withoutKey<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  next.delete(value);
  return next;
}

export function FileExplorer({ project }: FileExplorerProps) {
  const [children, setChildren] = useState<Map<string, DirEntry[]>>(new Map());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setChildren(new Map());
    setExpanded(new Set());
    setSelected(null);
    setError(null);
    setLoading(new Set([project.path]));

    void (async () => {
      try {
        const entries = await listDirectory(project.path);
        if (cancelled) return;
        setChildren(new Map([[project.path, entries]]));
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading((prev) => withoutKey(prev, project.path));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [project.path]);

  async function toggleFolder(entry: DirEntry) {
    const isExpanded = expanded.has(entry.path);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (isExpanded) next.delete(entry.path);
      else next.add(entry.path);
      return next;
    });

    if (isExpanded || children.has(entry.path)) return;

    setLoading((prev) => new Set(prev).add(entry.path));
    try {
      const fetched = await listDirectory(entry.path);
      setChildren((prev) => new Map(prev).set(entry.path, fetched));
    } catch {
      setChildren((prev) => new Map(prev).set(entry.path, []));
    } finally {
      setLoading((prev) => withoutKey(prev, entry.path));
    }
  }

  function renderEntries(entries: DirEntry[], depth: number) {
    return entries.map((entry) => {
      const isExpanded = expanded.has(entry.path);
      const isLoading = loading.has(entry.path);
      const isSelected = selected === entry.path;
      const childEntries = children.get(entry.path);
      const indent = depth * 14 + 6;

      return (
        <div key={entry.path}>
          <button
            type="button"
            onClick={() => {
              if (entry.isDir) {
                void toggleFolder(entry);
              } else {
                setSelected(entry.path);
                usePreviewTabsStore.getState().openFile(entry.path, entry.name);
              }
            }}
            aria-current={isSelected ? "true" : undefined}
            aria-expanded={entry.isDir ? isExpanded : undefined}
            style={{ paddingLeft: `${indent}px` }}
            className={cn(
              "flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isSelected && "bg-sidebar-accent text-sidebar-primary",
            )}
          >
            {entry.isDir ? (
              <ChevronRight
                className={cn(
                  "size-3.5 shrink-0 stroke-2 text-sidebar-foreground/50 transition-transform",
                  isExpanded && "rotate-90",
                )}
              />
            ) : (
              <span className="inline-block size-3.5 shrink-0" />
            )}
            {entry.isDir ? (
              isExpanded ? (
                <FolderOpen className="size-4 shrink-0 stroke-2 text-sidebar-foreground/60" />
              ) : (
                <Folder className="size-4 shrink-0 stroke-2 text-sidebar-foreground/60" />
              )
            ) : (
              <File className="size-4 shrink-0 stroke-2 text-sidebar-foreground/50" />
            )}
            <span className="truncate">{entry.name}</span>
          </button>

          {entry.isDir && isExpanded && (
            <div>
              {isLoading && !childEntries ? (
                <p className="py-1 text-xs text-muted-foreground/70" style={{ paddingLeft: `${indent + 20}px` }}>
                  Loading…
                </p>
              ) : childEntries && childEntries.length === 0 ? (
                <p className="py-1 text-xs text-muted-foreground/70" style={{ paddingLeft: `${indent + 20}px` }}>
                  Empty
                </p>
              ) : childEntries ? (
                renderEntries(childEntries, depth + 1)
              ) : null}
            </div>
          )}
        </div>
      );
    });
  }

  if (error) {
    return <p className="text-sm text-muted-foreground">{error}</p>;
  }

  const rootEntries = children.get(project.path);
  const rootLoading = loading.has(project.path);

  if (rootLoading && !rootEntries) {
    return <p className="text-sm text-muted-foreground">Loading files…</p>;
  }

  if (!rootEntries || rootEntries.length === 0) {
    return <p className="text-sm text-muted-foreground">This folder is empty.</p>;
  }

  return <div className="flex flex-col gap-0.5 text-sm">{renderEntries(rootEntries, 0)}</div>;
}
