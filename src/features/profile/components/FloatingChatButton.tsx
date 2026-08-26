/**
 * FloatingChatButton — a round FAB anchored bottom-right, above the tab bar.
 *
 * Renders on `OtherProfileScreen` when viewing a friend (source='friend'
 * only — not shown for pending requests). Tapped, it opens the chat room
 * with that friend; in phase 13 chat is not yet implemented, so the caller
 * wires this to a "Chat coming soon" snackbar. Real chat lands in phase 17.
 *
 * **Scroll-coupled motion.** Wired to the same `marriageTabBarHidden`
 * shared value that drives both the tab-bar and the `CollapsingActionBar`
 * on the Marriage landing page. When the user scrolls down on
 * `OtherProfileScreen`, the tab bar and this button both translate down
 * in lock-step. Scrolling up brings both back. Positioning geometry is
 * intentionally identical to `CollapsingActionBar`:
 *
 * - Rest position:  `bottom = TAB_BAR_HEIGHT + safeAreaBottom + xs`
 * - Collapse travel: `translateY = hidden.value * TAB_BAR_HEIGHT`
 *
 * so the button hovers just above the tab bar at rest and lands the same
 * `safeAreaBottom + xs` gap above the physical screen bottom when collapsed.
 *
 * @module features/profile/components/FloatingChatButton
 */

import React, { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { MessageCircle } from 'lucide-react-native';

import { useTheme } from '@/theme';
import type { Theme } from '@/theme/theme';

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Height of the native React Navigation tab bar. Kept in sync with the
 * matching constant in `AppTabs.tsx` and `CollapsingActionBar.tsx`.
 */
const TAB_BAR_HEIGHT = 49;

/** Diameter of the round chat FAB. Matches the "large" round action buttons. */
const BUTTON_SIZE = 60;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FloatingChatButtonProps {
  /**
   * Called when the chat button is pressed. In phase 13 the caller wires this
   * to a "coming soon" snackbar; from phase 17 onwards, it navigates to the
   * chat room with the target friend.
   */
  readonly onPress: () => void;

  /**
   * Accessibility label — usually `t('otherProfile.chat.accessibility')` with
   * the target friend's name interpolated.
   */
  readonly accessibilityLabel: string;

  /**
   * Shared value in the range `[0, 1]` driving the collapse animation.
   * `0` = fully visible (above the tab bar), `1` = fully collapsed
   * (translated down by `TAB_BAR_HEIGHT`). Wired to the same
   * `marriageTabBarHidden` shared value that drives the tab bar animation
   * in `AppTabs`.
   */
  readonly hidden: SharedValue<number>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * A round chat-icon FAB, anchored bottom-right just above the tab bar.
 *
 * Collapses in lock-step with the tab bar via the passed `hidden` shared
 * value — same animation as `CollapsingActionBar`.
 */
export function FloatingChatButton({
  onPress,
  accessibilityLabel,
  hidden,
}: FloatingChatButtonProps): React.ReactElement {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(theme, insets.bottom),
    [theme, insets.bottom],
  );

  // Match CollapsingActionBar: travel = TAB_BAR_HEIGHT so the button rests
  // `safeAreaBottom + xs` above the physical screen bottom when collapsed
  // (a small visible gap below the button rather than flush).
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: hidden.value * TAB_BAR_HEIGHT }],
  }));

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      testID="floating-chat-button-container"
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        testID="floating-chat-button"
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <MessageCircle
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
      // CollapsingActionBar's rest position (see JSDoc at top of file).
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
