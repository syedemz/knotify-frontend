import React, { useMemo } from "react";
import { StyleSheet, View, Text as RNText } from "react-native";
import { useTheme } from "@/theme";
import { textStyles } from "@/theme/typography";
import type { Theme } from "@/theme/theme";

/**
 * Visual variant for the badge.
 *
 * - `'primary'`: brand pink background, white text.
 * - `'secondary'`: mint background, dark text.
 * - `'muted'`: gray background, secondary text.
 * - `'premium'`: gold tint background, premium text.
 */
export type BadgeVariant = "primary" | "secondary" | "muted" | "premium";

/**
 * Size preset for the badge.
 *
 * - `'sm'`: smaller pill, label.sm text.
 * - `'md'`: standard pill, label.md text (default).
 */
export type BadgeSize = "sm" | "md";

/**
 * Props for the `Badge` component.
 */
export interface BadgeProps {
  /**
   * Badge label text.
   */
  label: string;
  /**
   * Visual variant.
   *
   * @default 'primary'
   */
  variant?: BadgeVariant;
  /**
   * Size preset.
   *
   * @default 'md'
   */
  size?: BadgeSize;
  /**
   * Accessibility label. Defaults to `label`.
   */
  accessibilityLabel?: string;
}

/**
 * Pill-shaped badge for count indicators or status labels.
 *
 * Used for unread counts, feature tags, and status chips. All appearance
 * values derive from theme tokens — no raw colors or pixel values.
 *
 * @example
 * ```tsx
 * <Badge label="3" />
 * <Badge label="Premium" variant="premium" />
 * <Badge label="New" variant="secondary" size="sm" />
 * ```
 */
export function Badge({
  label,
  variant = "primary",
  size = "md",
  accessibilityLabel,
}: BadgeProps) {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, variant, size),
    [theme, variant, size],
  );

  return (
    <View
      style={styles.badge}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <RNText style={styles.label}>{label}</RNText>
    </View>
  );
}

function createStyles(theme: Theme, variant: BadgeVariant, size: BadgeSize) {
  const bgColor = {
    primary: theme.colors.accent.primary,
    secondary: theme.colors.accent.secondary,
    muted: theme.colors.bg.muted,
    premium: theme.colors.bg.premium,
  }[variant];

  const textColor = {
    primary: theme.colors.text.inverse,
    secondary: theme.colors.text.primary,
    muted: theme.colors.text.secondary,
    premium: theme.colors.text.premium,
  }[variant];

  const labelStyle = size === "sm" ? textStyles.label.sm : textStyles.label.md;

  const paddingV = size === "sm" ? theme.spacing.xxs : theme.spacing.xs;
  const paddingH = size === "sm" ? theme.spacing.sm : theme.spacing.md;

  return StyleSheet.create({
    badge: {
      backgroundColor: bgColor,
      paddingVertical: paddingV,
      paddingHorizontal: paddingH,
      borderRadius: theme.radii.pill,
      alignSelf: "flex-start",
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      ...labelStyle,
      color: textColor,
    },
  });
}
