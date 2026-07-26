import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text as RNText, View } from "react-native";
import { useTheme } from "@/theme";
import { textStyles } from "@/theme/typography";
import type { Theme } from "@/theme/theme";

/**
 * PillButton selection state variant.
 *
 * - `'default'`: outlined pill, unselected.
 * - `'selected'`: filled pink pill, selected state.
 */
export type PillButtonVariant = "default" | "selected";

/**
 * Border weight variant for unselected pills.
 *
 * - `'default'`: 1px border using `border.strong` (#D4D7DC). Standard weight,
 *   suitable for most contexts.
 * - `'subtle'`: `StyleSheet.hairlineWidth` border using `border.default`
 *   (#E8EAED). Near-invisible on white backgrounds — used on Page 25
 *   personality traits to match the Muzz reference design.
 *
 * Has no effect on selected pills (the accent fill overrides the border).
 *
 * @default 'default'
 */
export type PillButtonBorderVariant = "default" | "subtle";

/**
 * Props for the `PillButton` component.
 */
export interface PillButtonProps {
  /**
   * Label text shown inside the pill.
   */
  label: string;
  /**
   * Callback fired when the pill is pressed.
   */
  onPress: () => void;
  /**
   * Visual state of the pill.
   *
   * @default 'default'
   */
  variant?: PillButtonVariant;
  /**
   * Controls the border weight and color of unselected pills.
   *
   * Use `'subtle'` when the pill sits on a white background and the design
   * calls for near-invisible hairline borders (e.g., Page 25 personality
   * traits). Has no effect when `variant === 'selected'`.
   *
   * @default 'default'
   */
  borderVariant?: PillButtonBorderVariant;
  /**
   * When true, the pill is non-interactive.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * Optional emoji string rendered to the left of the label.
   *
   * Prefer this over `iconLeft` when the icon is a Unicode emoji — the
   * component renders it internally as a `Text` element so callers (screens)
   * do not need to import React Native primitives directly.
   *
   * When both `icon` and `iconLeft` are provided, `icon` takes precedence.
   *
   * @example
   * ```tsx
   * <PillButton label="Adventurous" icon="👰" onPress={() => {}} />
   * ```
   */
  icon?: string;
  /**
   * Optional React node rendered to the left of the label.
   *
   * Use when the icon is a custom component (e.g., an SVG icon). For emoji,
   * prefer the `icon` string prop instead.
   */
  iconLeft?: React.ReactNode;
  /**
   * Accessibility label. Defaults to the label text.
   *
   * @default `label` prop value
   */
  accessibilityLabel?: string;
}

/**
 * Compact pill-shaped button used for multi-select filter chips, option tags,
 * and selection groups (e.g., nationality tags, interest tags).
 *
 * Selected state uses the brand pink fill with white text;
 * unselected state uses a border outline.
 *
 * @example
 * ```tsx
 * <PillButton label="Pakistani" onPress={() => {}} />
 * <PillButton label="Pakistani" variant="selected" onPress={() => {}} />
 * ```
 */
export function PillButton({
  label,
  onPress,
  variant = "default",
  borderVariant = "default",
  disabled = false,
  icon,
  iconLeft,
  accessibilityLabel,
}: PillButtonProps) {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, variant, borderVariant),
    [theme, variant, borderVariant],
  );

  // `icon` string takes precedence over `iconLeft` node when both are supplied.
  const leadingSlot: React.ReactNode =
    icon !== undefined ? (
      <RNText style={styles.iconEmoji}>{icon}</RNText>
    ) : iconLeft !== undefined ? (
      iconLeft
    ) : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pill,
        disabled && styles.pillDisabled,
        pressed && !disabled && styles.pillPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled, selected: variant === "selected" }}
    >
      <View style={styles.row}>
        {leadingSlot !== null && <View style={styles.iconLeft}>{leadingSlot}</View>}
        <RNText style={[styles.label, disabled && styles.labelDisabled]}>
          {label}
        </RNText>
      </View>
    </Pressable>
  );
}

function createStyles(
  theme: Theme,
  variant: PillButtonVariant,
  borderVariant: PillButtonBorderVariant,
) {
  const isSelected = variant === "selected";
  const borderWidth = isSelected
    ? 1
    : borderVariant === "subtle"
      ? StyleSheet.hairlineWidth
      : 1;
  const borderColor = isSelected
    ? theme.colors.accent.primary
    : borderVariant === "subtle"
      ? theme.colors.border.default
      : theme.colors.border.strong;

  return StyleSheet.create({
    pill: {
      backgroundColor: isSelected
        ? theme.colors.accent.primary
        : "transparent",
      borderWidth,
      borderColor,
      borderRadius: theme.radii.pill,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 32,
    },
    pillDisabled: {
      opacity: 0.5,
    },
    pillPressed: {
      opacity: 0.75,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
    },
    label: {
      ...textStyles.label.sm,
      color: isSelected
        ? theme.colors.text.inverse
        : theme.colors.text.secondary,
    },
    labelDisabled: {
      opacity: 0.7,
    },
    iconLeft: {
      marginRight: theme.spacing.xxs,
    },
    iconEmoji: {
      fontSize: 16,
      lineHeight: 20,
    },
  });
}
