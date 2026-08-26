import React, { useMemo, useEffect } from "react";
import { StyleSheet, View, Text as RNText, Pressable } from "react-native";
import { useTheme } from "@/theme";
import { textStyles } from "@/theme/typography";
import type { Theme } from "@/theme/theme";

/**
 * Props for the `Snackbar` component.
 */
export interface SnackbarProps {
  /**
   * Whether the snackbar is currently visible.
   */
  visible: boolean;
  /**
   * The message text to display.
   */
  message: string;
  /**
   * Optional label for the inline action button.
   */
  actionLabel?: string;
  /**
   * Callback fired when the action button is pressed.
   */
  onAction?: () => void;
  /**
   * Auto-dismiss duration in milliseconds. `0` disables auto-dismiss.
   *
   * @default 4000
   */
  duration?: number;
  /**
   * Callback fired when the snackbar auto-dismisses.
   */
  onDismiss: () => void;
  /**
   * Accessibility label. Defaults to `message`.
   */
  accessibilityLabel?: string;
  /**
   * Test identifier forwarded to the root container `View`.
   * Used by `@testing-library/react-native` for element lookup.
   */
  testID?: string;
}

/**
 * Persistent or timed notification bar with an optional inline action.
 *
 * Similar to `Toast` but designed for messages that may need user interaction
 * via an action button (e.g., "Undo" after deleting a message). Floats at the
 * bottom of its container and auto-dismisses after `duration` ms unless
 * `duration` is `0`. All appearance values derive from theme tokens.
 *
 * @example
 * ```tsx
 * <Snackbar
 *   visible={snackbarVisible}
 *   message="Message deleted"
 *   actionLabel="Undo"
 *   onAction={handleUndo}
 *   onDismiss={() => setSnackbarVisible(false)}
 * />
 * ```
 */
export function Snackbar({
  visible,
  message,
  actionLabel,
  onAction,
  duration = 4000,
  onDismiss,
  accessibilityLabel,
  testID,
}: SnackbarProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    if (!visible || duration === 0) {
      return;
    }
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [visible, duration, onDismiss]);

  if (!visible) {
    return null;
  }

  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLabel={accessibilityLabel ?? message}
      accessibilityLiveRegion="polite"
      testID={testID}
    >
      <RNText style={styles.message} numberOfLines={2}>
        {message}
      </RNText>
      {actionLabel !== undefined && onAction !== undefined && (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <RNText style={styles.actionLabel}>{actionLabel}</RNText>
        </Pressable>
      )}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      position: "absolute",
      bottom: theme.spacing.xxl,
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      backgroundColor: theme.colors.bg.elevated,
      borderRadius: theme.radii.lg,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      minHeight: 48,
      ...theme.shadows.md,
    },
    message: {
      ...textStyles.body.md,
      color: theme.colors.text.primary,
      flex: 1,
    },
    actionButton: {
      marginLeft: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      minHeight: 44,
      justifyContent: "center",
    },
    actionButtonPressed: {
      opacity: 0.7,
    },
    actionLabel: {
      ...textStyles.label.md,
      color: theme.colors.accent.primary,
    },
  });
}
