import React, { useMemo } from "react";
import { Pressable, StyleSheet, View, Text as RNText } from "react-native";
import { useTheme } from "@/theme";
import { textStyles } from "@/theme/typography";
import type { Theme } from "@/theme/theme";

/**
 * Props for the `ErrorState` component.
 */
export interface ErrorStateProps {
  /**
   * Primary heading text.
   *
   * @default 'Something went wrong'
   */
  title?: string;
  /**
   * Supporting description rendered below the title.
   */
  description?: string;
  /**
   * Label for the retry action button.
   *
   * @default 'Try again'
   */
  retryLabel?: string;
  /**
   * Callback fired when the retry button is pressed.
   */
  onRetry?: () => void;
  /**
   * Accessibility label for the container. Defaults to `title`.
   */
  accessibilityLabel?: string;
}

/**
 * Error state displayed when a content area fails to load.
 *
 * Renders a centered layout with error-colored heading, optional description,
 * and a retry button. All appearance values derive from theme tokens — no raw
 * colors or pixel values.
 *
 * @example
 * ```tsx
 * <ErrorState onRetry={refetch} />
 * <ErrorState
 *   title="Connection lost"
 *   description="Check your internet and try again."
 *   onRetry={reload}
 * />
 * ```
 */
export function ErrorState({
  title = "Something went wrong",
  description,
  retryLabel = "Try again",
  onRetry,
  accessibilityLabel,
}: ErrorStateProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View
      style={styles.container}
      accessibilityLabel={accessibilityLabel ?? title}
    >
      <RNText style={styles.title}>{title}</RNText>
      {description !== undefined && (
        <RNText style={styles.description}>{description}</RNText>
      )}
      {onRetry !== undefined && (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.retryButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
        >
          <RNText style={styles.retryLabel}>{retryLabel}</RNText>
        </Pressable>
      )}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.spacing.xxl,
      paddingVertical: theme.spacing.huge,
    },
    title: {
      ...textStyles.heading.lg,
      color: theme.colors.status.error,
      textAlign: "center",
    },
    description: {
      ...textStyles.body.md,
      color: theme.colors.text.secondary,
      textAlign: "center",
      marginTop: theme.spacing.sm,
    },
    retryButton: {
      marginTop: theme.spacing.xl,
      backgroundColor: theme.colors.accent.primary,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xxl,
      borderRadius: theme.radii.pill,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    retryButtonPressed: {
      opacity: 0.85,
    },
    retryLabel: {
      ...textStyles.label.lg,
      color: theme.colors.text.inverse,
    },
  });
}
