/**
 * CollapsingActionBar — floating bottom overlay for the Marriage landing page.
 *
 * Contains ONLY the four round action buttons: X (pass), Undo, Star
 * (super-like), and ✓ (like). In phase 12 each button triggers a Snackbar
 * toast via the `onAction` callback passed from `MarriageLandingScreen` — the
 * real swipe handlers ship in phase 13 (discover deck).
 *
 * **Scroll-coupled motion.** The bar animates in lock-step with the native
 * tab bar via the shared `hidden` value (`0` visible → `1` hidden). It sits
 * `TAB_BAR_HEIGHT` above the bottom of the screen so that when the tab bar
 * slides off, the buttons slide the same distance and continue to hover
 * above the (now hidden) bar, leaving no dead gap on the screen.
 *
 * @module features/landing/components/CollapsingActionBar
 */

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { X, Undo2, Star, Check } from 'lucide-react-native';

import { useTheme } from '@/theme';
import type { Theme } from '@/theme/theme';
import { t } from '@/labels';

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Height of the native React Navigation tab bar. Kept in sync with the
 * matching constant in `AppTabs.tsx` — used to translate the action bar in
 * lock-step with the tab-bar collapse animation.
 */
const TAB_BAR_HEIGHT = 49;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CollapsingActionBarProps {
  /**
   * Called when any of the four action buttons is pressed.
   * The screen uses this to show the "Available in a later phase" Snackbar.
   */
  readonly onAction: () => void;
  /**
   * Shared value in the range [0, 1] driving the collapse animation:
   * `0` = fully visible (bar sits above the tab bar), `1` = fully collapsed
   * (bar has translated down by `TAB_BAR_HEIGHT`). Wired to the same
   * `marriageTabBarHidden` shared value that drives the tab-bar animation
   * in `AppTabs`.
   */
  readonly hidden: SharedValue<number>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Four round action buttons anchored at the bottom of the landing screen.
 *
 * Button order (left to right): X / Undo / Star / ✓.
 * Each calls `onAction()` on press — the actual handlers land in phase 13.
 */
export function CollapsingActionBar({
  onAction,
  hidden,
}: CollapsingActionBarProps): React.ReactElement {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // Match the tab-bar collapse geometry exactly: the tab bar's visible
  // height is TAB_BAR_HEIGHT + safe-area bottom, so the action bar must
  // travel the same distance to occupy the vacated space cleanly.
  const totalHiddenDistance = TAB_BAR_HEIGHT + insets.bottom;
  const styles = useMemo(
    () => createStyles(theme, totalHiddenDistance),
    [theme, totalHiddenDistance],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: hidden.value * totalHiddenDistance }],
  }));

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      testID="collapsing-action-bar"
      pointerEvents="box-none"
    >
      <View style={styles.row}>
        {/* Pass (X) */}
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [styles.button, styles.buttonPass, pressed && styles.buttonPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('landing.actions.pass')}
          testID="action-button-pass"
        >
          <X size={26} color={theme.colors.status.error} strokeWidth={2} />
        </Pressable>

        {/* Undo */}
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [styles.button, styles.buttonUndo, pressed && styles.buttonPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('landing.actions.undo')}
          testID="action-button-undo"
        >
          <Undo2 size={22} color={theme.colors.accent.tertiary} strokeWidth={2} />
        </Pressable>

        {/* Super-like (Star) */}
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [styles.button, styles.buttonSuperLike, pressed && styles.buttonPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('landing.actions.superLike')}
          testID="action-button-super-like"
        >
          <Star size={22} color={theme.colors.status.info} strokeWidth={2} />
        </Pressable>

        {/* Like (✓) */}
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [styles.button, styles.buttonLike, pressed && styles.buttonPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('landing.actions.like')}
          testID="action-button-like"
        >
          <Check size={26} color={theme.colors.status.success} strokeWidth={2.5} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme, hideDistance: number) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      // Sit directly above the tab bar. The tab bar's outer height is
      // TAB_BAR_HEIGHT + safe-area bottom, so the action row rests
      // `hideDistance + gap` above the physical screen bottom. When
      // `hidden` → 1 the container translates down by `hideDistance`,
      // coming to rest `safeAreaBottom + gap` above the bottom — inside
      // where the tab bar used to sit, so the vacated area is fully
      // occupied and no white gap remains.
      bottom: hideDistance + theme.spacing.sm,
      left: 0,
      right: 0,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing.xl,
      paddingHorizontal: theme.spacing.xxl,
    },
    button: {
      width: 56,
      height: 56,
      borderRadius: theme.radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.bg.elevated,
      ...theme.shadows.md,
    },
    buttonPass: {
      borderWidth: 1.5,
      borderColor: theme.colors.status.error,
    },
    buttonUndo: {
      width: 48,
      height: 48,
      borderWidth: 1.5,
      borderColor: theme.colors.accent.tertiary,
    },
    buttonSuperLike: {
      width: 48,
      height: 48,
      borderWidth: 1.5,
      borderColor: theme.colors.status.info,
    },
    buttonLike: {
      borderWidth: 1.5,
      borderColor: theme.colors.status.success,
    },
    buttonPressed: {
      opacity: 0.7,
    },
  });
}
