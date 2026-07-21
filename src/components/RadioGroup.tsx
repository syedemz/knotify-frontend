import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text as RNText, View } from "react-native";
import { useTheme } from "@/theme";
import { textStyles } from "@/theme/typography";
import type { Theme } from "@/theme/theme";

/**
 * A single option in a `RadioGroup`.
 */
export interface RadioOption {
  /**
   * The value string passed to `onChange` when this option is selected.
   */
  value: string;
  /**
   * Human-readable label displayed next to the radio button.
   */
  label: string;
  /**
   * Optional secondary description rendered below the label in `text.secondary`.
   */
  description?: string;
}

/**
 * Props for the `RadioGroup` component.
 */
export interface RadioGroupProps {
  /**
   * Available options. The wizard passes options from `src/config/options/*`;
   * this component is generic and does not import from config directly.
   */
  options: readonly RadioOption[];
  /**
   * Currently selected value, or `undefined` when nothing is selected.
   */
  value: string | undefined;
  /**
   * Callback fired with the selected option's `value` string.
   */
  onChange: (value: string) => void;
  /**
   * When true, all options are non-interactive and visually dimmed.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * Accessibility label for the overall group.
   */
  accessibilityLabel?: string;
}

/**
 * Vertical list of radio-button options.
 *
 * Generic — options are passed as props; no dependency on `src/config/options`.
 * Each option row contains a custom radio indicator (built from `View`s, no
 * extra dependency), the label, and an optional description.
 *
 * Token mapping per `theme.md §9.7`:
 * - Selected indicator: `accent.primary` ring + filled center.
 * - Unselected indicator: `border.strong` ring, transparent center.
 * - Row background on selected: `bg.muted`.
 *
 * @example
 * ```tsx
 * <RadioGroup
 *   options={options.gender}
 *   value={gender}
 *   onChange={setGender}
 * />
 * ```
 */
export function RadioGroup({
  options,
  value,
  onChange,
  disabled = false,
  accessibilityLabel,
}: RadioGroupProps) {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, disabled),
    [theme, disabled],
  );

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="radiogroup"
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => !disabled && onChange(option.value)}
            disabled={disabled}
            style={({ pressed }) => [
              styles.row,
              isSelected && styles.rowSelected,
              pressed && !disabled && styles.rowPressed,
            ]}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: isSelected, disabled }}
          >
            <View
              style={[styles.indicator, isSelected && styles.indicatorSelected]}
            >
              {isSelected && <View style={styles.indicatorDot} />}
            </View>
            <View style={styles.labelContainer}>
              <RNText
                style={[
                  styles.label,
                  isSelected && styles.labelSelected,
                ]}
              >
                {option.label}
              </RNText>
              {option.description !== undefined && (
                <RNText style={styles.description}>
                  {option.description}
                </RNText>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(theme: Theme, disabled: boolean) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.radii.md,
      minHeight: 52,
      opacity: disabled ? 0.5 : 1,
    },
    rowSelected: {
      backgroundColor: theme.colors.bg.muted,
    },
    rowPressed: {
      opacity: 0.7,
    },
    indicator: {
      width: 22,
      height: 22,
      borderRadius: theme.radii.pill,
      borderWidth: 2,
      borderColor: theme.colors.border.strong,
      alignItems: "center",
      justifyContent: "center",
      marginRight: theme.spacing.md,
      flexShrink: 0,
    },
    indicatorSelected: {
      borderColor: theme.colors.accent.primary,
    },
    indicatorDot: {
      width: 10,
      height: 10,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.colors.accent.primary,
    },
    labelContainer: {
      flex: 1,
    },
    label: {
      ...textStyles.body.lg,
      color: theme.colors.text.primary,
    },
    labelSelected: {
      color: theme.colors.accent.primary,
    },
    description: {
      ...textStyles.body.sm,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xxs,
    },
  });
}
