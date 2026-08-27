/**
 * CollapsingActionBar — floating bottom overlay for the Marriage landing page.
 *
 * Contains ONLY the four round action buttons: X (pass), Undo, Star
 * (super-like), and ✓ (like). In phase 12 each button triggers a Snackbar
 * toast via the `onAction` callback passed from `MarriageLandingScreen` — the
 * real swipe handlers ship in phase 13 (discover deck).
 *
 * **Star filled state (phase 14).** When `isSuperLikeActive` is `true` the
 * Star icon renders with `fill={theme.colors.status.info}` in addition to
 * its current stroke, indicating that the current deck card is bookmarked.
 * When `false` (default) the stroke-only rendering from phase 13 is preserved.
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
   *
   * Kept for backwards compatibility with phase-12 callers. In phase 13 the
   * screen passes per-button handlers (`onPass`, `onUndo`, `onSuperLike`,
   * `onLike`) instead, and `onAction` may be omitted.
   *
   * When a per-button handler is provided it takes precedence; if absent the
   * button falls back to calling `onAction`. When neither is provided the
   * button press is a no-op.
   */
  readonly onAction?: () => void;
  /** Called when the X (pass / dislike) button is pressed. */
  readonly onPass?: () => void;
  /** Called when the ↺ (undo) button is pressed. */
  readonly onUndo?: () => void;
  /** Called when the ⭐ (super-like) button is pressed. */
  readonly onSuperLike?: () => void;
  /** Called when the ✓ (like) button is pressed. */
  readonly onLike?: () => void;
  /**
   * When `true`, the Star icon renders with a filled `status.info` colour to
   * indicate the current deck card is bookmarked. Defaults to `false` (stroke
   * only — the phase-13 appearance).
   */
  readonly isSuperLikeActive?: boolean;
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
 *
 * In phase 13 each button receives its own handler (`onPass`, `onUndo`,
 * `onSuperLike`, `onLike`). For backwards compatibility, when a per-button
 * handler is omitted the button falls back to calling `onAction` (the
 * phase-12 catch-all). When neither is provided the button press is a no-op.
 */
export function CollapsingActionBar({
  onAction,
  onPass,
  onUndo,
  onSuperLike,
  onLike,
  hidden,
  isSuperLikeActive = false,
}: CollapsingActionBarProps): React.ReactElement {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // The tab bar travels TAB_BAR_HEIGHT + insets.bottom to fully hide. The
  // action bar travels only TAB_BAR_HEIGHT, so when collapsed the buttons
  // rest above the safe-area gesture zone rather than sitting flush against
  // the physical screen bottom — the user asked for a visible gap below.
  const actionBarTravel = TAB_BAR_HEIGHT;
  const styles = useMemo(
    () => createStyles(theme, insets.bottom),
    [theme, insets.bottom],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: hidden.value * actionBarTravel }],
  }));

  const handlePass = onPass ?? onAction;
  const handleUndo = onUndo ?? onAction;
  const handleSuperLike = onSuperLike ?? onAction;
  const handleLike = onLike ?? onAction;

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      testID="collapsing-action-bar"
      pointerEvents="box-none"
    >
      <View style={styles.row}>
        {/* Pass (X) */}
        <Pressable
          onPress={handlePass}
          style={({ pressed }) => [styles.button, styles.buttonPass, pressed && styles.buttonPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('landing.actions.pass')}
          testID="action-button-pass"
        >
          <X size={30} color={theme.colors.text.inverse} strokeWidth={2.5} />
        </Pressable>

        {/* Undo */}
        <Pressable
          onPress={handleUndo}
          style={({ pressed }) => [styles.button, styles.buttonUndo, pressed && styles.buttonPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('landing.actions.undo')}
          testID="action-button-undo"
        >
          <Undo2 size={22} color={theme.colors.accent.tertiary} strokeWidth={2} />
        </Pressable>

        {/* Super-like (Star) — filled when current card is bookmarked */}
        <Pressable
          onPress={handleSuperLike}
          style={({ pressed }) => [styles.button, styles.buttonSuperLike, pressed && styles.buttonPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('landing.actions.superLike')}
          testID="action-button-super-like"
        >
          <Star
            size={22}
            color={theme.colors.status.info}
            strokeWidth={2}
            fill={isSuperLikeActive ? theme.colors.status.info : 'none'}
          />
        </Pressable>

        {/* Like (✓) */}
        <Pressable
          onPress={handleLike}
          style={({ pressed }) => [styles.button, styles.buttonLike, pressed && styles.buttonPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('landing.actions.like')}
          testID="action-button-like"
        >
          <Check size={30} color={theme.colors.text.inverse} strokeWidth={2.5} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme, safeAreaBottom: number) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      // Rest position: `TAB_BAR_HEIGHT + safeAreaBottom + xs` above the
      // physical bottom = xs (4 px) above the tab bar's TOP edge. The bar
      // translates down by TAB_BAR_HEIGHT only (not the full tab-bar
      // outer height), so when the tab bar has fully hidden the buttons
      // rest `safeAreaBottom + xs` above the screen bottom — a small,
      // visible gap sits below the round buttons instead of them being
      // flush against the physical edge.
      bottom: TAB_BAR_HEIGHT + safeAreaBottom + theme.spacing.xs,
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
      width: 64,
      height: 64,
      borderRadius: theme.radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.bg.elevated,
      ...theme.shadows.md,
    },
    buttonPass: {
      backgroundColor: theme.colors.status.error,
    },
    buttonUndo: {
      width: 54,
      height: 54,
      borderWidth: 1.5,
      borderColor: theme.colors.accent.tertiary,
    },
    buttonSuperLike: {
      width: 54,
      height: 54,
      borderWidth: 1.5,
      borderColor: theme.colors.status.info,
    },
    buttonLike: {
      backgroundColor: theme.colors.status.success,
    },
    buttonPressed: {
      opacity: 0.7,
    },
  });
}
