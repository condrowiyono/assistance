import { useEffect } from "react";
import { FileText, GitCompareArrows, Globe, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveProject } from "@/store/useProjectStore";
import { useActivePreviewTab, usePreviewTabsStore } from "@/store/usePreviewTabsStore";
import { FilePreview } from "./FilePreview";
import { DiffPreview } from "./DiffPreview";

export function PreviewPanel() {
  const activeProject = useActiveProject();
  const tabs = usePreviewTabsStore((s) => s.tabs);
  const activeTabId = usePreviewTabsStore((s) => s.activeTabId);
  const setActiveTab = usePreviewTabsStore((s) => s.setActiveTab);
  const closeTab = usePreviewTabsStore((s) => s.closeTab);
  const resetFileTabs = usePreviewTabsStore((s) => s.resetFileTabs);
  const activeTab = useActivePreviewTab();

  useEffect(() => {
    resetFileTabs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.id]);

  return (
    <aside className="flex h-full w-full min-w-0 flex-col" aria-label="Preview">
      <nav
        className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-2 py-2"
        aria-label="Preview tabs"
      >
        {tabs.map((tab) => {
          const active = tab.id === activeTabId;

          if (tab.kind === "web") {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={active ? "true" : undefined}
                aria-label="Web preview"
                title="Web preview"
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-lg px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  active && "bg-accent text-primary",
                )}
              >
                <Globe className="size-3.5 stroke-2" />
              </button>
            );
          }

          const Icon = tab.kind === "diff" ? GitCompareArrows : FileText;

          return (
            <div
              key={tab.id}
              className={cn(
                "group flex shrink-0 items-center gap-0.5 rounded-lg py-1 pl-1 pr-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                active && "bg-accent text-primary",
              )}
            >
              <button
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={active ? "true" : undefined}
                title={tab.title}
                className="flex items-center gap-1.5 rounded-md py-0.5 pl-1.5 pr-1"
              >
                <Icon className="size-3.5 shrink-0 stroke-2" />
                <span className="max-w-32 truncate">{tab.title}</span>
              </button>
              <button
                type="button"
                onClick={() => closeTab(tab.id)}
                aria-label={`Close ${tab.title}`}
                className="flex size-4 shrink-0 items-center justify-center rounded opacity-0 transition-opacity hover:bg-accent-foreground/10 group-hover:opacity-100 focus-visible:opacity-100"
              >
                <X className="size-3 stroke-2" />
              </button>
            </div>
          );
        })}
      </nav>

      {activeTab.kind === "web" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <Globe className="size-7 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">Live preview of the project's local dev server will appear here.</p>
          {!activeProject && <p className="text-xs text-muted-foreground/60">Select a project to get started.</p>}
        </div>
      ) : activeTab.kind === "file" ? (
        <FilePreview path={activeTab.path} title={activeTab.title} />
      ) : (
        <DiffPreview projectPath={activeTab.projectPath} filePath={activeTab.filePath} title={activeTab.title} />
      )}
    </aside>
  );
}
