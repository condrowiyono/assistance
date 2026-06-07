import { useState } from "react";
import { BookOpen, FolderTree, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveProject } from "@/store/useProjectStore";
import { FileExplorer } from "./FileExplorer";
import { GitStatusList } from "./GitStatusList";

type WorkspaceTab = "files" | "git" | "kb";

const tabs: { id: WorkspaceTab; label: string; icon: React.ElementType; placeholder: string }[] = [
  { id: "files", label: "Files", icon: FolderTree, placeholder: "File explorer is coming in a later phase." },
  { id: "git", label: "Git", icon: GitBranch, placeholder: "Git status will be shown here." },
  { id: "kb", label: "KB", icon: BookOpen, placeholder: "Project docs (README, CLAUDE.md, AGENTS.md) will be browsable here." },
];

export function WorkspaceSidebar() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("files");
  const activeProject = useActiveProject();
  const current = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  return (
    <aside className="flex h-full w-full min-w-0 flex-col" aria-label="Workspace">
      <nav className="flex shrink-0 items-center gap-1 border-b border-sidebar-border px-2 py-2" aria-label="Workspace tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={active ? "true" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[0.7rem] font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active && "bg-sidebar-accent text-sidebar-primary",
              )}
            >
              <Icon className="size-4 stroke-2" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {!activeProject ? (
          <p className="text-sm text-muted-foreground">Select a project to see {current.label.toLowerCase()}.</p>
        ) : activeTab === "files" ? (
          <>
            <p className="truncate text-xs text-muted-foreground/70">{activeProject.path}</p>
            <FileExplorer project={activeProject} />
          </>
        ) : activeTab === "git" ? (
          <GitStatusList project={activeProject} />
        ) : (
          <>
            <p className="truncate text-xs text-muted-foreground/70">{activeProject.path}</p>
            <p className="text-sm text-muted-foreground">{current.placeholder}</p>
          </>
        )}
      </div>
    </aside>
  );
}
