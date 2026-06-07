export type ColorScheme = "system" | "light" | "dark";

export const COLOR_SCHEME_STORAGE_KEY = "assistance-color-scheme";
export const DEFAULT_COLOR_SCHEME: ColorScheme = "system";

const ALLOWED = new Set<ColorScheme>(["system", "light", "dark"]);

export function readStoredColorScheme(): ColorScheme {
  if (typeof window === "undefined") return DEFAULT_COLOR_SCHEME;
  try {
    const raw = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
    if (raw != null && ALLOWED.has(raw as ColorScheme)) return raw as ColorScheme;
  } catch { /* ignore */ }
  return DEFAULT_COLOR_SCHEME;
}

export function persistColorScheme(scheme: ColorScheme): void {
  try { localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, scheme); } catch { /* ignore */ }
}

export function resolveDark(scheme: ColorScheme): boolean {
  if (typeof window === "undefined") return false;
  if (scheme === "dark") return true;
  if (scheme === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyColorSchemeToDom(scheme: ColorScheme): void {
  const dark = resolveDark(scheme);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}
