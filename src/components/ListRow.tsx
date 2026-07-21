import React, { useMemo } from "react";
import { Pressable, StyleSheet, View, Text as RNText } from "react-native";
import { useTheme } from "@/theme";
import { textStyles } from "@/theme/typography";
import type { Theme } from "@/theme/theme";

/**
 * Props for the `ListRow` component.
 */
export interface ListRowProps {
  /**
   * Primary label rendered in `heading.sm` style.
   */
  label: string;
  /**
   * Optional secondary description rendered below the label in `body.md` style.
   */
  description?: string;
  /**
   * Optional element rendered on the left side (e.g., an `Icon` or `Avatar`).
   */
  leading?: React.ReactNode;
  /**
   * Optional element rendered on the right side (e.g., a chevron or badge).
   */
  trailing?: React.ReactNode;
  /**
   * Callback fired when the row is pressed.
   * When `undefined`, the row renders as a non-interactive `View`.
   */
  onPress?: () => void;
  /**
   * When true, applies reduced opacity to indicate a disabled state.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * Accessibility label for the row. Defaults to `label`.
   */
  accessibilityLabel?: string;
}

/**
 * Themed list row following §9.6 from `theme.md`.
 *
 * Renders a surface-colored row with optional leading/trailing slots.
 * When `onPress` is provided the row is pressable with a muted background
 * press feedback. All appearance values derive from theme tokens.
 *
 * @example
 * ```tsx
 * <ListRow label="Profile visibility" onPress={handlePress} />
 * <ListRow label="Nationality" description="Pakistani" trailing={<ChevronRight />} />
 * ```
 */
export function ListRow({
  label,
  description,
  leading,
  trailing,
  onPress,
  disabled = false,
  accessibilityLabel,
}: ListRowProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const content = (
    <View style={styles.inner}>
      {leading !== undefined && (
        <View style={styles.leading}>{leading}</View>
      )}
      <View style={styles.text}>
        <RNText style={styles.label}>{label}</RNText>
        {description !== undefined && (
          <RNText style={styles.description}>{description}</RNText>
        )}
      </View>
      {trailing !== undefined && (
        <View style={styles.trailing}>{trailing}</View>
      )}
    </View>
  );

  if (onPress !== undefined) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.row,
          disabled && styles.rowDisabled,
          pressed && !disabled && styles.rowPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled }}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      style={[styles.row, disabled && styles.rowDisabled]}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {content}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      backgroundColor: theme.colors.bg.surface,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      minHeight: 64,
      justifyContent: "center",
    },
    rowDisabled: {
      opacity: 0.5,
    },
    rowPressed: {
      backgroundColor: theme.colors.bg.muted,
    },
    inner: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    leading: {
      marginRight: theme.spacing.md,
    },
    text: {
      flex: 1,
    },
    label: {
      ...textStyles.heading.sm,
      color: theme.colors.text.primary,
    },
    description: {
      ...textStyles.body.md,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xxs,
    },
    trailing: {
      marginLeft: theme.spacing.md,
    },
  });
}
