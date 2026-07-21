import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/theme";
import type { Theme } from "@/theme/theme";

type SpacingKey = keyof Theme["spacing"];
type RadiusKey = keyof Theme["radii"];
type BgKey = keyof Theme["colors"]["bg"];
type ShadowKey = keyof Theme["shadows"];

/**
 * Props for the `Card` component.
 */
export interface CardProps {
  /**
   * Background color token key from `theme.colors.bg`.
   *
   * @default 'surface'
   */
  bg?: BgKey;
  /**
   * Internal padding on all sides, token key from `theme.spacing`.
   *
   * @default 'lg'
   */
  padding?: SpacingKey;
  /**
   * Border radius token key from `theme.radii`.
   *
   * @default 'lg'
   */
  radius?: RadiusKey;
  /**
   * Shadow token key from `theme.shadows`.
   *
   * @default 'sm'
   */
  shadow?: ShadowKey;
  /**
   * When true, renders a 1px border using `theme.colors.border.default`.
   *
   * @default true
   */
  bordered?: boolean;
  /**
   * Accessibility label for the card container.
   */
  accessibilityLabel?: string;
  /**
   * Card content.
   */
  children: React.ReactNode;
}

/**
 * Themed container card following §9.6 from `theme.md`.
 *
 * Soft-rounded surface with optional border, shadow, and configurable
 * background. All appearance values derive from theme tokens — no raw
 * colors or pixel values.
 *
 * @example
 * ```tsx
 * <Card>
 *   <Text>Profile summary</Text>
 * </Card>
 *
 * <Card bg="premium" shadow="md" bordered={false}>
 *   <Text>Premium content</Text>
 * </Card>
 * ```
 */
export function Card({
  bg = "surface",
  padding = "lg",
  radius = "lg",
  shadow = "sm",
  bordered = true,
  accessibilityLabel,
  children,
}: CardProps) {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, bg, padding, radius, shadow, bordered),
    [theme, bg, padding, radius, shadow, bordered],
  );

  return (
    <View
      style={styles.card}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
}

function createStyles(
  theme: Theme,
  bg: BgKey,
  padding: SpacingKey,
  radius: RadiusKey,
  shadow: ShadowKey,
  bordered: boolean,
) {
  const shadowStyle = theme.shadows[shadow];

  return StyleSheet.create({
    card: {
      backgroundColor: theme.colors.bg[bg],
      padding: theme.spacing[padding],
      borderRadius: theme.radii[radius],
      ...(bordered && {
        borderWidth: 1,
        borderColor: theme.colors.border.default,
      }),
      ...shadowStyle,
    },
  });
}
