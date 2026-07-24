import React, { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text as RNText, View } from "react-native";
import RNDateTimePicker, {
  DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { Calendar } from "lucide-react-native";
import { Icon } from "./Icon";
import { useTheme } from "@/theme";
import { textStyles } from "@/theme/typography";
import type { Theme } from "@/theme/theme";

/**
 * Props for the `DatePicker` component.
 */
export interface DatePickerProps {
  /**
   * Currently selected date as an ISO 8601 date string (`'YYYY-MM-DD'`).
   * Pass `undefined` for no selection.
   */
  value: string | undefined;
  /**
   * Callback fired with the new ISO date string when the user selects a date.
   * Receives `undefined` if the user dismisses without selecting (Android only).
   */
  onChange: (iso: string | undefined) => void;
  /**
   * Earliest selectable date as an ISO 8601 date string.
   *
   * @default undefined (no minimum)
   */
  min?: string;
  /**
   * Latest selectable date as an ISO 8601 date string.
   *
   * @default undefined (no maximum)
   */
  max?: string;
  /**
   * When true, the picker trigger is non-interactive and visually dimmed.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * Placeholder text displayed in the trigger when no date is selected.
   *
   * @default 'Select date'
   */
  placeholder?: string;
  /**
   * Accessibility label for the trigger button.
   */
  accessibilityLabel?: string;
}

/**
 * Cross-platform date picker with a uniform `value / onChange / min / max` API.
 *
 * **Platform strategy:**
 * - **iOS**: renders `@react-native-community/datetimepicker` inline (display
 *   mode `'spinner'`) so the user sees the wheel picker without opening a dialog.
 * - **Android**: renders a styled trigger button. Tapping it opens the native
 *   Android date-picker dialog (display mode `'default'`). The RN picker is
 *   mounted only while the dialog is open, then unmounted after the user
 *   confirms or dismisses.
 *
 * Both platforms share the same `value / onChange / min / max` API. Internally,
 * `onChange` always receives an ISO 8601 string (`'YYYY-MM-DD'`) or `undefined`.
 *
 * Wraps `FormField` for labeled usage:
 * ```tsx
 * <FormField label="Date of birth">
 *   <DatePicker value={dob} onChange={setDob} max="2006-01-01" />
 * </FormField>
 * ```
 *
 * @example
 * ```tsx
 * <DatePicker
 *   value={birthday}
 *   onChange={setBirthday}
 *   min="1940-01-01"
 *   max="2006-01-01"
 * />
 * ```
 */
export function DatePicker({
  value,
  onChange,
  min,
  max,
  disabled = false,
  placeholder = "Select date",
  accessibilityLabel,
}: DatePickerProps) {
  const theme = useTheme();
  const [androidOpen, setAndroidOpen] = useState(false);
  const styles = useMemo(
    () => createStyles(theme, disabled),
    [theme, disabled],
  );

  const dateValue = value !== undefined ? new Date(value) : new Date();
  const minDate = min !== undefined ? new Date(min) : undefined;
  const maxDate = max !== undefined ? new Date(max) : undefined;

  // Android: onValueChange fires only when the user confirms (OK); onDismiss
  // fires only when they cancel. The two are mutually exclusive per session.
  const handleAndroidValueChange = (
    _event: DateTimePickerChangeEvent,
    selectedDate: Date,
  ) => {
    setAndroidOpen(false);
    onChange(toIso(selectedDate));
  };

  const handleAndroidDismiss = () => {
    setAndroidOpen(false);
    onChange(undefined);
  };

  const handleIosValueChange = (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
    onChange(toIso(selectedDate));
  };

  const displayLabel =
    value !== undefined ? formatDisplay(new Date(value)) : placeholder;

  if (Platform.OS === "ios") {
    return (
      <View
        style={styles.iosContainer}
        accessibilityLabel={accessibilityLabel}
      >
        <RNDateTimePicker
          mode="date"
          display="spinner"
          value={dateValue}
          minimumDate={minDate}
          maximumDate={maxDate}
          onValueChange={handleIosValueChange}
          disabled={disabled}
          textColor={theme.colors.text.primary}
          accentColor={theme.colors.accent.primary}
          style={styles.iosPicker}
        />
      </View>
    );
  }

  // Android: trigger button + dialog.
  // Note: The Android component from @react-native-community/datetimepicker
  // still uses `onChange` for the dismiss event; `onValueChange` alone does
  // not fire on dismiss. We use `onChange` here intentionally to capture both
  // the selected value and the dismissed state.
  return (
    <>
      <Pressable
        onPress={() => !disabled && setAndroidOpen(true)}
        disabled={disabled}
        style={styles.trigger}
        accessibilityLabel={accessibilityLabel ?? placeholder}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      >
        <RNText
          style={[
            styles.triggerText,
            value === undefined && styles.placeholderText,
          ]}
        >
          {displayLabel}
        </RNText>
        <View style={styles.calendarIconWrapper}>
          <Icon icon={Calendar} size="md" color="tertiary" />
        </View>
      </Pressable>

      {androidOpen && (
        <RNDateTimePicker
          mode="date"
          display="default"
          value={dateValue}
          minimumDate={minDate}
          maximumDate={maxDate}
          onValueChange={handleAndroidValueChange}
          onDismiss={handleAndroidDismiss}
        />
      )}
    </>
  );
}

/** Formats a `Date` as `'DD MMM YYYY'` for display in the trigger label. */
function formatDisplay(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Converts a `Date` to an ISO 8601 date string `'YYYY-MM-DD'`. */
function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function createStyles(theme: Theme, disabled: boolean) {
  return StyleSheet.create({
    // Android trigger
    trigger: {
      backgroundColor: theme.colors.bg.input,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      borderColor: theme.colors.border.strong,
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
    calendarIconWrapper: {
      marginLeft: theme.spacing.sm,
    },
    // iOS inline spinner wrapper
    iosContainer: {
      backgroundColor: theme.colors.bg.input,
      borderRadius: theme.radii.md,
      overflow: "hidden",
      opacity: disabled ? 0.5 : 1,
    },
    iosPicker: {
      width: "100%",
      height: 216,
      backgroundColor: "transparent",
    },
  });
}
