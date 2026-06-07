import { useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { ChevronDown, FolderGit2, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useActiveProject, useProjectStore } from "@/store/useProjectStore";
import s from "./TitleBar.module.css";

export function ProjectSelector() {
  const [open_, setOpen] = useState(false);
  const projects = useProjectStore((s) => s.projects);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const addProject = useProjectStore((s) => s.addProject);
  const hydrate = useProjectStore((s) => s.hydrate);
  const activeProject = useActiveProject();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const handleAddProject = async () => {
    const selected = await open({ directory: true, multiple: false, title: "Open Project" });
    if (typeof selected === "string") {
      await addProject(selected);
      setOpen(false);
    }
  };

  return (
    <Popover open={open_} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={s.chromeButton}
          aria-label="Select project"
        >
          <FolderGit2 className="size-3.5" />
          <span className="max-w-36 truncate">{activeProject?.name ?? "Select project"}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command>
          <CommandInput placeholder="Search projects..." autoFocus />
          <CommandList>
            <CommandEmpty>No projects yet.</CommandEmpty>
            {projects.length > 0 && (
              <CommandGroup heading="Projects">
                {projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={`${project.name} ${project.path}`}
                    onSelect={() => {
                      setActiveProject(project.id);
                      setOpen(false);
                    }}
                    data-active={project.id === activeProject?.id || undefined}
                    className="data-[active]:bg-accent data-[active]:text-accent-foreground"
                  >
                    <FolderGit2 className="size-4 text-muted-foreground" />
                    <span className="flex flex-col gap-0.5 overflow-hidden">
                      <span className="truncate text-sm font-medium text-foreground">{project.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{project.path}</span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandSeparator />
            <CommandGroup>
              <CommandItem value="add-project" onSelect={() => void handleAddProject()}>
                <FolderPlus className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">Add project…</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
