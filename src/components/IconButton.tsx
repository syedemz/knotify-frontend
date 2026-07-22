import React, { useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/theme";
import type { Theme } from "@/theme/theme";

type AccentColor = keyof Theme["colors"]["accent"];
type BgColor = keyof Theme["colors"]["bg"];

/**
 * The visual size of the icon button, controlling touch-target and icon area.
 *
 * - `'sm'`: 32px touch target.
 * - `'md'`: 40px touch target.
 * - `'lg'`: 48px touch target (default).
 */
export type IconButtonSize = "sm" | "md" | "lg";

/**
 * Props for the `IconButton` component.
 */
export interface IconButtonProps {
  /**
   * Icon element to render inside the button.
   * Should be a Lucide icon or similar at the appropriate size.
   */
  icon: React.ReactNode;
  /**
   * Callback fired when the button is pressed.
   */
  onPress: () => void;
  /**
   * Accessible label describing the button action.
   * Required — icon buttons have no visible text label.
   */
  accessibilityLabel: string;
  /**
   * Size of the touch target.
   *
   * @default 'lg'
   */
  size?: IconButtonSize;
  /**
   * Background color token. When set, the button renders a filled background.
   *
   * @default undefined (no background)
   */
  bg?: BgColor;
  /**
   * Color token for the icon tint. Passed to the icon via `color` on the
   * containing Pressable context — caller must apply `color` to the icon.
   * Documents the intended color token; actual tinting is the caller's
   * responsibility (since icon libraries have their own `color` prop).
   *
   * @default 'primary'
   */
  color?: AccentColor;
  /**
   * When true, the button is non-interactive.
   *
   * @default false
   */
  disabled?: boolean;
}

/**
 * Circular icon-only button. Used for action icons (back arrows, close,
 * edit, etc.) that have no visible label.
 *
 * The caller passes an icon element and an `accessibilityLabel` that
 * describes the action for screen readers.
 *
 * @example
 * ```tsx
 * <IconButton
 *   icon={<ChevronLeft size={24} color={theme.colors.text.primary} />}
 *   onPress={navigation.goBack}
 *   accessibilityLabel="Go back"
 * />
 * ```
 */
export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = "lg",
  bg,
  disabled = false,
}: IconButtonProps) {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, size, bg),
    [theme, size, bg],
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
    >
      {icon}
    </Pressable>
  );
}

const TOUCH_TARGET: Record<IconButtonSize, number> = {
  sm: 32,
  md: 40,
  lg: 48,
};

function createStyles(theme: Theme, size: IconButtonSize, bg?: BgColor) {
  const touchTarget = TOUCH_TARGET[size];
  return StyleSheet.create({
    button: {
      width: touchTarget,
      height: touchTarget,
      borderRadius: theme.radii.pill,
      alignItems: "center",
      justifyContent: "center",
      ...(bg !== undefined && { backgroundColor: theme.colors.bg[bg] }),
    },
    buttonDisabled: {
      opacity: 0.4,
    },
    buttonPressed: {
      opacity: 0.7,
    },
  });
}
