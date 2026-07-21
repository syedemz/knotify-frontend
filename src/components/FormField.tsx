import React, { useMemo } from "react";
import { StyleSheet, Text as RNText, View } from "react-native";
import { useTheme } from "@/theme";
import { textStyles } from "@/theme/typography";
import type { Theme } from "@/theme/theme";

/**
 * Props for the `FormField` component.
 */
export interface FormFieldProps {
  /**
   * Input element(s) to compose inside the field. Any catalog input component
   * (`TextInput`, `PasswordInput`, `Select`, `DatePicker`, etc.) is valid here.
   */
  children: React.ReactNode;
  /**
   * Visible label displayed above the input.
   *
   * @default undefined (no label rendered)
   */
  label?: string;
  /**
   * Error message displayed below the input in `status.error` colour.
   * When undefined or empty, no error row is rendered.
   *
   * @default undefined
   */
  error?: string;
  /**
   * Helper / hint text displayed below the input (below the error when both
   * are present). Rendered in `text.tertiary` colour.
   *
   * @default undefined
   */
  hint?: string;
  /**
   * When true, appends a red asterisk to the label to indicate the field is
   * required. The asterisk is purely visual — set `accessibilityLabel` on the
   * child input for AT.
   *
   * @default false
   */
  required?: boolean;
}

/**
 * Wrapper that composes any input component with a label, error message,
 * and optional hint text.
 *
 * The `children` pattern is used so `FormField` stays decoupled from any
 * specific input: pass `TextInput`, `PasswordInput`, `Select`, `Slider`, etc.
 * as children and `FormField` adds the surrounding chrome.
 *
 * @example
 * ```tsx
 * <FormField label="Email" error={emailError} required>
 *   <TextInput value={email} onChangeText={setEmail} error={!!emailError} />
 * </FormField>
 *
 * <FormField label="Date of birth">
 *   <DatePicker value={dob} onChange={setDob} />
 * </FormField>
 * ```
 */
export function FormField({
  children,
  label,
  error,
  hint,
  required = false,
}: FormFieldProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      {label !== undefined && (
        <View style={styles.labelRow}>
          <RNText style={styles.label}>{label}</RNText>
          {required && <RNText style={styles.required}> *</RNText>}
        </View>
      )}
      {children}
      {error !== undefined && error.length > 0 && (
        <RNText style={styles.error} accessibilityRole="alert">
          {error}
        </RNText>
      )}
      {hint !== undefined && hint.length > 0 && (
        <RNText style={styles.hint}>{hint}</RNText>
      )}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      gap: theme.spacing.xs,
    },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    label: {
      ...textStyles.label.md,
      color: theme.colors.text.primary,
    },
    required: {
      ...textStyles.label.md,
      color: theme.colors.status.error,
    },
    error: {
      ...textStyles.body.sm,
      color: theme.colors.status.error,
    },
    hint: {
      ...textStyles.body.sm,
      color: theme.colors.text.tertiary,
    },
  });
}
