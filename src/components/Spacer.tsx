import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/theme";
import type { Theme } from "@/theme/theme";

type SpacingKey = keyof Theme["spacing"];

/**
 * Props for the `Spacer` component.
 */
export interface SpacerProps {
  /**
   * Spacing token key that controls the size of the spacer.
   *
   * When `axis` is `'vertical'` (default), the spacer adds height.
   * When `axis` is `'horizontal'`, it adds width.
   *
   * @default 'md'
   */
  size?: SpacingKey;
  /**
   * The axis along which the spacer expands.
   *
   * @default 'vertical'
   */
  axis?: "vertical" | "horizontal";
}

/**
 * Fixed-size whitespace block. Inserts vertical or horizontal space using a
 * theme spacing token — no raw pixel values.
 *
 * Prefer `gap` on `Row` / `Column` for uniform child spacing. Use `Spacer`
 * only when you need a one-off space at a specific point in the layout.
 *
 * @example
 * ```tsx
 * <Heading variant="xl">Title</Heading>
 * <Spacer size="lg" />
 * <Text>Body text below the title</Text>
 * ```
 */
export function Spacer({ size = "md", axis = "vertical" }: SpacerProps) {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, size, axis),
    [theme, size, axis],
  );

  return <View style={styles.spacer} />;
}

function createStyles(theme: Theme, size: SpacingKey, axis: "vertical" | "horizontal") {
  const value = theme.spacing[size];
  return StyleSheet.create({
    spacer: {
      ...(axis === "vertical" ? { height: value } : { width: value }),
    },
  });
}
