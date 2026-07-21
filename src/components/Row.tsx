import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/theme";
import type { Theme } from "@/theme/theme";

type SpacingKey = keyof Theme["spacing"];
type BgColor = keyof Theme["colors"]["bg"];

/**
 * Props for the `Row` component.
 */
export interface RowProps {
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
   * Horizontal alignment of children along the main (row) axis.
   *
   * @default 'flex-start'
   */
  justify?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
  /**
   * Vertical alignment of children along the cross axis.
   *
   * @default 'center'
   */
  align?: "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
  /**
   * Whether children may wrap to the next line when the row overflows.
   *
   * @default false
   */
  wrap?: boolean;
  /**
   * When true, the row expands to fill available space (`flex: 1`).
   *
   * @default false
   */
  flex?: boolean;
  /**
   * Content to render in a horizontal row.
   */
  children?: React.ReactNode;
  /**
   * Accessibility label for the row container.
   */
  accessibilityLabel?: string;
}

/**
 * Horizontal flex container. Children are arranged in a row with optional gap,
 * alignment, and background color — all via theme-token props.
 *
 * @example
 * ```tsx
 * <Row gap="md" align="center" justify="space-between">
 *   <Text>Left</Text>
 *   <Text>Right</Text>
 * </Row>
 * ```
 */
export function Row({
  gap,
  bg,
  padding,
  paddingX,
  paddingY,
  justify = "flex-start",
  align = "center",
  wrap = false,
  flex = false,
  children,
  accessibilityLabel,
}: RowProps) {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, { gap, bg, padding, paddingX, paddingY, justify, align, wrap, flex }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme, gap, bg, padding, paddingX, paddingY, justify, align, wrap, flex],
  );

  return (
    <View style={styles.row} accessibilityLabel={accessibilityLabel}>
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
    wrap: boolean;
    flex: boolean;
  },
) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: props.align as "flex-start" | "center" | "flex-end" | "stretch" | "baseline",
      justifyContent: props.justify as "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly",
      flexWrap: props.wrap ? "wrap" : "nowrap",
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
