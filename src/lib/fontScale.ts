export const FONT_SCALE_STORAGE_KEY = "assistance-font-scale";
export const FONT_SCALE_MIN = 0.8;
export const FONT_SCALE_MAX = 1.1;
export const DEFAULT_FONT_SCALE = 0.9;

function clampScale(n: number) {
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, n));
}

export const clampFontScale = clampScale;

export function readStoredFontScale(): number {
  if (typeof window === "undefined") return DEFAULT_FONT_SCALE;
  try {
    const raw = localStorage.getItem(FONT_SCALE_STORAGE_KEY);
    if (raw == null) return DEFAULT_FONT_SCALE;
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? clampScale(n) : DEFAULT_FONT_SCALE;
  } catch { return DEFAULT_FONT_SCALE; }
}

export function writeFontScaleToDom(scale: number): void {
  document.documentElement.style.setProperty("--app-font-scale", String(clampScale(scale)));
}

export function persistFontScale(scale: number): void {
  try { localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(clampScale(scale))); } catch { /* ignore */ }
}
