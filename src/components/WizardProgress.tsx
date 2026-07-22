import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/theme";
import type { Theme } from "@/theme/theme";
import { TOTAL_PAGES } from "@/features/onboarding/pageMap";

/**
 * Props for the `WizardProgress` component.
 */
export interface WizardProgressProps {
  /**
   * The current page number in the wizard (1-indexed).
   * Must be between 1 and `TOTAL_PAGES` inclusive.
   */
  current: number;
  /**
   * Height of the progress bar track.
   *
   * Maps to a theme spacing token.
   *
   * @default 'xs' (4px)
   */
  trackHeight?: keyof Theme["spacing"];
  /**
   * Background color of the unfilled track region.
   *
   * Maps to a key in `theme.colors.bg`.
   *
   * @default 'muted'
   */
  trackBg?: keyof Theme["colors"]["bg"];
  /**
   * Color of the filled progress region.
   *
   * Maps to a key in `theme.colors.accent`.
   *
   * @default 'primary'
   */
  fillColor?: keyof Theme["colors"]["accent"];
}

/**
 * Horizontal progress bar for the onboarding wizard.
 *
 * Renders a `current / TOTAL_PAGES` progress indicator. `TOTAL_PAGES` is
 * sourced from `src/features/onboarding/pageMap.ts` — bumping the page count
 * there automatically updates every `WizardProgress` instance without any
 * component change.
 *
 * The fill and unfilled regions are rendered as two sibling flex children of
 * the track. Their `flex` values are proportional to `current` and
 * `TOTAL_PAGES - current`. This keeps all design-token style values inside
 * `StyleSheet.create` while the data-driven flex ratio comes from props.
 *
 * All appearance values are theme-token-keyed; no raw numeric values or
 * inline style objects are used for design tokens.
 *
 * @example
 * ```tsx
 * <WizardProgress current={3} />
 * ```
 */
export function WizardProgress({
  current,
  trackHeight = "xs",
  trackBg = "muted",
  fillColor = "primary",
}: WizardProgressProps) {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, trackHeight, trackBg, fillColor),
    [theme, trackHeight, trackBg, fillColor],
  );

  // Clamp so both fill and remainder are always non-negative.
  const clamped = Math.min(Math.max(current, 0), TOTAL_PAGES);
  const fillFlex = clamped;
  const remainFlex = TOTAL_PAGES - clamped;

  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: TOTAL_PAGES, now: current }}
      accessibilityLabel={`Step ${current} of ${TOTAL_PAGES}`}
    >
      {/* Fill segment — flex proportional to current page */}
      <View style={[styles.fill, { flex: fillFlex }]} testID="wizard-progress-fill" />
      {/* Unfilled segment — flex proportional to remaining pages */}
      {remainFlex > 0 && (
        <View style={[styles.remainder, { flex: remainFlex }]} testID="wizard-progress-remainder" />
      )}
    </View>
  );
}

function createStyles(
  theme: Theme,
  trackHeight: keyof Theme["spacing"],
  trackBg: keyof Theme["colors"]["bg"],
  fillColor: keyof Theme["colors"]["accent"],
) {
  return StyleSheet.create({
    track: {
      height: theme.spacing[trackHeight],
      width: "100%",
      flexDirection: "row",
      overflow: "hidden",
    },
    fill: {
      backgroundColor: theme.colors.accent[fillColor],
    },
    remainder: {
      backgroundColor: theme.colors.bg[trackBg],
    },
  });
}
