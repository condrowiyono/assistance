import type { ITheme } from "@xterm/xterm";

const VAR_NAMES = [
  "--background",
  "--foreground",
  "--card",
  "--primary",
  "--muted-foreground",
  "--border",
  "--accent",
] as const;

function resolveCssColor(varName: string, probe: HTMLElement): string {
  probe.style.color = `var(${varName})`;
  return getComputedStyle(probe).color;
}

export function readTerminalTheme(): ITheme {
  const probe = document.createElement("span");
  probe.style.position = "absolute";
  probe.style.opacity = "0";
  probe.style.pointerEvents = "none";
  document.body.appendChild(probe);

  const colors = Object.fromEntries(
    VAR_NAMES.map((name) => [name, resolveCssColor(name, probe)])
  ) as Record<(typeof VAR_NAMES)[number], string>;

  document.body.removeChild(probe);

  return {
    background: colors["--background"],
    foreground: colors["--foreground"],
    cursor: colors["--primary"],
    cursorAccent: colors["--background"],
    selectionBackground: colors["--accent"],
    black: colors["--card"],
    brightBlack: colors["--muted-foreground"],
    white: colors["--foreground"],
    brightWhite: colors["--foreground"],
  };
}

export function watchTerminalTheme(onChange: (theme: ITheme) => void): () => void {
  const observer = new MutationObserver(() => onChange(readTerminalTheme()));
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
