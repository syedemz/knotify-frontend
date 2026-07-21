import React, { useMemo } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "@/theme";
import type { Theme } from "@/theme/theme";

type SpacingKey = keyof Theme["spacing"];
type RadiusKey = keyof Theme["radii"];
type BgColor = keyof Theme["colors"]["bg"];
type BorderColor = keyof Theme["colors"]["border"];
type ShadowKey = keyof Theme["shadows"];

/**
 * Props for the `Box` component.
 */
export interface BoxProps {
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
   * Horizontal (left + right) padding. Overrides `padding` on the horizontal axis.
   *
   * @default undefined
   */
  paddingX?: SpacingKey;
  /**
   * Vertical (top + bottom) padding. Overrides `padding` on the vertical axis.
   *
   * @default undefined
   */
  paddingY?: SpacingKey;
  /**
   * Top padding. Overrides `paddingY` and `padding` for the top edge.
   *
   * @default undefined
   */
  paddingTop?: SpacingKey;
  /**
   * Bottom padding. Overrides `paddingY` and `padding` for the bottom edge.
   *
   * @default undefined
   */
  paddingBottom?: SpacingKey;
  /**
   * Left padding. Overrides `paddingX` and `padding` for the left edge.
   *
   * @default undefined
   */
  paddingLeft?: SpacingKey;
  /**
   * Right padding. Overrides `paddingX` and `padding` for the right edge.
   *
   * @default undefined
   */
  paddingRight?: SpacingKey;
  /**
   * Uniform margin on all sides.
   *
   * @default undefined
   */
  margin?: SpacingKey;
  /**
   * Horizontal (left + right) margin.
   *
   * @default undefined
   */
  marginX?: SpacingKey;
  /**
   * Vertical (top + bottom) margin.
   *
   * @default undefined
   */
  marginY?: SpacingKey;
  /**
   * Top margin.
   *
   * @default undefined
   */
  marginTop?: SpacingKey;
  /**
   * Bottom margin.
   *
   * @default undefined
   */
  marginBottom?: SpacingKey;
  /**
   * Left margin.
   *
   * @default undefined
   */
  marginLeft?: SpacingKey;
  /**
   * Right margin.
   *
   * @default undefined
   */
  marginRight?: SpacingKey;
  /**
   * Border-radius token key.
   *
   * @default undefined (square corners)
   */
  radius?: RadiusKey;
  /**
   * Border color token key. When set, a 1px border in that color is applied.
   *
   * @default undefined (no border)
   */
  border?: BorderColor;
  /**
   * Shadow token key.
   *
   * @default undefined (no shadow)
   */
  shadow?: ShadowKey;
  /**
   * When true, the box expands to fill available space (`flex: 1`).
   *
   * @default false
   */
  flex?: boolean;
  /**
   * Content to render inside the box.
   */
  children?: React.ReactNode;
  /**
   * Accessibility label for the container.
   */
  accessibilityLabel?: string;
}

/**
 * General-purpose themed container. Accepts all spacing, color, radius,
 * border, and shadow appearance props as theme-token keys — no raw values.
 *
 * Use `Box` when you need a container with visual styling (background,
 * padding, border, radius). Use a plain structural `<View>` (carrying no
 * visual styling) when you only need flex layout.
 *
 * @example
 * ```tsx
 * <Box bg="surface" padding="lg" radius="lg" border="default">
 *   <Text>Card content</Text>
 * </Box>
 * ```
 */
export function Box({
  bg,
  padding,
  paddingX,
  paddingY,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  margin,
  marginX,
  marginY,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  radius,
  border,
  shadow,
  flex = false,
  children,
  accessibilityLabel,
}: BoxProps) {
  const theme = useTheme();

  // All concrete style values come from theme tokens. The StyleSheet is
  // recomputed only when the theme or relevant props change.
  const styles = useMemo(
    () => createStyles(theme, {
      bg, padding, paddingX, paddingY, paddingTop, paddingBottom,
      paddingLeft, paddingRight, margin, marginX, marginY, marginTop,
      marginBottom, marginLeft, marginRight, radius, border, shadow, flex,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      theme, bg, padding, paddingX, paddingY, paddingTop, paddingBottom,
      paddingLeft, paddingRight, margin, marginX, marginY, marginTop,
      marginBottom, marginLeft, marginRight, radius, border, shadow, flex,
    ],
  );

  return (
    <View style={styles.box} accessibilityLabel={accessibilityLabel}>
      {children}
    </View>
  );
}

/** Builds a StyleSheet with all resolved token values. */
function createStyles(
  theme: Theme,
  props: {
    bg?: BgColor;
    padding?: SpacingKey;
    paddingX?: SpacingKey;
    paddingY?: SpacingKey;
    paddingTop?: SpacingKey;
    paddingBottom?: SpacingKey;
    paddingLeft?: SpacingKey;
    paddingRight?: SpacingKey;
    margin?: SpacingKey;
    marginX?: SpacingKey;
    marginY?: SpacingKey;
    marginTop?: SpacingKey;
    marginBottom?: SpacingKey;
    marginLeft?: SpacingKey;
    marginRight?: SpacingKey;
    radius?: RadiusKey;
    border?: BorderColor;
    shadow?: ShadowKey;
    flex: boolean;
  },
) {
  const boxStyle: ViewStyle = {};

  if (props.bg !== undefined) {
    boxStyle.backgroundColor = theme.colors.bg[props.bg];
  }
  if (props.radius !== undefined) {
    boxStyle.borderRadius = theme.radii[props.radius];
  }
  if (props.border !== undefined) {
    boxStyle.borderWidth = 1;
    boxStyle.borderColor = theme.colors.border[props.border];
  }
  if (props.shadow !== undefined) {
    Object.assign(boxStyle, theme.shadows[props.shadow]);
  }
  if (props.flex) {
    boxStyle.flex = 1;
  }

  // Padding cascade: specific > axis > uniform
  if (props.padding !== undefined) {
    boxStyle.padding = theme.spacing[props.padding];
  }
  if (props.paddingX !== undefined) {
    boxStyle.paddingLeft = theme.spacing[props.paddingX];
    boxStyle.paddingRight = theme.spacing[props.paddingX];
  }
  if (props.paddingY !== undefined) {
    boxStyle.paddingTop = theme.spacing[props.paddingY];
    boxStyle.paddingBottom = theme.spacing[props.paddingY];
  }
  if (props.paddingTop !== undefined) {
    boxStyle.paddingTop = theme.spacing[props.paddingTop];
  }
  if (props.paddingBottom !== undefined) {
    boxStyle.paddingBottom = theme.spacing[props.paddingBottom];
  }
  if (props.paddingLeft !== undefined) {
    boxStyle.paddingLeft = theme.spacing[props.paddingLeft];
  }
  if (props.paddingRight !== undefined) {
    boxStyle.paddingRight = theme.spacing[props.paddingRight];
  }

  // Margin cascade
  if (props.margin !== undefined) {
    boxStyle.margin = theme.spacing[props.margin];
  }
  if (props.marginX !== undefined) {
    boxStyle.marginLeft = theme.spacing[props.marginX];
    boxStyle.marginRight = theme.spacing[props.marginX];
  }
  if (props.marginY !== undefined) {
    boxStyle.marginTop = theme.spacing[props.marginY];
    boxStyle.marginBottom = theme.spacing[props.marginY];
  }
  if (props.marginTop !== undefined) {
    boxStyle.marginTop = theme.spacing[props.marginTop];
  }
  if (props.marginBottom !== undefined) {
    boxStyle.marginBottom = theme.spacing[props.marginBottom];
  }
  if (props.marginLeft !== undefined) {
    boxStyle.marginLeft = theme.spacing[props.marginLeft];
  }
  if (props.marginRight !== undefined) {
    boxStyle.marginRight = theme.spacing[props.marginRight];
  }

  return StyleSheet.create({ box: boxStyle });
}
