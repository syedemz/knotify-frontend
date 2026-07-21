import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
} from "react-native";
import { useTheme } from "@/theme";
import { textStyles } from "@/theme/typography";
import type { Theme } from "@/theme/theme";

/**
 * A single option in a `Select` list.
 */
export interface SelectOption {
  /**
   * The value passed to `onChange` when this option is selected.
   */
  value: string;
  /**
   * Human-readable label displayed in the dropdown and, when selected, in the
   * trigger button.
   */
  label: string;
}

/**
 * Props for the `Select` component.
 */
export interface SelectProps {
  /**
   * Available options to choose from.
   */
  options: readonly SelectOption[];
  /**
   * Currently selected value, or `undefined` when nothing is selected.
   */
  value: string | undefined;
  /**
   * Callback fired with the selected option's `value` string.
   */
  onChange: (value: string) => void;
  /**
   * Placeholder text shown in the trigger when no option is selected.
   *
   * @default 'Select an option'
   */
  placeholder?: string;
  /**
   * When true, the trigger is non-interactive and visually dimmed.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * When true, the trigger border highlights in `status.error`.
   *
   * @default false
   */
  error?: boolean;
  /**
   * Accessibility label for the trigger button.
   */
  accessibilityLabel?: string;
}

/**
 * Native-feeling single-select dropdown.
 *
 * Renders a themed trigger button that opens a full-screen RN `Modal`
 * containing a scrollable option list. The overlay and option rows are styled
 * entirely with theme tokens — no raw values.
 *
 * The composition pattern for labeled selects:
 * ```tsx
 * <FormField label="Religion" error={error}>
 *   <Select options={options.religion} value={value} onChange={setValue} />
 * </FormField>
 * ```
 *
 * @example
 * ```tsx
 * <Select
 *   options={[{ value: 'en', label: 'English' }, { value: 'ur', label: 'Urdu' }]}
 *   value={locale}
 *   onChange={setLocale}
 *   placeholder="Choose language"
 * />
 * ```
 */
export function Select({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  error = false,
  accessibilityLabel,
}: SelectProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const styles = useMemo(
    () => createStyles(theme, error, disabled),
    [theme, error, disabled],
  );

  const selectedLabel =
    value !== undefined
      ? options.find((o) => o.value === value)?.label
      : undefined;

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        style={styles.trigger}
        accessibilityLabel={accessibilityLabel ?? placeholder}
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: open }}
      >
        <RNText
          style={[
            styles.triggerText,
            selectedLabel === undefined && styles.placeholderText,
          ]}
          numberOfLines={1}
        >
          {selectedLabel ?? placeholder}
        </RNText>
        {/* Chevron-down placeholder — Icon catalog component lands in 1.6 */}
        <View style={styles.chevron} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        accessibilityViewIsModal
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
          accessibilityLabel="Close options"
        >
          {/* Stop touch propagation to the backdrop when pressing inside the sheet */}
          <Pressable style={styles.sheet} onPress={() => {}}>
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => handleSelect(option.value)}
                    style={({ pressed }) => [
                      styles.optionRow,
                      isSelected && styles.optionRowSelected,
                      pressed && styles.optionRowPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <RNText
                      style={[
                        styles.optionLabel,
                        isSelected && styles.optionLabelSelected,
                      ]}
                    >
                      {option.label}
                    </RNText>
                    {isSelected && <View style={styles.checkmark} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function createStyles(theme: Theme, error: boolean, disabled: boolean) {
  const triggerBorderColor = error
    ? theme.colors.status.error
    : theme.colors.border.strong;

  return StyleSheet.create({
    trigger: {
      backgroundColor: theme.colors.bg.input,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      borderColor: triggerBorderColor,
      minHeight: 48,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      opacity: disabled ? 0.5 : 1,
    },
    triggerText: {
      ...textStyles.body.lg,
      color: theme.colors.text.primary,
      flex: 1,
    },
    placeholderText: {
      color: theme.colors.text.tertiary,
    },
    // Chevron placeholder — will be replaced by Icon in story 1.6
    chevron: {
      width: 16,
      height: 16,
      borderRightWidth: 2,
      borderBottomWidth: 2,
      borderColor: theme.colors.text.tertiary,
      transform: [{ rotate: "45deg" }],
      marginLeft: theme.spacing.sm,
      marginTop: -4,
    },
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: theme.colors.bg.elevated,
      borderTopLeftRadius: theme.radii.xl,
      borderTopRightRadius: theme.radii.xl,
      maxHeight: "60%",
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xxxl,
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      minHeight: 52,
    },
    optionRowSelected: {
      backgroundColor: theme.colors.bg.muted,
    },
    optionRowPressed: {
      opacity: 0.7,
    },
    optionLabel: {
      ...textStyles.body.lg,
      color: theme.colors.text.primary,
      flex: 1,
    },
    optionLabelSelected: {
      color: theme.colors.accent.primary,
    },
    // Checkmark placeholder — will be replaced by Icon in story 1.6
    checkmark: {
      width: 20,
      height: 20,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.colors.accent.primary,
      marginLeft: theme.spacing.sm,
    },
  });
}
