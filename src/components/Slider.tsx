import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import RNCSlider from "@react-native-community/slider";
import { useTheme } from "@/theme";
import type { Theme } from "@/theme/theme";

/**
 * Props for the `Slider` component.
 */
export interface SliderProps {
  /**
   * Minimum value of the slider.
   */
  min: number;
  /**
   * Maximum value of the slider.
   */
  max: number;
  /**
   * Current value of the slider.
   */
  value: number;
  /**
   * Callback fired whenever the slider value changes.
   */
  onChange: (value: number) => void;
  /**
   * Increment step between values.
   *
   * @default 1
   */
  step?: number;
  /**
   * When true, the slider is non-interactive and visually dimmed.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * Accessibility label used by screen readers.
   */
  accessibilityLabel?: string;
}

/**
 * Single-thumb themed slider.
 *
 * Wraps `@react-native-community/slider` with the app's design tokens
 * per `theme.md §9.13`:
 * - Track: `text.primary` for the filled portion, `border.strong` for unfilled.
 * - Thumb: `bg.surface` fill with a `text.primary` border.
 *
 * No `style` prop is exposed. Compose with `FormField` for a labeled slider.
 *
 * @example
 * ```tsx
 * <Slider min={18} max={60} value={age} onChange={setAge} step={1} />
 * ```
 */
export function Slider({
  min,
  max,
  value,
  onChange,
  step = 1,
  disabled = false,
  accessibilityLabel,
}: SliderProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme, disabled), [theme, disabled]);

  return (
    <View style={styles.container}>
      <RNCSlider
        minimumValue={min}
        maximumValue={max}
        value={value}
        onValueChange={onChange}
        step={step}
        disabled={disabled}
        minimumTrackTintColor={theme.colors.text.primary}
        maximumTrackTintColor={theme.colors.border.strong}
        thumbTintColor={theme.colors.bg.surface}
        style={styles.slider}
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
}

function createStyles(theme: Theme, disabled: boolean) {
  return StyleSheet.create({
    container: {
      width: "100%",
      opacity: disabled ? 0.5 : 1,
      minHeight: 44,
      justifyContent: "center",
    },
    slider: {
      width: "100%",
      height: 44,
      // @react-native-community/slider height must be set inline via its own style prop.
      // This is the one instance where we pass a style object to a third-party
      // wrapper — the RNCSlider component requires it for proper layout on both platforms.
    },
  });
}
