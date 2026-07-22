import React, { useMemo, useState } from "react";
import {
  TextInput as RNTextInput,
  StyleSheet,
  View,
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
} from "react-native";
import { useTheme } from "@/theme";
import { textStyles } from "@/theme/typography";
import type { Theme } from "@/theme/theme";

/**
 * Props for the `TextInput` component.
 */
export interface TextInputProps {
  /**
   * Current value of the input.
   */
  value: string;
  /**
   * Callback fired on every text change.
   */
  onChangeText: (text: string) => void;
  /**
   * Placeholder text shown when the input is empty.
   *
   * @default undefined
   */
  placeholder?: string;
  /**
   * When true, the input is non-interactive and visually dimmed.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * When true, the input border highlights in `status.error` and the component
   * signals an error state to assistive technology.
   *
   * @default false
   */
  error?: boolean;
  /**
   * Keyboard type forwarded to the underlying RN `TextInput`.
   *
   * @default 'default'
   */
  keyboardType?: KeyboardTypeOptions;
  /**
   * Return key label on the software keyboard.
   *
   * @default 'done'
   */
  returnKeyType?: ReturnKeyTypeOptions;
  /**
   * Callback fired when the user submits the text field (return key).
   */
  onSubmitEditing?: () => void;
  /**
   * Maximum number of characters the user may type.
   */
  maxLength?: number;
  /**
   * When true, disables autocorrect.
   *
   * @default false
   */
  autoCorrect?: boolean;
  /**
   * Auto-capitalisation mode.
   *
   * @default 'sentences'
   */
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  /**
   * Accessibility label used by screen readers.
   */
  accessibilityLabel?: string;
  /**
   * Whether the field should receive focus on mount.
   *
   * @default false
   */
  autoFocus?: boolean;
}

/**
 * Single-line themed text input.
 *
 * Wraps RN `TextInput` and enforces theme tokens for all visual properties
 * (background, border, text colour, placeholder colour, border radius,
 * padding). No `style` prop is exposed — use `FormField` to compose with a
 * label and error message.
 *
 * All visual styling is derived from `theme.md §9.4`.
 *
 * @example
 * ```tsx
 * <TextInput
 *   value={name}
 *   onChangeText={setName}
 *   placeholder="Your name"
 * />
 * <TextInput value={email} onChangeText={setEmail} error={!!emailError} />
 * ```
 */
export function TextInput({
  value,
  onChangeText,
  placeholder,
  disabled = false,
  error = false,
  keyboardType = "default",
  returnKeyType = "done",
  onSubmitEditing,
  maxLength,
  autoCorrect = false,
  autoCapitalize = "sentences",
  accessibilityLabel,
  autoFocus = false,
}: TextInputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const styles = useMemo(
    () => createStyles(theme, focused, error, disabled),
    [theme, focused, error, disabled],
  );

  return (
    <View style={styles.container}>
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text.tertiary}
        editable={!disabled}
        keyboardType={keyboardType}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        maxLength={maxLength}
        autoCorrect={autoCorrect}
        autoCapitalize={autoCapitalize}
        autoFocus={autoFocus}
        style={styles.input}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
      />
    </View>
  );
}

function createStyles(
  theme: Theme,
  focused: boolean,
  error: boolean,
  disabled: boolean,
) {
  const borderColor = error
    ? theme.colors.status.error
    : focused
      ? theme.colors.border.strong
      : "transparent";

  return StyleSheet.create({
    container: {
      backgroundColor: theme.colors.bg.input,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      borderColor,
      opacity: disabled ? 0.5 : 1,
      minHeight: 48,
      justifyContent: "center",
    },
    input: {
      ...textStyles.body.lg,
      color: theme.colors.text.primary,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      // minHeight enforced on container; input itself fills it
    },
  });
}
