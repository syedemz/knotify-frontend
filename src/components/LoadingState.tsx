import React, { useMemo } from "react";
import { ActivityIndicator, StyleSheet, View, Text as RNText } from "react-native";
import { useTheme } from "@/theme";
import { textStyles } from "@/theme/typography";
import type { Theme } from "@/theme/theme";

/**
 * Props for the `LoadingState` component.
 */
export interface LoadingStateProps {
  /**
   * Optional message rendered below the activity indicator.
   *
   * @default undefined
   */
  message?: string;
  /**
   * Accessibility label for the loading indicator.
   *
   * @default 'Loading'
   */
  accessibilityLabel?: string;
}

/**
 * Full-area loading placeholder displayed while content is being fetched.
 *
 * Renders a centered `ActivityIndicator` (branded pink) with an optional
 * supporting message. Matches `theme.md §12` motion guidance — no custom
 * animation, relies on platform spinner. All appearance values derive from
 * theme tokens.
 *
 * @example
 * ```tsx
 * <LoadingState />
 * <LoadingState message="Finding your matches…" />
 * ```
 */
export function LoadingState({
  message,
  accessibilityLabel = "Loading",
}: LoadingStateProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View
      style={styles.container}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
    >
      <ActivityIndicator
        size="large"
        color={theme.colors.accent.primary}
      />
      {message !== undefined && (
        <RNText style={styles.message}>{message}</RNText>
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
    message: {
      ...textStyles.body.md,
      color: theme.colors.text.secondary,
      textAlign: "center",
      marginTop: theme.spacing.md,
    },
  });
}
