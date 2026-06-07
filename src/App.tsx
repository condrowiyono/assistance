import { useLayoutEffect, useRef } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { usePanelRef } from "react-resizable-panels";
import { TitleBar } from "@/components/layout/TitleBar";
import { WorkspaceSidebar } from "@/components/layout/WorkspaceSidebar";
import { CenterPanel } from "@/components/layout/CenterPanel";
import { StatusBar } from "@/components/layout/StatusBar";
import { ModalHost } from "@/components/layout/ModalHost";
import { PreviewPanel } from "@/components/layout/PreviewPanel";
import { useUIStore } from "@/store/useUIStore";
import { useThemeStore } from "@/store/useThemeStore";
import { applyColorSchemeToDom } from "@/lib/colorScheme";
import { writeBorderRadiusToDom } from "@/lib/borderRadius";
import { writeFontScaleToDom } from "@/lib/fontScale";
import "./App.css";

const SIDEBAR_COLLAPSED_WIDTH = 56;
const SIDEBAR_DEFAULT_WIDTH = 208;
const SIDEBAR_MIN_WIDTH = 140;
const SIDEBAR_MAX_WIDTH = 320;

const PREVIEW_DEFAULT_WIDTH = 320;
const PREVIEW_MIN_WIDTH = 240;

function clampSidebarWidth(w: number) {
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, w));
}

function ThemeDomSync() {
  const fontScale = useThemeStore((s) => s.fontScale);
  const borderRadiusRem = useThemeStore((s) => s.borderRadiusRem);
  const colorScheme = useThemeStore((s) => s.colorScheme);

  useLayoutEffect(() => {
    writeFontScaleToDom(fontScale);
    writeBorderRadiusToDom(borderRadiusRem);
    applyColorSchemeToDom(colorScheme);
  }, [fontScale, borderRadiusRem, colorScheme]);

  useLayoutEffect(() => {
    if (colorScheme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyColorSchemeToDom("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [colorScheme]);

  return null;
}

export default function App() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed);

  const sidebarPanelRef = usePanelRef();
  const lastExpandedWidth = useRef(SIDEBAR_DEFAULT_WIDTH);

  // Sync sidebar collapsed state → imperative panel API
  useLayoutEffect(() => {
    const panel = sidebarPanelRef.current;
    if (!panel) return;
    if (sidebarCollapsed) {
      if (!panel.isCollapsed()) {
        const px = panel.getSize().inPixels;
        if (px > SIDEBAR_COLLAPSED_WIDTH) lastExpandedWidth.current = clampSidebarWidth(px);
        panel.collapse();
      }
    } else if (panel.isCollapsed()) {
      panel.resize(lastExpandedWidth.current);
    }
  }, [sidebarCollapsed, sidebarPanelRef]);

  return (
    <TooltipProvider delayDuration={200}>
      <ThemeDomSync />
      <div className="flex h-full w-full flex-col overflow-hidden bg-app-background">
        <TitleBar />
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
            <ResizablePanel
              id="workspace-sidebar"
              panelRef={sidebarPanelRef}
              defaultSize={SIDEBAR_DEFAULT_WIDTH}
              minSize={SIDEBAR_MIN_WIDTH}
              maxSize={SIDEBAR_MAX_WIDTH}
              collapsible
              collapsedSize={SIDEBAR_COLLAPSED_WIDTH}
              groupResizeBehavior="preserve-pixel-size"
              className="min-w-0 bg-sidebar border-r border-sidebar-border"
              onResize={(size) => {
                const panel = sidebarPanelRef.current;
                const isNowCollapsed = panel?.isCollapsed() ?? false;
                if (!isNowCollapsed) {
                  lastExpandedWidth.current = clampSidebarWidth(size.inPixels);
                }
                if (isNowCollapsed !== sidebarCollapsed) {
                  setSidebarCollapsed(isNowCollapsed);
                }
              }}
            >
              <WorkspaceSidebar />
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel id="terminal-panel" className="min-w-0 bg-card">
              <div className="flex h-full min-w-0 pb-3">
                <CenterPanel />
              </div>
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel
              id="preview-panel"
              defaultSize={PREVIEW_DEFAULT_WIDTH}
              minSize={PREVIEW_MIN_WIDTH}
              className="min-w-0 border-l border-border bg-card"
            >
              <div className="flex h-full min-w-0 pr-3 pb-3">
                <PreviewPanel />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
        <StatusBar />
        <Toaster position="bottom-right" closeButton />
        <ModalHost />
      </div>
    </TooltipProvider>
  );
}
