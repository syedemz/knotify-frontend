import React, { useMemo } from "react";
import { Pressable, StyleSheet, View, Text as RNText } from "react-native";
import { useTheme } from "@/theme";
import { textStyles } from "@/theme/typography";
import type { Theme } from "@/theme/theme";

/**
 * Control type rendered on the trailing side of the row.
 *
 * - `'checkbox'`: square tick indicator.
 * - `'radio'`: circular dot indicator.
 */
export type ListRowSelectableControl = "checkbox" | "radio";

/**
 * Props for the `ListRowSelectable` component.
 */
export interface ListRowSelectableProps {
  /**
   * Primary label rendered in `heading.sm` style.
   */
  label: string;
  /**
   * Whether the row is currently selected.
   */
  selected: boolean;
  /**
   * Callback fired when the row is pressed.
   */
  onToggle: () => void;
  /**
   * Control type rendered on the trailing side.
   *
   * @default 'checkbox'
   */
  control?: ListRowSelectableControl;
  /**
   * Optional secondary description rendered below the label.
   */
  description?: string;
  /**
   * Accessibility label for the row. Defaults to `label`.
   */
  accessibilityLabel?: string;
}

/**
 * Selectable list row following §9.7 from `theme.md`.
 *
 * Renders a pressable list row with a checkbox or radio indicator on the
 * trailing side. When selected, the label color shifts to `accent.primary`
 * and the indicator fills with `accent.primary`. Per §13 (accessibility),
 * the indicator is always paired with a color change — never color alone.
 *
 * @example
 * ```tsx
 * <ListRowSelectable
 *   label="Pakistani"
 *   selected={selected === 'pk'}
 *   onToggle={() => setSelected('pk')}
 * />
 * <ListRowSelectable
 *   label="No preference"
 *   selected={noPreference}
 *   onToggle={toggleNoPreference}
 *   control="radio"
 * />
 * ```
 */
export function ListRowSelectable({
  label,
  selected,
  onToggle,
  control = "checkbox",
  description,
  accessibilityLabel,
}: ListRowSelectableProps) {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, selected, control),
    [theme, selected, control],
  );

  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed,
      ]}
      accessibilityRole={control === "radio" ? "radio" : "checkbox"}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ checked: selected }}
    >
      <View style={styles.inner}>
        <View style={styles.text}>
          <RNText style={styles.label}>{label}</RNText>
          {description !== undefined && (
            <RNText style={styles.description}>{description}</RNText>
          )}
        </View>
        <View style={styles.indicator}>
          {selected && <View style={styles.indicatorMark} />}
        </View>
      </View>
    </Pressable>
  );
}

function createStyles(
  theme: Theme,
  selected: boolean,
  control: ListRowSelectableControl,
) {
  const isRadio = control === "radio";
  const indicatorRadius = isRadio ? theme.radii.pill : theme.radii.sm;
  const markRadius = isRadio ? theme.radii.pill : theme.radii.sm;

  return StyleSheet.create({
    row: {
      backgroundColor: theme.colors.bg.surface,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: selected
        ? theme.colors.accent.primary
        : theme.colors.border.default,
      minHeight: 64,
      justifyContent: "center",
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
    text: {
      flex: 1,
    },
    label: {
      ...textStyles.heading.sm,
      color: selected
        ? theme.colors.accent.primary
        : theme.colors.text.primary,
    },
    description: {
      ...textStyles.body.md,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xxs,
    },
    indicator: {
      width: 22,
      height: 22,
      borderRadius: indicatorRadius,
      borderWidth: 2,
      borderColor: selected
        ? theme.colors.accent.primary
        : theme.colors.border.strong,
      backgroundColor: selected
        ? theme.colors.accent.primary
        : "transparent",
      alignItems: "center",
      justifyContent: "center",
      marginLeft: theme.spacing.md,
    },
    indicatorMark: {
      width: isRadio ? 8 : 12,
      height: isRadio ? 8 : 9,
      borderRadius: markRadius,
      backgroundColor: theme.colors.text.inverse,
    },
  });
}
