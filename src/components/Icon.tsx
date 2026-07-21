import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { useTheme } from "@/theme";
import type { Theme } from "@/theme/theme";

type IconColor =
  | keyof Theme["colors"]["text"]
  | keyof Theme["colors"]["accent"]
  | keyof Theme["colors"]["status"];

/**
 * Size preset for the icon.
 *
 * - `'sm'`: 16px
 * - `'md'`: 20px
 * - `'lg'`: 24px (default, matches §10 tab/default size)
 * - `'xl'`: 32px
 */
export type IconSize = "sm" | "md" | "lg" | "xl";

/** Pixel dimensions for each icon size preset. */
const SIZE_PX: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

/**
 * Props for the `Icon` component.
 */
export interface IconProps {
  /**
   * A Lucide icon component reference (e.g., `Heart`, `ChevronRight`).
   */
  icon: LucideIcon;
  /**
   * Size preset.
   *
   * @default 'lg'
   */
  size?: IconSize;
  /**
   * Color token key. Resolves against `theme.colors.text`, `theme.colors.accent`,
   * or `theme.colors.status` in that priority order.
   *
   * @default 'primary' (resolves to text.primary)
   */
  color?: IconColor;
  /**
   * Stroke width of the icon lines in pixels.
   *
   * @default 1.5
   */
  strokeWidth?: number;
  /**
   * Accessibility label for screen readers.
   * Omit for decorative icons (they receive `accessibilityElementsHidden`).
   */
  accessibilityLabel?: string;
}

/**
 * Themed icon component wrapping `lucide-react-native`.
 *
 * Renders outlined Lucide icons at consistent sizes with theme-token colors.
 * Per §10 from `theme.md`: default size is 24×24, stroke is outlined
 * (1.5–2px). All appearance values derive from theme tokens.
 *
 * @example
 * ```tsx
 * import { Heart } from 'lucide-react-native';
 * <Icon icon={Heart} color="primary" size="lg" accessibilityLabel="Liked" />
 * <Icon icon={ChevronRight} color="tertiary" size="md" />
 * ```
 */
export function Icon({
  icon: LucideIconComponent,
  size = "lg",
  color = "primary",
  strokeWidth = 1.5,
  accessibilityLabel,
}: IconProps) {
  const theme = useTheme();
  const px = SIZE_PX[size];
  const styles = useMemo(() => createStyles(px), [px]);

  const resolvedColor = resolveColor(theme, color);

  const decorative = accessibilityLabel === undefined;

  return (
    <View
      style={styles.container}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? "no-hide-descendants" : "yes"}
    >
      <LucideIconComponent
        size={px}
        color={resolvedColor}
        strokeWidth={strokeWidth}
      />
    </View>
  );
}

/**
 * Resolves an `IconColor` union key to a concrete color string from the theme.
 * Priority: text > accent > status.
 */
function resolveColor(theme: Theme, color: IconColor): string {
  if (color in theme.colors.text) {
    return theme.colors.text[color as keyof Theme["colors"]["text"]];
  }
  if (color in theme.colors.accent) {
    return theme.colors.accent[color as keyof Theme["colors"]["accent"]];
  }
  return theme.colors.status[color as keyof Theme["colors"]["status"]];
}

function createStyles(px: number) {
  return StyleSheet.create({
    container: {
      width: px,
      height: px,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
