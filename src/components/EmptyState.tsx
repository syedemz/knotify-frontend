import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "@/theme";
import { textStyles } from "@/theme/typography";
import { Text as RNText } from "react-native";
import type { Theme } from "@/theme/theme";

/**
 * Props for the `EmptyState` component.
 */
export interface EmptyStateProps {
  /**
   * Primary heading text.
   */
  title: string;
  /**
   * Supporting description rendered below the title.
   */
  description?: string;
  /**
   * Optional illustration or icon node rendered above the title.
   */
  illustration?: React.ReactNode;
  /**
   * Label for the optional action button.
   */
  actionLabel?: string;
  /**
   * Callback fired when the action button is pressed.
   */
  onAction?: () => void;
  /**
   * Accessibility label for the container. Defaults to `title`.
   */
  accessibilityLabel?: string;
}

/**
 * Empty-state placeholder displayed when a list or content area has no data.
 *
 * Renders a centered layout with an optional illustration, title, description,
 * and a single call-to-action button. All appearance values derive from theme
 * tokens — no raw colors or pixel values.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   title="No matches yet"
 *   description="Keep swiping to find your match."
 *   actionLabel="Explore profiles"
 *   onAction={handleExplore}
 * />
 * ```
 */
export function EmptyState({
  title,
  description,
  illustration,
  actionLabel,
  onAction,
  accessibilityLabel,
}: EmptyStateProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View
      style={styles.container}
      accessibilityLabel={accessibilityLabel ?? title}
    >
      {illustration !== undefined && (
        <View style={styles.illustration}>{illustration}</View>
      )}
      <RNText style={styles.title}>{title}</RNText>
      {description !== undefined && (
        <RNText style={styles.description}>{description}</RNText>
      )}
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
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.spacing.xxl,
      paddingVertical: theme.spacing.huge,
    },
    illustration: {
      marginBottom: theme.spacing.xxl,
    },
    title: {
      ...textStyles.heading.lg,
      color: theme.colors.text.primary,
      textAlign: "center",
    },
    description: {
      ...textStyles.body.md,
      color: theme.colors.text.secondary,
      textAlign: "center",
      marginTop: theme.spacing.sm,
    },
    actionButton: {
      marginTop: theme.spacing.xl,
      backgroundColor: theme.colors.accent.primary,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xxl,
      borderRadius: theme.radii.pill,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    actionButtonPressed: {
      opacity: 0.85,
    },
    actionLabel: {
      ...textStyles.label.lg,
      color: theme.colors.text.inverse,
    },
  });
}
