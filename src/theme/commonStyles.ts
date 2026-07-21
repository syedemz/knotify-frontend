import { StyleSheet } from "react-native";
import type { Theme } from "./theme";

/**
 * Shared layout fragments for use inside components (never inside screens).
 *
 * Consumed by `Row`, `Column`, `Box`, `Screen`, and other structural catalog
 * components. Screens must not import this factory directly — they compose
 * components instead.
 *
 * @param theme - The active theme returned by `useTheme()`.
 * @returns A `StyleSheet` object with reusable layout style keys.
 */
export function createCommonStyles(theme: Theme) {
  return StyleSheet.create({
    // Flex containers
    row: {
      flexDirection: "row",
      alignItems: "center",
    },
    rowSpaceBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    column: {
      flexDirection: "column",
    },
    center: {
      alignItems: "center",
      justifyContent: "center",
    },
    flex1: {
      flex: 1,
    },

    // Screen container
    screenPadding: {
      paddingHorizontal: theme.spacing.lg,
    },
    screenBackground: {
      flex: 1,
      backgroundColor: theme.colors.bg.primary,
    },

    // Card container
    card: {
      backgroundColor: theme.colors.bg.surface,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      padding: theme.spacing.lg,
    },

    // Divider
    divider: {
      height: 1,
      backgroundColor: theme.colors.border.default,
    },
  });
}
