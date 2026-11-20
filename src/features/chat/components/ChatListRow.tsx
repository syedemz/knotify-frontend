/**
 * ChatListRow — a single row in the Chat list screen.
 *
 * Story 16.5: rewired from `DummyFullProfile + useChatHistory` to `ChatRoom +
 * useProfileQuery`. Renders the counterpart's avatar + name + last-message
 * preview + formatted timestamp sourced directly from the `ChatRoom` record
 * (no secondary message fetch needed for the list view).
 *
 * The counterpart `user_id` is derived from `ChatRoom.userA` / `ChatRoom.userB`
 * — whichever is NOT `currentUserId`. Display name and avatar come from
 * `useProfileQuery(counterpartUserId)` keyed at `['profile', userId]`.
 *
 * Preview text and timestamp come from `ChatRoom.lastMessagePreview` and
 * `ChatRoom.lastMessageAt` top-level fields (the real-schema anchors per the
 * phase-16 PRD — there is no nested `latestMessage` object on `ChatRoom`).
 *
 * No `useChatHistory` or AsyncStorage dependency remains.
 *
 * @module features/chat/components/ChatListRow
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Heading, Text, TouchableArea } from '@/components';
import { t } from '@/labels';
import { useProfileQuery } from '@/features/profile/api';
import { ProfileThumbnailCircle } from '@/features/profile/components/ProfileThumbnailCircle';
import { formatChatTimestamp } from '@/features/chat/formatChatTimestamp';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/theme';
import type { ChatRoom } from '@/services/graphql/types';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Props for {@link ChatListRow}.
 */
export interface ChatListRowProps {
  /** The chat room this row represents. */
  readonly room: ChatRoom;
  /**
   * The signed-in user's `user_id`.
   *
   * Used to derive the counterpart `user_id` from `ChatRoom.userA`/`userB`.
   */
  readonly currentUserId: string;
  /** Called when the row is pressed. The parent supplies the navigate call. */
  readonly onPress: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * A tappable row in the chat room list.
 *
 * Displays a 48-px avatar on the left, a counterpart name + last-message
 * preview in the centre (flex 1), and a formatted timestamp on the right.
 *
 * Derives the counterpart `user_id` by comparing `room.userA` and `room.userB`
 * against `currentUserId`. Resolves display name and avatar via
 * `useProfileQuery(counterpartUserId)`.
 *
 * @param props - {@link ChatListRowProps}
 */
export function ChatListRow({ room, currentUserId, onPress }: ChatListRowProps): React.ReactElement {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Derive counterpart user_id: whichever of userA/userB is not the signed-in user.
  const counterpartUserId = room.userA === currentUserId ? room.userB : room.userA;

  const profileQuery = useProfileQuery(counterpartUserId);
  const profile = profileQuery.data ?? null;

  const photoPath = profile?.photo_url ?? '';
  const firstName = profile?.first_name ?? '';
  const lastName = profile?.last_name ?? '';
  // Never show the raw user_id — leave the name blank while the profile
  // query is loading rather than flash the UUID. Once resolved, prefer
  // first+last; if both are null on the backend, still render empty.
  const fullName = firstName.length > 0 || lastName.length > 0
    ? `${firstName} ${lastName}`.trim()
    : '';

  const accessibilityLabel = t('chat.list.rowAccessibility')
    .replace('{firstName}', firstName)
    .replace('{lastName}', lastName);

  // Last-message preview: use the top-level ChatRoom fields per real-schema anchors.
  const previewText = room.lastMessagePreview ?? t('chat.list.noMessagesYet');

  const timestampLabel = room.lastMessageAt !== null
    ? formatChatTimestamp(new Date(room.lastMessageAt).getTime())
    : '';

  return (
    <TouchableArea
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      testID={`chat-list-row-${room.roomId}`}
    >
      <View style={styles.row}>
        <ProfileThumbnailCircle
          uri={photoPath}
          size={48}
          accessibilityLabel={fullName}
          fallbackSex={profile?.sex ?? null}
          testID={`chat-list-avatar-${room.roomId}`}
        />

        {/* Centre column — flex:1 to fill space between avatar and timestamp */}
        <View style={styles.textColumn}>
          <Heading variant="heading.sm" numberOfLines={1}>
            {fullName}
          </Heading>
          <Text variant="body.sm" color="secondary" numberOfLines={1}>
            {previewText}
          </Text>
        </View>

        {/* Trailing timestamp — only shown when there is a last message */}
        {timestampLabel.length > 0 && (
          <Text variant="label.sm" color="secondary">
            {timestampLabel}
          </Text>
        )}
      </View>
    </TouchableArea>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      gap: theme.spacing.md,
    },
    textColumn: {
      flex: 1,
      // minWidth: 0 prevents text overflow from squeezing the timestamp column
      minWidth: 0,
    },
  });
}
