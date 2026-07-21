// ============================================================
// SINGLE SOURCE OF TRUTH FOR ALL FONTS AND TEXT STYLES
// To change a font globally, edit ONLY this file.
// ============================================================

import { TextStyle } from "react-native";

/**
 * Font family registry.
 *
 * `primary` — Plus Jakarta Sans (English/default). All weights must be loaded
 * via `expo-font` at app startup (see App.tsx).
 *
 * `urdu` — Noto Nastaliq Urdu. Four weights (Regular/Medium/SemiBold/Bold).
 * Files live at `src/assets/fonts/NotoNastaliqUrdu-*.ttf`. Must also be
 * loaded via `expo-font` at app startup.
 *
 * To change a font app-wide, edit only this object. No other file should
 * reference font family strings directly.
 */
export const fontFamily = {
  primary: {
    regular: "PlusJakartaSans-Regular",
    medium: "PlusJakartaSans-Medium",
    semibold: "PlusJakartaSans-SemiBold",
    bold: "PlusJakartaSans-Bold",
    extrabold: "PlusJakartaSans-ExtraBold",
  },
  /**
   * Urdu script font — Noto Nastaliq Urdu (SIL Open Font License).
   * Consumed by `useLocalizedFontFamily()` when locale is `ur`.
   * Note: Nastaliq script does not have a typographic ExtraBold weight;
   * `bold` is the heaviest available variant.
   */
  urdu: {
    regular: "NotoNastaliqUrdu-Regular",
    medium: "NotoNastaliqUrdu-Medium",
    semibold: "NotoNastaliqUrdu-SemiBold",
    bold: "NotoNastaliqUrdu-Bold",
  },
} as const;

export const fontSize = {
  xs: 11,
  sm: 12,
  md: 13,
  base: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  display: 28,
  displayLg: 32,
} as const;

export const fontWeight = {
  regular: "400" as TextStyle["fontWeight"],
  medium: "500" as TextStyle["fontWeight"],
  semibold: "600" as TextStyle["fontWeight"],
  bold: "700" as TextStyle["fontWeight"],
  extrabold: "800" as TextStyle["fontWeight"],
};

export const textStyles = {
  display: {
    lg: {
      fontFamily: fontFamily.primary.extrabold,
      fontSize: 32,
      lineHeight: 40,
    } as TextStyle,
    md: {
      fontFamily: fontFamily.primary.extrabold,
      fontSize: 28,
      lineHeight: 36,
    } as TextStyle,
  },
  heading: {
    xl: {
      fontFamily: fontFamily.primary.bold,
      fontSize: 24,
      lineHeight: 32,
    } as TextStyle,
    lg: {
      fontFamily: fontFamily.primary.bold,
      fontSize: 20,
      lineHeight: 28,
    } as TextStyle,
    md: {
      fontFamily: fontFamily.primary.semibold,
      fontSize: 18,
      lineHeight: 26,
    } as TextStyle,
    sm: {
      fontFamily: fontFamily.primary.semibold,
      fontSize: 16,
      lineHeight: 24,
    } as TextStyle,
  },
  body: {
    lg: {
      fontFamily: fontFamily.primary.regular,
      fontSize: 16,
      lineHeight: 24,
    } as TextStyle,
    md: {
      fontFamily: fontFamily.primary.regular,
      fontSize: 14,
      lineHeight: 22,
    } as TextStyle,
    sm: {
      fontFamily: fontFamily.primary.regular,
      fontSize: 13,
      lineHeight: 20,
    } as TextStyle,
  },
  label: {
    lg: {
      fontFamily: fontFamily.primary.semibold,
      fontSize: 16,
      lineHeight: 22,
    } as TextStyle,
    md: {
      fontFamily: fontFamily.primary.semibold,
      fontSize: 14,
      lineHeight: 20,
    } as TextStyle,
    sm: {
      fontFamily: fontFamily.primary.medium,
      fontSize: 12,
      lineHeight: 16,
    } as TextStyle,
  },
  caption: {
    fontFamily: fontFamily.primary.medium,
    fontSize: 11,
    lineHeight: 14,
  } as TextStyle,
};
