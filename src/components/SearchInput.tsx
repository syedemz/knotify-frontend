import React, { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from "react-native";
import { useTheme } from "@/theme";
import { textStyles } from "@/theme/typography";
import type { Theme } from "@/theme/theme";

/**
 * Size options for `SearchInput`.
 *
 * - `'sm'`: compact height for inline or secondary search bars.
 * - `'md'`: standard height (default).
 * - `'lg'`: taller search bar for primary / hero placement.
 */
export type SearchInputSize = "sm" | "md" | "lg";

/**
 * Props for the `SearchInput` component.
 */
export interface SearchInputProps {
  /**
   * Current search value.
   */
  value: string;
  /**
   * Callback fired on every text change.
   */
  onChangeText: (text: string) => void;
  /**
   * Placeholder text.
   *
   * @default 'Search'
   */
  placeholder?: string;
  /**
   * Size variant that controls height and padding.
   *
   * @default 'md'
   */
  size?: SearchInputSize;
  /**
   * When true, the input is non-interactive and visually dimmed.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * Callback fired when the user submits the search query.
   */
  onSubmit?: () => void;
  /**
   * Accessibility label used by screen readers.
   *
   * @default 'Search'
   */
  accessibilityLabel?: string;
}

/**
 * Pill-shaped search bar with a leading search icon placeholder.
 *
 * Implements `theme.md §9.5`. Uses `radii.pill` and the same background /
 * text tokens as `TextInput`. No `style` prop is exposed.
 *
 * @example
 * ```tsx
 * <SearchInput value={query} onChangeText={setQuery} placeholder="Find members" />
 * ```
 */
export function SearchInput({
  value,
  onChangeText,
  placeholder = "Search",
  size = "md",
  disabled = false,
  onSubmit,
  accessibilityLabel = "Search",
}: SearchInputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const styles = useMemo(
    () => createStyles(theme, size, focused, disabled),
    [theme, size, focused, disabled],
  );

  return (
    <View style={styles.container}>
      {/* Search icon placeholder — Icon component lands in story 1.6 */}
      <View style={styles.icon} />
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text.tertiary}
        editable={!disabled}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        autoCorrect={false}
        autoCapitalize="none"
        style={styles.input}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
      />
      {value.length > 0 && !disabled && (
        <Pressable
          onPress={() => onChangeText("")}
          style={styles.clearButton}
          accessibilityLabel="Clear search"
          accessibilityRole="button"
        >
          <View style={styles.clearIcon} />
        </Pressable>
      )}
    </View>
  );
}

const heightBySize: Record<SearchInputSize, number> = {
  sm: 36,
  md: 44,
  lg: 52,
};

const paddingBySize: Record<SearchInputSize, number> = {
  sm: 8,
  md: 12,
  lg: 16,
};

function createStyles(
  theme: Theme,
  size: SearchInputSize,
  focused: boolean,
  disabled: boolean,
) {
  const height = heightBySize[size];
  const paddingVertical = paddingBySize[size];

  return StyleSheet.create({
    container: {
      backgroundColor: theme.colors.bg.input,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: focused ? theme.colors.border.strong : "transparent",
      height,
      flexDirection: "row",
      alignItems: "center",
      opacity: disabled ? 0.5 : 1,
      paddingHorizontal: theme.spacing.md,
    },
    // Magnifying-glass placeholder — will be replaced by Icon in story 1.6
    icon: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: theme.colors.text.tertiary,
      marginRight: theme.spacing.sm,
    },
    input: {
      ...textStyles.body.md,
      color: theme.colors.text.primary,
      flex: 1,
      paddingVertical,
    },
    clearButton: {
      marginLeft: theme.spacing.xs,
      minWidth: 24,
      minHeight: 24,
      justifyContent: "center",
      alignItems: "center",
    },
    clearIcon: {
      width: 14,
      height: 14,
      backgroundColor: theme.colors.text.tertiary,
      borderRadius: theme.radii.pill,
    },
  });
}
