/**
 * BackHeaderBar — back-arrow-only header for full-profile screens.
 *
 * Visually consistent with the phase-12 `HeaderBar` component:
 * - Same `bg.primary` background.
 * - Same `useSafeAreaInsets` top-padding handling.
 * - Same subtle shadow (`theme.shadows.sm`).
 * - Same 40×40 icon-button hit target.
 * - Same horizontal/vertical paddings.
 *
 * Intentionally NOT inlined into OtherProfileScreen — this component is expected
 * to be reused in:
 * - Phase 15: friend-request flow profile view.
 * - Phase 17: chat-initiated profile view.
 * - Phase 18: search-result profile view.
 *
 * @module features/profile/components/BackHeaderBar
 */

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

import { useTheme } from '@/theme';
import type { Theme } from '@/theme/theme';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BackHeaderBarProps {
  /**
   * Called when the back-arrow button is pressed.
   * Typically `() => navigation.goBack()`.
   */
  readonly onBack: () => void;

  /**
   * Accessibility label for the back button.
   * Use a translated string, e.g. `t('otherProfile.back')`.
   */
  readonly accessibilityLabel: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Back-arrow-only header.
 *
 * Designed as the navigation header for full-profile screens opened from
 * Explore (OtherProfileScreen, phase 13), chat (phase 17), and search
 * (phase 18). Renders a single `ArrowLeft` icon button on the left that
 * fires `onBack` when pressed.
 */
export function BackHeaderBar({
  onBack,
  accessibilityLabel,
}: BackHeaderBarProps): React.ReactElement {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View
      style={[styles.container, { paddingTop: insets.top + theme.spacing.sm }]}
      testID="back-header-bar"
    >
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        testID="back-header-back-button"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.iconButton}
      >
        <ArrowLeft
          size={22}
          color={theme.colors.text.primary}
          strokeWidth={1.8}
        />
      </Pressable>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      // Left-align the back button; no right-side element needed.
      justifyContent: 'flex-start',
      paddingHorizontal: theme.spacing.lg,
      // paddingTop applied inline with safe-area insets (same as HeaderBar).
      paddingBottom: theme.spacing.sm,
      backgroundColor: theme.colors.bg.primary,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.default,
      // Subtle elevation consistent with HeaderBar.
      ...theme.shadows.sm,
      zIndex: 2,
    },
    iconButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
