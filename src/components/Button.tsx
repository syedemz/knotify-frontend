import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
} from "react-native";
import { useTheme } from "@/theme";
import { textStyles } from "@/theme/typography";
import type { Theme } from "@/theme/theme";

/**
 * Button visual variant.
 *
 * - `'primary'`: filled pink background, white label (pill-shaped).
 * - `'secondary'`: filled mint background, dark label (pill-shaped).
 * - `'ghost'`: transparent background, pink label, optional border.
 */
export type ButtonVariant = "primary" | "secondary" | "ghost";

/**
 * Button size.
 *
 * - `'sm'`: compact padding, label.sm text style.
 * - `'md'`: standard padding, label.md text style.
 * - `'lg'`: generous padding, label.lg text style (default).
 */
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Props for the `Button` component.
 */
export interface ButtonProps {
  /**
   * The button label text. Also used as the default `accessibilityLabel`.
   */
  label: string;
  /**
   * Callback fired when the button is pressed.
   */
  onPress: () => void;
  /**
   * Visual appearance variant.
   *
   * @default 'primary'
   */
  variant?: ButtonVariant;
  /**
   * Size of the button — controls padding and label text style.
   *
   * @default 'lg'
   */
  size?: ButtonSize;
  /**
   * When true, the button stretches to fill the full width of its container.
   *
   * @default true
   */
  fullWidth?: boolean;
  /**
   * When true, the button is non-interactive and renders in its disabled style.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * When true, replaces the label with an `ActivityIndicator`.
   * The button remains non-interactive while loading.
   *
   * @default false
   */
  loading?: boolean;
  /**
   * Optional icon rendered to the left of the label.
   */
  iconLeft?: React.ReactNode;
  /**
   * Optional icon rendered to the right of the label.
   */
  iconRight?: React.ReactNode;
  /**
   * Accessibility label override.
   *
   * @default `label` prop value
   */
  accessibilityLabel?: string;
}

/**
 * Pill-shaped multi-variant button.
 *
 * Implements §9.1 (primary), §9.2 (secondary), and §9.3 (ghost) from
 * `theme.md`. All appearance values come from theme tokens — no raw colors,
 * no raw pixel values, no `style` prop.
 *
 * @example
 * ```tsx
 * <Button label="Continue" onPress={handleContinue} />
 * <Button label="Skip" variant="ghost" onPress={handleSkip} />
 * <Button label="Loading…" loading />
 * ```
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  fullWidth = true,
  disabled = false,
  loading = false,
  iconLeft,
  iconRight,
  accessibilityLabel,
}: ButtonProps) {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, variant, size, fullWidth),
    [theme, variant, size, fullWidth],
  );

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        isDisabled && styles.buttonDisabled,
        pressed && !isDisabled && styles.buttonPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "ghost"
              ? theme.colors.accent.primary
              : theme.colors.text.inverse
          }
          size="small"
        />
      ) : (
        <View style={styles.row}>
          {iconLeft !== undefined && (
            <View style={styles.iconLeft}>{iconLeft}</View>
          )}
          <RNText style={[styles.label, isDisabled && styles.labelDisabled]}>
            {label}
          </RNText>
          {iconRight !== undefined && (
            <View style={styles.iconRight}>{iconRight}</View>
          )}
        </View>
      )}
    </Pressable>
  );
}

function createStyles(
  theme: Theme,
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean,
) {
  // Background and text colors per variant
  const bg = {
    primary: theme.colors.accent.primary,
    secondary: theme.colors.accent.secondary,
    ghost: "transparent" as const,
  }[variant];

  const bgDisabled = {
    primary: theme.colors.accent.primaryDisabled,
    secondary: theme.colors.accent.secondaryDisabled,
    ghost: "transparent" as const,
  }[variant];

  const labelColor = {
    primary: theme.colors.text.inverse,
    secondary: theme.colors.text.primary,
    ghost: theme.colors.accent.primary,
  }[variant];

  const labelColorDisabled = {
    primary: theme.colors.text.inverse,
    secondary: theme.colors.text.primary,
    ghost: theme.colors.accent.primaryDisabled,
  }[variant];

  // Padding per size
  const paddingVertical = {
    sm: theme.spacing.sm,
    md: theme.spacing.md,
    lg: theme.spacing.lg,
  }[size];

  const paddingHorizontal = {
    sm: theme.spacing.md,
    md: theme.spacing.xl,
    lg: theme.spacing.xxl,
  }[size];

  // Label text style per size
  const labelTextStyle = {
    sm: textStyles.label.sm,
    md: textStyles.label.md,
    lg: textStyles.label.lg,
  }[size];

  return StyleSheet.create({
    button: {
      backgroundColor: bg,
      paddingVertical,
      paddingHorizontal,
      borderRadius: theme.radii.pill,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 44,
      ...(variant === "ghost" && {
        borderWidth: 1,
        borderColor: theme.colors.border.strong,
      }),
      ...(fullWidth && { alignSelf: "stretch" }),
    },
    buttonDisabled: {
      backgroundColor: bgDisabled,
      ...(variant === "ghost" && {
        borderColor: theme.colors.accent.primaryDisabled,
      }),
    },
    buttonPressed: {
      opacity: 0.85,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      ...labelTextStyle,
      color: labelColor,
    },
    labelDisabled: {
      color: labelColorDisabled,
      opacity: 0.7,
    },
    iconLeft: {
      marginRight: theme.spacing.xs,
    },
    iconRight: {
      marginLeft: theme.spacing.xs,
    },
  });
}
