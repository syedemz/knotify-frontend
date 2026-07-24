import React, { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput as RNTextInput,
  View,
  type TextInputProps as RNTextInputProps,
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { Icon } from "./Icon";
import { useTheme } from "@/theme";
import { textStyles } from "@/theme/typography";
import type { Theme } from "@/theme/theme";

/**
 * Props for the `PasswordInput` component.
 */
export interface PasswordInputProps {
  /**
   * Current value of the password field.
   */
  value: string;
  /**
   * Callback fired on every text change.
   */
  onChangeText: (text: string) => void;
  /**
   * Placeholder text shown when the input is empty.
   *
   * @default 'Password'
   */
  placeholder?: string;
  /**
   * When true, the input is non-interactive and visually dimmed.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * When true, the input border highlights in `status.error`.
   *
   * @default false
   */
  error?: boolean;
  /**
   * Callback fired when the user submits the field.
   */
  onSubmitEditing?: () => void;
  /**
   * Accessibility label used by screen readers.
   */
  accessibilityLabel?: string;
  /**
   * iOS `textContentType` hint for the system keyboard and password managers.
   *
   * Use `'newPassword'` on sign-up screens so iOS offers to generate and save
   * a strong password. Forwarded directly to the underlying RN `TextInput`.
   */
  textContentType?: RNTextInputProps['textContentType'];
  /**
   * Cross-platform autofill / autocomplete hint.
   *
   * Use `'password-new'` on sign-up screens so Android password managers
   * offer to save the newly created credential. Forwarded directly to the
   * underlying RN `TextInput`.
   */
  autoComplete?: RNTextInputProps['autoComplete'];
  /**
   * Auto-capitalisation mode.
   *
   * Defaults to `'none'` (appropriate for password fields).
   * Forwarded directly to the underlying RN `TextInput`.
   */
  autoCapitalize?: RNTextInputProps['autoCapitalize'];
  /**
   * When true, disables autocorrect.
   *
   * Defaults to `false` (autocorrect disabled for password fields).
   * Forwarded directly to the underlying RN `TextInput`.
   */
  autoCorrect?: boolean;
}

/**
 * Password input with a show/hide toggle.
 *
 * Wraps RN `TextInput` with `secureTextEntry` and a `Pressable` reveal button.
 * All visual styling comes from theme tokens per `theme.md §9.4`. No `style`
 * prop is exposed.
 *
 * @example
 * ```tsx
 * <PasswordInput
 *   value={password}
 *   onChangeText={setPassword}
 *   error={!!passwordError}
 * />
 * ```
 */
export function PasswordInput({
  value,
  onChangeText,
  placeholder = "Password",
  disabled = false,
  error = false,
  onSubmitEditing,
  accessibilityLabel,
  textContentType,
  autoComplete,
  autoCapitalize = "none",
  autoCorrect = false,
}: PasswordInputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(true);
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
        secureTextEntry={secure}
        editable={!disabled}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        returnKeyType="done"
        onSubmitEditing={onSubmitEditing}
        textContentType={textContentType}
        autoComplete={autoComplete}
        style={styles.input}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
      />
      <Pressable
        onPress={() => setSecure((s) => !s)}
        disabled={disabled}
        style={styles.toggle}
        accessibilityLabel={secure ? "Show password" : "Hide password"}
        accessibilityRole="button"
      >
        <Icon icon={secure ? Eye : EyeOff} size="md" color="tertiary" />
      </Pressable>
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
      flexDirection: "row",
      alignItems: "center",
    },
    input: {
      ...textStyles.body.lg,
      color: theme.colors.text.primary,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      flex: 1,
    },
    toggle: {
      paddingHorizontal: theme.spacing.md,
      height: 48,
      justifyContent: "center",
      alignItems: "center",
      minWidth: 44,
    },
  });
}
