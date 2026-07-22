import React, { useMemo } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { useTheme } from "@/theme";
import type { Theme } from "@/theme/theme";

type SpacingKey = keyof Theme["spacing"];

/**
 * Props for the `Screen` component.
 */
export interface ScreenProps {
  /**
   * Content to render inside the screen.
   */
  children: React.ReactNode;
  /**
   * Horizontal padding applied to the screen edges.
   *
   * @default 'lg' (16px — standard screen edge padding per §6)
   */
  paddingX?: SpacingKey;
  /**
   * Vertical padding at the top and bottom of the screen.
   *
   * @default 'none' (0)
   */
  paddingY?: SpacingKey;
  /**
   * Whether to apply safe-area insets on top and bottom edges.
   *
   * @default true
   */
  safe?: boolean;
  /**
   * Whether the screen content should scroll. When `false`, the screen
   * fills the remaining space with a flex column.
   *
   * @default false
   */
  scroll?: boolean;
  /**
   * Accessibility label for the screen container.
   */
  accessibilityLabel?: string;
}

/**
 * Root screen container. Applies the primary background color from the active
 * theme, handles safe-area insets, and enforces consistent horizontal padding.
 *
 * Every screen in the app must be wrapped in this component — never use a raw
 * `<View>` with visual styling as the screen root.
 *
 * @example
 * ```tsx
 * <Screen paddingX="lg">
 *   <Heading variant="xl">Hello</Heading>
 * </Screen>
 * ```
 */
export function Screen({
  children,
  paddingX = "lg",
  paddingY,
  safe = true,
  accessibilityLabel,
}: ScreenProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const inner = (
    <View
      style={[
        styles.inner,
        { paddingHorizontal: theme.spacing[paddingX] },
        paddingY !== undefined && {
          paddingVertical: theme.spacing[paddingY],
        },
      ]}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );

  if (safe) {
    return <SafeAreaView style={styles.root}>{inner}</SafeAreaView>;
  }

  return <View style={styles.root}>{inner}</View>;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.bg.primary,
    },
    inner: {
      flex: 1,
    },
  });
