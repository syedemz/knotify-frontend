/**
 * UnfriendedBanner — non-interactive banner that replaces the composer on
 * `ChatRoomScreen` when `ChatRoom.friendshipActive === false`.
 *
 * Signals to the viewer that they can no longer send messages in this room
 * because the friendship was severed by either side (unfriend or block).
 * Backend contract: when `friendship_active=false`, `sendMessage` from either
 * participant returns `RoomReadOnly` — the banner is purely informational.
 *
 * @module features/chat/components/UnfriendedBanner
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';
import { t } from '@/labels';
import type { Theme } from '@/theme/theme';

// ── Props ─────────────────────────────────────────────────────────────────────

/**
 * Props for {@link UnfriendedBanner}.
 */
export interface UnfriendedBannerProps {
  /**
   * Display name (first name) of the counterpart whose friendship was
   * severed. Interpolated into the banner copy via
   * `.replace('{firstName}', friendName)`.
   */
  readonly friendName: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Renders a full-width, non-interactive notice where the composer would sit.
 *
 * The caller (`ChatRoomScreen`) decides when to mount this component based
 * on `ChatRoom.friendshipActive === false`; the banner itself has no visibility
 * logic.
 *
 * Styling matches the chat screen's dark palette (independent of app theme)
 * so the banner sits cleanly over the `bgDark.jpg` chat pattern instead of
 * flashing white during keyboard animations.
 *
 * @example
 * ```tsx
 * {room.friendshipActive === false ? (
 *   <UnfriendedBanner friendName={profile.first_name ?? ''} />
 * ) : (
 *   <View style={styles.composer}>{composer}</View>
 * )}
 * ```
 */
export function UnfriendedBanner({ friendName }: UnfriendedBannerProps): React.ReactElement {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const label = t('chat.room.unfriendedBanner').replace('{firstName}', friendName);

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom + theme.spacing.sm }]}
      testID="unfriended-banner"
    >
      <RNText
        accessibilityLabel={label}
        style={styles.label}
      >
        {label}
      </RNText>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

// Fixed dark palette matching the chat screen — see ChatRoomScreen's
// CHAT_BG_DARK / CHAT_TEXT_PRIMARY constants.
const BANNER_BG = '#1F2C33';
const BANNER_TEXT = '#8696A0';

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
      backgroundColor: BANNER_BG,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      color: BANNER_TEXT,
      fontSize: 14,
      textAlign: 'center',
    },
  });
}
