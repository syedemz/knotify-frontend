import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "@/theme";
import type { Theme } from "@/theme/theme";

/**
 * Props for the `Checkbox` component.
 */
export interface CheckboxProps {
  /**
   * Whether the checkbox is checked.
   */
  checked: boolean;
  /**
   * Callback fired when the user toggles the checkbox.
   */
  onToggle: (checked: boolean) => void;
  /**
   * When true, the checkbox is non-interactive and visually dimmed.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * Accessibility label used by screen readers. Required for a11y.
   */
  accessibilityLabel: string;
}

/**
 * Themed checkbox built from `Pressable` and a styled box/checkmark.
 *
 * No external dependency is introduced — the checkmark is composed from
 * two styled `View` elements. Colors follow `theme.md §9.7`:
 * - Unchecked: `border.strong` outline, transparent fill.
 * - Checked: `accent.primary` fill with a white diagonal checkmark.
 * - Disabled: 50% opacity.
 *
 * @example
 * ```tsx
 * <Checkbox
 *   checked={agreed}
 *   onToggle={setAgreed}
 *   accessibilityLabel="Agree to terms"
 * />
 * ```
 */
export function Checkbox({
  checked,
  onToggle,
  disabled = false,
  accessibilityLabel,
}: CheckboxProps) {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, checked, disabled),
    [theme, checked, disabled],
  );

  return (
    <Pressable
      onPress={() => !disabled && onToggle(!checked)}
      disabled={disabled}
      style={({ pressed }) => [
        styles.box,
        pressed && !disabled && styles.boxPressed,
      ]}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked, disabled }}
    >
      {checked && (
        // Checkmark built from two rotated Views forming an "L" shape.
        // The outer View clips the content; the inner Views draw the mark.
        <View style={styles.checkmarkContainer}>
          <View style={styles.checkmarkShort} />
          <View style={styles.checkmarkLong} />
        </View>
      )}
    </Pressable>
  );
}

function createStyles(theme: Theme, checked: boolean, disabled: boolean) {
  return StyleSheet.create({
    box: {
      width: 22,
      height: 22,
      borderRadius: theme.radii.sm,
      borderWidth: 2,
      borderColor: checked
        ? theme.colors.accent.primary
        : theme.colors.border.strong,
      backgroundColor: checked
        ? theme.colors.accent.primary
        : "transparent",
      alignItems: "center",
      justifyContent: "center",
      opacity: disabled ? 0.5 : 1,
      minWidth: 44,
      minHeight: 44,
      // Expand the accessible touch area without growing the visual box
    },
    boxPressed: {
      opacity: 0.75,
    },
    // Checkmark: two rectangles arranged in an "L", then the container is rotated
    checkmarkContainer: {
      width: 12,
      height: 12,
      alignItems: "flex-start",
      justifyContent: "flex-end",
      transform: [{ rotate: "-45deg" }],
    },
    checkmarkShort: {
      position: "absolute",
      bottom: 0,
      left: 0,
      width: 5,
      height: 2,
      backgroundColor: theme.colors.text.inverse,
      borderRadius: 1,
    },
    checkmarkLong: {
      position: "absolute",
      bottom: 0,
      left: 3,
      width: 2,
      height: 9,
      backgroundColor: theme.colors.text.inverse,
      borderRadius: 1,
    },
  });
}
