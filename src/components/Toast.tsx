import React, { useMemo, useEffect } from "react";
import { StyleSheet, View, Text as RNText, Pressable } from "react-native";
import { useTheme } from "@/theme";
import { textStyles } from "@/theme/typography";
import type { Theme } from "@/theme/theme";

/**
 * Visual tone of the toast message.
 *
 * - `'default'`: neutral, uses surface background.
 * - `'success'`: green tint (status.success).
 * - `'error'`: red tint (status.error).
 * - `'info'`: blue tint (status.info).
 */
export type ToastTone = "default" | "success" | "error" | "info";

/**
 * Props for the `Toast` component.
 */
export interface ToastProps {
  /**
   * Whether the toast is currently visible.
   */
  visible: boolean;
  /**
   * The message text to display.
   */
  message: string;
  /**
   * Visual tone.
   *
   * @default 'default'
   */
  tone?: ToastTone;
  /**
   * Auto-dismiss duration in milliseconds. `0` disables auto-dismiss.
   *
   * @default 3000
   */
  duration?: number;
  /**
   * Callback fired when the toast should close (auto-dismiss or manual tap).
   */
  onDismiss: () => void;
  /**
   * Accessibility label. Defaults to `message`.
   */
  accessibilityLabel?: string;
}

/**
 * Transient message overlay (toast notification).
 *
 * Floats at the bottom of its parent container and auto-dismisses after
 * `duration` ms. All appearance values derive from theme tokens — no raw
 * colors or pixel values.
 *
 * @example
 * ```tsx
 * <Toast
 *   visible={toastVisible}
 *   message="Profile updated!"
 *   tone="success"
 *   onDismiss={() => setToastVisible(false)}
 * />
 * ```
 */
export function Toast({
  visible,
  message,
  tone = "default",
  duration = 3000,
  onDismiss,
  accessibilityLabel,
}: ToastProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme, tone), [theme, tone]);

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
    <Pressable
      onPress={onDismiss}
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLabel={accessibilityLabel ?? message}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.content}>
        <RNText style={styles.message}>{message}</RNText>
      </View>
    </Pressable>
  );
}

function createStyles(theme: Theme, tone: ToastTone) {
  const bgColor = {
    default: theme.colors.bg.elevated,
    success: theme.colors.status.success,
    error: theme.colors.status.error,
    info: theme.colors.status.info,
  }[tone];

  const textColor =
    tone === "default"
      ? theme.colors.text.primary
      : theme.colors.text.inverse;

  return StyleSheet.create({
    container: {
      position: "absolute",
      bottom: theme.spacing.xxl,
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      borderRadius: theme.radii.lg,
      ...theme.shadows.md,
    },
    content: {
      backgroundColor: bgColor,
      borderRadius: theme.radii.lg,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      minHeight: 44,
      justifyContent: "center",
    },
    message: {
      ...textStyles.body.md,
      color: textColor,
    },
  });
}
