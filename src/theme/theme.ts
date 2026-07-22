// ============================================================
// SINGLE SOURCE OF TRUTH FOR ALL DESIGN TOKENS
// To change a color globally, edit ONLY this file.
// ============================================================

const palette = {
  // Brand
  brandPink: "#E91E63",
  brandPinkSoft: "#F8BBD0",
  brandPinkBg: "#FCE4EC",
  brandMint: "#4ECDC4",
  brandMintSoft: "#A8E6E1",
  brandOrange: "#F77F3F",
  brandGold: "#A88A2C",
  brandGoldBg: "#F5EFD9",

  // Neutrals
  black: "#0E1116",
  gray900: "#1A1D23",
  gray700: "#4A4F58",
  gray500: "#8B9099",
  gray300: "#D4D7DC",
  gray200: "#E8EAED",
  gray100: "#F4F5F7",
  gray50: "#FAFAFB",
  white: "#FFFFFF",

  // Semantic raw
  success: "#4ECDC4",
  error: "#E63946",
  warning: "#F4A261",
  info: "#5B8DEF",

  // Dark mode brand
  brandPinkDark: "#FF4081",
  brandPinkSoftDark: "#7A2547",
  brandPinkBgDark: "#3D1828",
  brandMintDark: "#5DDED4",
  brandOrangeDark: "#FF9A5C",
  brandGoldDark: "#D4B85A",
  brandGoldBgDark: "#2A2418",

  // Dark mode neutrals
  bgPrimaryDark: "#0E1116",
  bgSurfaceDark: "#181B22",
  bgElevatedDark: "#22262E",
  borderDark: "#2D323B",
  dividerDark: "#23272E",
  textPrimaryDark: "#F4F5F7",
  textSecondaryDark: "#A8ADB7",
  textTertiaryDark: "#6B7280",
  inputBgDark: "#1F2229",
  errorDark: "#FF6B6B",
  warningDark: "#FFB870",
  infoDark: "#7FA8FF",
};

export const lightColors = {
  bg: {
    primary: palette.white,
    surface: palette.white,
    elevated: palette.white,
    input: palette.gray100,
    muted: palette.gray50,
    premium: palette.brandGoldBg,
  },
  text: {
    primary: palette.black,
    secondary: palette.gray700,
    tertiary: palette.gray500,
    inverse: palette.white,
    brand: palette.brandPink,
    premium: palette.brandGold,
  },
  border: {
    default: palette.gray200,
    strong: palette.gray300,
  },
  accent: {
    primary: palette.brandPink,
    primaryDisabled: palette.brandPinkSoft,
    secondary: palette.brandMint,
    secondaryDisabled: palette.brandMintSoft,
    tertiary: palette.brandOrange,
  },
  status: {
    success: palette.success,
    error: palette.error,
    warning: palette.warning,
    info: palette.info,
  },
  notification: {
    dot: palette.brandPink,
  },
};

export const darkColors = {
  bg: {
    primary: palette.bgPrimaryDark,
    surface: palette.bgSurfaceDark,
    elevated: palette.bgElevatedDark,
    input: palette.inputBgDark,
    muted: palette.bgSurfaceDark,
    premium: palette.brandGoldBgDark,
  },
  text: {
    primary: palette.textPrimaryDark,
    secondary: palette.textSecondaryDark,
    tertiary: palette.textTertiaryDark,
    inverse: palette.black,
    brand: palette.brandPinkDark,
    premium: palette.brandGoldDark,
  },
  border: {
    default: palette.borderDark,
    strong: palette.borderDark,
  },
  accent: {
    primary: palette.brandPinkDark,
    primaryDisabled: palette.brandPinkSoftDark,
    secondary: palette.brandMintDark,
    secondaryDisabled: palette.brandMintDark,
    tertiary: palette.brandOrangeDark,
  },
  status: {
    success: palette.brandMintDark,
    error: palette.errorDark,
    warning: palette.warningDark,
    info: palette.infoDark,
  },
  notification: {
    dot: palette.brandPinkDark,
  },
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  giant: 64,
} as const;

export const radii = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
} as const;

export const shadows = {
  none: {},
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export type ColorScheme = typeof lightColors;
export type Theme = {
  mode: "light" | "dark";
  colors: ColorScheme;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
};

export const lightTheme: Theme = {
  mode: "light",
  colors: lightColors,
  spacing,
  radii,
  shadows,
};

export const darkTheme: Theme = {
  mode: "dark",
  colors: darkColors,
  spacing,
  radii,
  shadows,
};
