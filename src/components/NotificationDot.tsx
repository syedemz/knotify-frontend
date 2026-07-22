import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/theme";
import type { Theme } from "@/theme/theme";

type NotificationDotColor = keyof Theme["colors"]["notification"];

/**
 * Size preset for the notification dot.
 *
 * - `'sm'`: 6px (default, matches §9.14).
 * - `'md'`: 10px (for more prominent indicators).
 */
export type NotificationDotSize = "sm" | "md";

/** Pixel size for each dot size preset. */
const DOT_PX: Record<NotificationDotSize, number> = {
  sm: 6,
  md: 10,
};

/**
 * Props for the `NotificationDot` component.
 */
export interface NotificationDotProps {
  /**
   * Whether the dot is currently visible.
   *
   * @default true
   */
  visible?: boolean;
  /**
   * Size preset.
   *
   * @default 'sm'
   */
  size?: NotificationDotSize;
  /**
   * Color token key from `theme.colors.notification`.
   *
   * @default 'dot'
   */
  color?: NotificationDotColor;
  /**
   * Accessibility label. Omit for decorative indicators already covered
   * by a parent accessibilityLabel.
   */
  accessibilityLabel?: string;
}

/**
 * Small filled circle for unread notification indicators (§9.14 from `theme.md`).
 *
 * Used on icons, tabs, list rows, and menu items to signal unread items.
 * Default size is 6px in `notification.dot` brand pink. All appearance
 * values derive from theme tokens.
 *
 * @example
 * ```tsx
 * // Absolute-positioned overlay on a tab icon
 * <View style={{ position: 'relative' }}>
 *   <Icon icon={MessageCircle} />
 *   <View style={{ position: 'absolute', top: 0, right: 0 }}>
 *     <NotificationDot visible={hasUnread} />
 *   </View>
 * </View>
 * ```
 */
export function NotificationDot({
  visible = true,
  size = "sm",
  color = "dot",
  accessibilityLabel,
}: NotificationDotProps) {
  const theme = useTheme();
  const px = DOT_PX[size];
  const styles = useMemo(
    () => createStyles(theme, px, color),
    [theme, px, color],
  );

  if (!visible) {
    return null;
  }

  const decorative = accessibilityLabel === undefined;

  return (
    <View
      style={styles.dot}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? "no-hide-descendants" : "yes"}
    />
  );
}

function createStyles(
  theme: Theme,
  px: number,
  color: NotificationDotColor,
) {
  return StyleSheet.create({
    dot: {
      width: px,
      height: px,
      borderRadius: px / 2,
      backgroundColor: theme.colors.notification[color],
    },
  });
}
