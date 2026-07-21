import React, { useMemo } from "react";
import { StyleSheet, Switch as RNSwitch, View } from "react-native";
import { useTheme } from "@/theme";
import type { Theme } from "@/theme/theme";

/**
 * Props for the `Switch` component.
 */
export interface SwitchProps {
  /**
   * Whether the switch is in the on (true) or off (false) position.
   */
  value: boolean;
  /**
   * Callback fired when the user toggles the switch.
   */
  onValueChange: (value: boolean) => void;
  /**
   * When true, the switch is non-interactive and visually dimmed.
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
 * Themed boolean toggle switch.
 *
 * Wraps RN `Switch` with theme tokens per `theme.md §9.12`:
 * - Active track: `accent.primary` (brand pink).
 * - Inactive track: `border.strong`.
 * - Thumb: platform default (white on iOS, white on Android).
 *
 * No `style` prop is exposed.
 *
 * @example
 * ```tsx
 * <Switch
 *   value={notificationsEnabled}
 *   onValueChange={setNotificationsEnabled}
 *   accessibilityLabel="Enable notifications"
 * />
 * ```
 */
export function Switch({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
}: SwitchProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme, disabled), [theme, disabled]);

  return (
    <View style={styles.container}>
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: theme.colors.border.strong,
          true: theme.colors.accent.primary,
        }}
        thumbColor={theme.colors.bg.surface}
        ios_backgroundColor={theme.colors.border.strong}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
      />
    </View>
  );
}

function createStyles(theme: Theme, disabled: boolean) {
  return StyleSheet.create({
    container: {
      alignSelf: "flex-start",
      opacity: disabled ? 0.5 : 1,
      minHeight: 44,
      minWidth: 44,
      justifyContent: "center",
      alignItems: "center",
    },
  });
}
