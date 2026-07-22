import React, { useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/theme";
import type { Theme } from "@/theme/theme";

type SpacingKey = keyof Theme["spacing"];

/**
 * Props for the `TouchableArea` component.
 */
export interface TouchableAreaProps {
  /**
   * Callback fired when the area is pressed.
   */
  onPress: () => void;
  /**
   * Accessible label for the touchable region.
   */
  accessibilityLabel: string;
  /**
   * Additional accessible hint for the press action.
   */
  accessibilityHint?: string;
  /**
   * When true, the area is non-interactive.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * Padding inside the touchable area — expands the visible content
   * without changing the hitbox.
   *
   * @default undefined
   */
  padding?: SpacingKey;
  /**
   * Content to render inside the touchable area.
   */
  children: React.ReactNode;
}

/**
 * Generic pressable wrapper that makes any content tappable. Uses a subtle
 * opacity feedback (0.7) on press.
 *
 * Use `TouchableArea` when a non-button element (a card, a row, a custom
 * icon-with-text group) must be made pressable. For buttons with a text
 * label, use `Button` or `PillButton`.
 *
 * @example
 * ```tsx
 * <TouchableArea onPress={handlePress} accessibilityLabel="View profile">
 *   <Avatar source={avatarUri} size="lg" />
 *   <Text>Ayesha</Text>
 * </TouchableArea>
 * ```
 */
export function TouchableArea({
  onPress,
  accessibilityLabel,
  accessibilityHint,
  disabled = false,
  padding,
  children,
}: TouchableAreaProps) {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, padding),
    [theme, padding],
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.area,
        disabled && styles.areaDisabled,
        pressed && !disabled && styles.areaPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      {children}
    </Pressable>
  );
}

function createStyles(theme: Theme, padding?: SpacingKey) {
  return StyleSheet.create({
    area: {
      ...(padding !== undefined && { padding: theme.spacing[padding] }),
    },
    areaDisabled: {
      opacity: 0.4,
    },
    areaPressed: {
      opacity: 0.7,
    },
  });
}
