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
   * When true, the pill is non-interactive.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * Optional icon rendered to the left of the label.
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
  disabled = false,
  iconLeft,
  accessibilityLabel,
}: PillButtonProps) {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, variant),
    [theme, variant],
  );

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
        {iconLeft !== undefined && <View style={styles.iconLeft}>{iconLeft}</View>}
        <RNText style={[styles.label, disabled && styles.labelDisabled]}>
          {label}
        </RNText>
      </View>
    </Pressable>
  );
}

function createStyles(theme: Theme, variant: PillButtonVariant) {
  const isSelected = variant === "selected";

  return StyleSheet.create({
    pill: {
      backgroundColor: isSelected
        ? theme.colors.accent.primary
        : "transparent",
      borderWidth: 1,
      borderColor: isSelected
        ? theme.colors.accent.primary
        : theme.colors.border.strong,
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
  });
}
