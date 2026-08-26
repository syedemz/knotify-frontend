/**
 * HeaderBar — sticky top bar for the Marriage landing page.
 *
 * Layout:
 * - Left: filter icon (press is a no-op in phase 12).
 * - Right: notification bell icon, with a small red dot when the current
 *   candidate has unread notifications
 *   (`dummyfemale.__dummy_display_only?.has_unread_notifications === true`).
 *
 * Per user directive for phase 12: the Sort pill and the green lightning-bolt
 * bubble shown in some reference screenshots are intentionally OMITTED.
 * Only filter icon (left) and bell icon (right) appear.
 *
 * @module features/landing/components/HeaderBar
 */

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SlidersHorizontal, Bell } from 'lucide-react-native';

import { useTheme } from '@/theme';
import type { Theme } from '@/theme/theme';
import { t } from '@/labels';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HeaderBarProps {
  /**
   * When `true`, renders a small red dot on the notification bell to indicate
   * unread notifications. Derived from
   * `dummyfemale.__dummy_display_only?.has_unread_notifications`.
   *
   * @default false
   */
  readonly hasUnreadNotifications?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Sticky header for the Marriage landing page.
 *
 * Renders a filter icon on the left and a notification bell on the right.
 * Both buttons are no-ops in phase 12. The bell shows a red dot when
 * `hasUnreadNotifications` is true.
 */
export function HeaderBar({
  hasUnreadNotifications = false,
}: HeaderBarProps): React.ReactElement {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View
      style={[styles.container, { paddingTop: insets.top + theme.spacing.sm }]}
      testID="landing-header-bar"
    >
      {/* Left: filter icon */}
      <Pressable
        onPress={() => {
          // TODO(dummy-only): filter functionality ships in a later phase
        }}
        accessibilityRole="button"
        accessibilityLabel={t('landing.header.filter')}
        testID="landing-header-filter-button"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.iconButton}
      >
        <SlidersHorizontal
          size={22}
          color={theme.colors.text.primary}
          strokeWidth={1.8}
        />
      </Pressable>

      {/* Right: notification bell with optional unread dot */}
      <Pressable
        onPress={() => {
          // TODO(dummy-only): notifications functionality ships in a later phase
        }}
        accessibilityRole="button"
        accessibilityLabel={t('landing.header.notifications')}
        testID="landing-header-bell-button"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.iconButton}
      >
        <View style={styles.bellWrapper}>
          <Bell
            size={22}
            color={theme.colors.text.primary}
            strokeWidth={1.8}
          />
          {hasUnreadNotifications && (
            <View
              style={styles.unreadDot}
              testID="landing-header-unread-dot"
            />
          )}
        </View>
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
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      // paddingTop is applied inline from safe-area insets; keep bottom
      // padding here so touch targets stay comfortably tall.
      paddingBottom: theme.spacing.sm,
      backgroundColor: theme.colors.bg.primary,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.default,
      // Subtle elevation so the header stays visually distinct from any
      // white content immediately below (e.g. the rounded top of the hero).
      ...theme.shadows.sm,
      zIndex: 2,
    },
    iconButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bellWrapper: {
      position: 'relative',
    },
    unreadDot: {
      position: 'absolute',
      top: -1,
      right: -1,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.notification.dot,
      borderWidth: 1.5,
      borderColor: theme.colors.bg.primary,
    },
  });
}
