import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/theme";
import type { Theme } from "@/theme/theme";

type SpacingKey = keyof Theme["spacing"];
type BgColor = keyof Theme["colors"]["bg"];

/**
 * Props for the `Column` component.
 */
export interface ColumnProps {
  /**
   * Gap between direct children.
   *
   * @default undefined (no gap)
   */
  gap?: SpacingKey;
  /**
   * Background color token key.
   *
   * @default undefined (transparent)
   */
  bg?: BgColor;
  /**
   * Uniform padding on all sides.
   *
   * @default undefined
   */
  padding?: SpacingKey;
  /**
   * Horizontal (left + right) padding.
   *
   * @default undefined
   */
  paddingX?: SpacingKey;
  /**
   * Vertical (top + bottom) padding.
   *
   * @default undefined
   */
  paddingY?: SpacingKey;
  /**
   * Alignment of children along the main (column) axis.
   *
   * @default 'flex-start'
   */
  justify?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
  /**
   * Alignment of children along the cross axis.
   *
   * @default 'stretch'
   */
  align?: "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
  /**
   * When true, the column expands to fill available space (`flex: 1`).
   *
   * @default false
   */
  flex?: boolean;
  /**
   * Content to render in a vertical column.
   */
  children?: React.ReactNode;
  /**
   * Accessibility label for the column container.
   */
  accessibilityLabel?: string;
}

/**
 * Vertical flex container. Children are stacked in a column with optional gap,
 * alignment, and background color — all via theme-token props.
 *
 * @example
 * ```tsx
 * <Column gap="lg" flex>
 *   <Heading variant="xl">Title</Heading>
 *   <Text>Body text</Text>
 * </Column>
 * ```
 */
export function Column({
  gap,
  bg,
  padding,
  paddingX,
  paddingY,
  justify = "flex-start",
  align = "stretch",
  flex = false,
  children,
  accessibilityLabel,
}: ColumnProps) {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, { gap, bg, padding, paddingX, paddingY, justify, align, flex }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme, gap, bg, padding, paddingX, paddingY, justify, align, flex],
  );

  return (
    <View style={styles.column} accessibilityLabel={accessibilityLabel}>
      {children}
    </View>
  );
}

function createStyles(
  theme: Theme,
  props: {
    gap?: SpacingKey;
    bg?: BgColor;
    padding?: SpacingKey;
    paddingX?: SpacingKey;
    paddingY?: SpacingKey;
    justify: string;
    align: string;
    flex: boolean;
  },
) {
  return StyleSheet.create({
    column: {
      flexDirection: "column",
      alignItems: props.align as "flex-start" | "center" | "flex-end" | "stretch" | "baseline",
      justifyContent: props.justify as "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly",
      ...(props.flex && { flex: 1 }),
      ...(props.bg !== undefined && { backgroundColor: theme.colors.bg[props.bg] }),
      ...(props.gap !== undefined && { gap: theme.spacing[props.gap] }),
      ...(props.padding !== undefined && { padding: theme.spacing[props.padding] }),
      ...(props.paddingX !== undefined && {
        paddingLeft: theme.spacing[props.paddingX],
        paddingRight: theme.spacing[props.paddingX],
      }),
      ...(props.paddingY !== undefined && {
        paddingTop: theme.spacing[props.paddingY],
        paddingBottom: theme.spacing[props.paddingY],
      }),
    },
  });
}
