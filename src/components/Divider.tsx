import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/theme";
import type { Theme } from "@/theme/theme";

type SpacingKey = keyof Theme["spacing"];
type BorderColor = keyof Theme["colors"]["border"];

/**
 * Props for the `Divider` component.
 */
export interface DividerProps {
  /**
   * Color token key for the divider line.
   *
   * @default 'default'
   */
  color?: BorderColor;
  /**
   * Vertical spacing (margin) on each side of the divider.
   *
   * @default undefined (no margin)
   */
  spacing?: SpacingKey;
  /**
   * Accessibility label for the separator.
   *
   * @default 'Divider'
   */
  accessibilityLabel?: string;
}

/**
 * Horizontal 1px rule. Uses `border.default` by default; switch to
 * `border.strong` for a more prominent separator. Optionally adds vertical
 * margin from the spacing scale.
 *
 * @example
 * ```tsx
 * <Divider spacing="lg" />
 * ```
 */
export function Divider({
  color = "default",
  spacing,
  accessibilityLabel = "Divider",
}: DividerProps) {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, color, spacing),
    [theme, color, spacing],
  );

  return (
    <View
      style={styles.divider}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

function createStyles(theme: Theme, color: BorderColor, spacing?: SpacingKey) {
  return StyleSheet.create({
    divider: {
      height: 1,
      backgroundColor: theme.colors.border[color],
      ...(spacing !== undefined && { marginVertical: theme.spacing[spacing] }),
    },
  });
}
