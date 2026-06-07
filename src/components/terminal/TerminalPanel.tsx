import { useEffect, useRef } from "react";
import { TerminalSquare } from "lucide-react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import {
  killTerminal,
  onTerminalData,
  onTerminalExit,
  resizeTerminal,
  spawnTerminal,
  writeToTerminal,
} from "@/lib/pty";
import { readTerminalTheme, watchTerminalTheme } from "@/lib/terminalTheme";
import { useActiveProject } from "@/store/useProjectStore";
import s from "./TerminalPanel.module.css";

export function TerminalPanel() {
  const activeProject = useActiveProject();
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Mount xterm once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const term = new Terminal({
      fontFamily: "'Mapple Mono', 'Geist Mono Variable', ui-monospace, SFMono-Regular, monospace",
      fontSize: 11,
      cursorBlink: true,
      theme: readTerminalTheme(),
      allowProposedApi: true,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(container);
    fit.fit();

    termRef.current = term;
    fitRef.current = fit;

    const stopWatchingTheme = watchTerminalTheme((theme) => {
      term.options.theme = theme;
    });

    const dataDisposable = term.onData((data) => {
      const sessionId = sessionIdRef.current;
      if (sessionId) void writeToTerminal(sessionId, data);
    });

    const resizeObserver = new ResizeObserver(() => {
      fit.fit();
      const sessionId = sessionIdRef.current;
      if (sessionId) void resizeTerminal(sessionId, term.rows, term.cols);
    });
    resizeObserver.observe(container);

    return () => {
      stopWatchingTheme();
      dataDisposable.dispose();
      resizeObserver.disconnect();
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, []);

  // Spawn/respawn a PTY session scoped to the active project's directory
  useEffect(() => {
    const term = termRef.current;
    if (!term || !activeProject) return;

    let cancelled = false;
    let unlistenData: (() => void) | null = null;
    let unlistenExit: (() => void) | null = null;
    const previousSessionId = sessionIdRef.current;

    term.reset();
    term.writeln(`\x1b[90mStarting shell in ${activeProject.path}\x1b[0m`);

    void (async () => {
      if (previousSessionId) await killTerminal(previousSessionId);

      const sessionId = await spawnTerminal(activeProject.path);
      if (cancelled) {
        await killTerminal(sessionId);
        return;
      }
      sessionIdRef.current = sessionId;

      unlistenData = await onTerminalData(sessionId, (chunk) => term.write(chunk));
      unlistenExit = await onTerminalExit(sessionId, () => {
        term.writeln("\x1b[90m\r\n[process exited]\x1b[0m");
      });

      fitRef.current?.fit();
      await resizeTerminal(sessionId, term.rows, term.cols);
      term.focus();

      // Give the shell a moment to finish loading the user's profile, then launch Claude.
      await new Promise((resolve) => setTimeout(resolve, 400));
      if (!cancelled) await writeToTerminal(sessionId, "claude\r");
    })();

    return () => {
      cancelled = true;
      unlistenData?.();
      unlistenExit?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.id]);

  // Kill the session when the component unmounts entirely
  useEffect(() => {
    return () => {
      const sessionId = sessionIdRef.current;
      if (sessionId) void killTerminal(sessionId);
    };
  }, []);

  return (
    <div className={s.shell}>
      <div ref={containerRef} className={s.viewport} />
      {!activeProject && (
        <div className={s.empty} aria-label="No project selected">
          <TerminalSquare className="size-8" />
          <strong>No project selected</strong>
          <span>Choose a project from the selector to start a terminal session.</span>
        </div>
      )}
    </div>
  );
}
