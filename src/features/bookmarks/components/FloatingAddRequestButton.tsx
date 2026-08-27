/**
 * FloatingAddRequestButton — a round FAB anchored bottom-right, above the tab bar.
 *
 * Renders on `BookmarkDeckViewScreen` and allows the user to send a connection
 * request to a bookmarked profile. Tapped, it opens `SendRequestModal`.
 *
 * **Pattern source:** This component is the sibling of
 * `src/features/profile/components/FloatingChatButton.tsx` and shares its
 * geometry, animation contract, and JSDoc structure exactly. Both components
 * are kept as separate files (verbatim copy of constants) so `FloatingChatButton`
 * — a production phase-13 component — remains untouched.
 *
 * **Scroll-coupled motion.** Wired to the same `tabBarHidden` shared value
 * (`src/state/ui/tabBarHidden.ts`) that drives the tab-bar and the
 * `FloatingChatButton` on `OtherProfileScreen`. When the user scrolls down on
 * `BookmarkDeckViewScreen`, the tab bar and this button both translate down in
 * lock-step. Scrolling up brings both back. Positioning geometry is intentionally
 * identical to `FloatingChatButton`:
 *
 * - Rest position:  `bottom = TAB_BAR_HEIGHT + safeAreaBottom + xs`
 * - Collapse travel: `translateY = hidden.value * TAB_BAR_HEIGHT`
 *
 * so the button hovers just above the tab bar at rest and lands the same
 * `safeAreaBottom + xs` gap above the physical screen bottom when collapsed.
 *
 * @module features/bookmarks/components/FloatingAddRequestButton
 */

import React, { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { UserPlus } from 'lucide-react-native';

import { useTheme } from '@/theme';
import type { Theme } from '@/theme/theme';

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Height of the native React Navigation tab bar. Kept in sync with the
 * matching constant in `AppTabs.tsx`, `CollapsingActionBar.tsx`, and
 * `FloatingChatButton.tsx`.
 */
const TAB_BAR_HEIGHT = 49;

/** Diameter of the round add-request FAB. Matches the "large" round action buttons. */
const BUTTON_SIZE = 60;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FloatingAddRequestButtonProps {
  /**
   * Called when the add-request button is pressed.
   * The caller opens `SendRequestModal` from this callback.
   */
  readonly onPress: () => void;

  /**
   * Accessibility label — usually `t('bookmarks.deckView.sendRequestAccessibility')`
   * with the target profile's name interpolated.
   */
  readonly accessibilityLabel: string;

  /**
   * Shared value in the range `[0, 1]` driving the collapse animation.
   * `0` = fully visible (above the tab bar), `1` = fully collapsed
   * (translated down by `TAB_BAR_HEIGHT`). Wired to the same
   * `tabBarHidden` shared value that drives the tab bar animation
   * in `AppTabs` and the `FloatingChatButton` on `OtherProfileScreen`.
   */
  readonly hidden: SharedValue<number>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * A round add-request-icon FAB, anchored bottom-right just above the tab bar.
 *
 * Collapses in lock-step with the tab bar via the passed `hidden` shared
 * value — same animation contract as `FloatingChatButton`.
 */
export function FloatingAddRequestButton({
  onPress,
  accessibilityLabel,
  hidden,
}: FloatingAddRequestButtonProps): React.ReactElement {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(theme, insets.bottom),
    [theme, insets.bottom],
  );

  // Match FloatingChatButton: travel = TAB_BAR_HEIGHT so the button rests
  // `safeAreaBottom + xs` above the physical screen bottom when collapsed
  // (a small visible gap below the button rather than flush).
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: hidden.value * TAB_BAR_HEIGHT }],
  }));

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      testID="floating-add-request-button-container"
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        testID="floating-add-request-button"
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <UserPlus
          size={28}
          color={theme.colors.text.inverse}
          strokeWidth={2.2}
        />
      </Pressable>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme, safeAreaBottom: number) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      // Anchor bottom-right, above the tab bar. Same geometry as
      // FloatingChatButton's rest position (see JSDoc at top of file).
      bottom: TAB_BAR_HEIGHT + safeAreaBottom + theme.spacing.xs,
      right: theme.spacing.lg,
    },
    button: {
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      borderRadius: BUTTON_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.accent.primary,
      ...theme.shadows.md,
    },
    buttonPressed: {
      opacity: 0.8,
    },
  });
}
