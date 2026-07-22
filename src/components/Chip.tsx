import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text as RNText, View } from "react-native";
import { useTheme } from "@/theme";
import { textStyles } from "@/theme/typography";
import type { Theme } from "@/theme/theme";

/**
 * Chip variant controls background and text color.
 *
 * - `'default'`: `bg.muted` background with `text.secondary` label — neutral informational chip.
 * - `'brand'`: `accent.primary` (pink) background with `text.inverse` (white) label — highlight/active.
 * - `'success'`: `status.success` background with `text.inverse` label — positive state.
 * - `'warning'`: `status.warning` background with `text.inverse` label — caution state.
 * - `'error'`: `status.error` background with `text.inverse` label — error/danger state.
 */
export type ChipVariant = "default" | "brand" | "success" | "warning" | "error";

/**
 * Props for the `Chip` component.
 */
export interface ChipProps {
  /**
   * The label text displayed inside the chip.
   */
  label: string;
  /**
   * Color variant for the chip.
   *
   * @default 'default'
   */
  variant?: ChipVariant;
  /**
   * Optional icon rendered to the left of the label.
   */
  iconLeft?: React.ReactNode;
  /**
   * Optional icon rendered to the right of the label (e.g., a dismiss × icon).
   */
  iconRight?: React.ReactNode;
  /**
   * When provided, the chip becomes pressable and this callback fires on press.
   * When omitted, the chip is a static informational badge.
   *
   * @default undefined (non-interactive)
   */
  onPress?: () => void;
  /**
   * When true and `onPress` is provided, the chip is non-interactive.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * Accessibility label. Defaults to the label text.
   *
   * @default `label` prop value
   */
  accessibilityLabel?: string;
}

/**
 * Small labelled badge / tag. Used for status indicators, content tags, and
 * active-filter labels.
 *
 * Variant-to-token mapping:
 * - `default` → `bg.muted` + `text.secondary`
 * - `brand`   → `accent.primary` + `text.inverse`
 * - `success` → `status.success` + `text.inverse`
 * - `warning` → `status.warning` + `text.inverse`
 * - `error`   → `status.error` + `text.inverse`
 *
 * When `onPress` is provided the chip renders as a `Pressable`; otherwise
 * it is a static `View`.
 *
 * @example
 * ```tsx
 * <Chip label="Online" variant="success" />
 * <Chip label="Islamic" variant="default" onPress={removeFilter} />
 * ```
 */
export function Chip({
  label,
  variant = "default",
  iconLeft,
  iconRight,
  onPress,
  disabled = false,
  accessibilityLabel,
}: ChipProps) {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, variant),
    [theme, variant],
  );

  const inner = (
    <View style={styles.inner}>
      {iconLeft !== undefined && <View style={styles.iconLeft}>{iconLeft}</View>}
      <RNText style={styles.label}>{label}</RNText>
      {iconRight !== undefined && <View style={styles.iconRight}>{iconRight}</View>}
    </View>
  );

  if (onPress !== undefined) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.chip,
          disabled && styles.chipDisabled,
          pressed && !disabled && styles.chipPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled }}
      >
        {inner}
      </Pressable>
    );
  }

  return (
    <View style={styles.chip} accessibilityLabel={accessibilityLabel ?? label}>
      {inner}
    </View>
  );
}

function resolveColors(
  theme: Theme,
  variant: ChipVariant,
): { bg: string; label: string } {
  switch (variant) {
    case "brand":
      return {
        bg: theme.colors.accent.primary,
        label: theme.colors.text.inverse,
      };
    case "success":
      return {
        bg: theme.colors.status.success,
        label: theme.colors.text.inverse,
      };
    case "warning":
      return {
        bg: theme.colors.status.warning,
        label: theme.colors.text.inverse,
      };
    case "error":
      return {
        bg: theme.colors.status.error,
        label: theme.colors.text.inverse,
      };
    case "default":
    default:
      return {
        bg: theme.colors.bg.muted,
        label: theme.colors.text.secondary,
      };
  }
}

function createStyles(theme: Theme, variant: ChipVariant) {
  const { bg, label: labelColor } = resolveColors(theme, variant);

  return StyleSheet.create({
    chip: {
      backgroundColor: bg,
      borderRadius: theme.radii.sm,
      paddingVertical: theme.spacing.xxs,
      paddingHorizontal: theme.spacing.sm,
      alignSelf: "flex-start",
    },
    chipDisabled: {
      opacity: 0.5,
    },
    chipPressed: {
      opacity: 0.75,
    },
    inner: {
      flexDirection: "row",
      alignItems: "center",
    },
    label: {
      ...textStyles.label.sm,
      color: labelColor,
    },
    iconLeft: {
      marginRight: theme.spacing.xxs,
    },
    iconRight: {
      marginLeft: theme.spacing.xxs,
    },
  });
}
