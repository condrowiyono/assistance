import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectSelector } from "@/components/layout/ProjectSelector";
import { useUIStore } from "@/store/useUIStore";
import s from "./TitleBar.module.css";

export function TitleBar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <header className={s.titlebar} data-tauri-drag-region>
      <div className={s.left} data-tauri-drag-region>
        <div className={s.trafficSpace} data-tauri-drag-region />
        <Button
          variant="ghost"
          size="icon-sm"
          className={s.chromeButton}
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
        <ProjectSelector />
        <div className={s.leftFill} data-tauri-drag-region />
      </div>

      <div className={s.center} data-tauri-drag-region />

      <div className={s.spacer} data-tauri-drag-region />
    </header>
  );
}
