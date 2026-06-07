export const BORDER_RADIUS_STORAGE_KEY = "assistance-border-radius";
export const RADIUS_MIN_REM = 0.125;
export const RADIUS_MAX_REM = 1.25;
export const DEFAULT_RADIUS_REM = 0.75;

function clampRadiusRem(n: number) {
  return Math.min(RADIUS_MAX_REM, Math.max(RADIUS_MIN_REM, n));
}

export const clampBorderRadiusRem = clampRadiusRem;

export function readStoredBorderRadiusRem(): number {
  if (typeof window === "undefined") return DEFAULT_RADIUS_REM;
  try {
    const raw = localStorage.getItem(BORDER_RADIUS_STORAGE_KEY);
    if (raw == null) return DEFAULT_RADIUS_REM;
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? clampRadiusRem(n) : DEFAULT_RADIUS_REM;
  } catch { return DEFAULT_RADIUS_REM; }
}

export function writeBorderRadiusToDom(rem: number): void {
  document.documentElement.style.setProperty("--radius", `${clampRadiusRem(rem)}rem`);
}

export function persistBorderRadiusRem(rem: number): void {
  try { localStorage.setItem(BORDER_RADIUS_STORAGE_KEY, String(clampRadiusRem(rem))); } catch { /* ignore */ }
}
