import { create } from "zustand";
import {
  clampBorderRadiusRem,
  persistBorderRadiusRem,
  readStoredBorderRadiusRem,
  writeBorderRadiusToDom,
} from "@/lib/borderRadius";
import {
  applyColorSchemeToDom,
  persistColorScheme,
  readStoredColorScheme,
  type ColorScheme,
} from "@/lib/colorScheme";
import {
  clampFontScale,
  persistFontScale,
  readStoredFontScale,
  writeFontScaleToDom,
} from "@/lib/fontScale";

interface ThemeStore {
  fontScale: number;
  borderRadiusRem: number;
  colorScheme: ColorScheme;
  setFontScale: (scale: number) => void;
  setBorderRadiusRem: (rem: number) => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  fontScale: readStoredFontScale(),
  borderRadiusRem: readStoredBorderRadiusRem(),
  colorScheme: readStoredColorScheme(),
  setFontScale: (scale) => {
    const clamped = clampFontScale(scale);
    persistFontScale(clamped);
    if (typeof document !== "undefined") writeFontScaleToDom(clamped);
    set({ fontScale: clamped });
  },
  setBorderRadiusRem: (rem) => {
    const clamped = clampBorderRadiusRem(rem);
    persistBorderRadiusRem(clamped);
    if (typeof document !== "undefined") writeBorderRadiusToDom(clamped);
    set({ borderRadiusRem: clamped });
  },
  setColorScheme: (colorScheme) => {
    persistColorScheme(colorScheme);
    if (typeof document !== "undefined") applyColorSchemeToDom(colorScheme);
    set({ colorScheme });
  },
}));
