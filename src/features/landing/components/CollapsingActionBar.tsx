/**
 * CollapsingActionBar — floating bottom overlay for the Marriage landing page.
 *
 * Contains ONLY the four round action buttons: X (pass), Undo, Star
 * (super-like), and ✓ (like). In phase 12 each button triggers a Snackbar
 * toast via the `onAction` callback passed from `MarriageLandingScreen` — the
 * real swipe handlers ship in phase 13 (discover deck).
 *
 * The bar itself does NOT collapse or animate — it stays anchored above the
 * native React Navigation tab bar at all times. The tab bar collapse (driven
 * by `marriageTabBarHidden`) is handled separately in `AppTabs` (story 12.6).
 *
 * @module features/landing/components/CollapsingActionBar
 */

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { X, Undo2, Star, Check } from 'lucide-react-native';

import { useTheme } from '@/theme';
import type { Theme } from '@/theme/theme';
import { t } from '@/labels';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CollapsingActionBarProps {
  /**
   * Called when any of the four action buttons is pressed.
   * The screen uses this to show the "Available in a later phase" Snackbar.
   */
  readonly onAction: () => void;
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
}: CollapsingActionBarProps): React.ReactElement {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container} testID="collapsing-action-bar">
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
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: theme.spacing.xl,
      left: 0,
      right: 0,
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
