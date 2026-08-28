/**
 * ChatListRow — a single row in the Chat list screen.
 *
 * Renders one friend's avatar, name, and last-message preview alongside a
 * formatted timestamp. The `useChatHistory` hook is called at the TOP LEVEL
 * of this component (not inside `renderItem`) to satisfy the Rules of Hooks.
 * `ChatListScreen.renderItem` returns `<ChatListRow friend={item} onPress={...} />`
 * — the hook never appears inside a render callback.
 *
 * **Loading behaviour:** while the initial AsyncStorage hydration is in-flight,
 * the preview text falls back to the "No messages yet" label rather than
 * rendering a skeleton. This keeps the component stateless with respect to
 * loading UI and avoids layout-shift jank — hydration is fast (< 20 ms for
 * a mock store) so the brief fallback is imperceptible in practice.
 *
 * @module features/chat/components/ChatListRow
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Heading, Text, TouchableArea } from '@/components';
import { t } from '@/labels';
import { useChatHistory } from '@/state/chat/ChatProvider';
import { ProfileThumbnailCircle } from '@/features/profile/components/ProfileThumbnailCircle';
import { formatChatTimestamp } from '@/features/chat/formatChatTimestamp';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/theme';
import type { DummyFullProfile } from '@/types/DummyFullProfile';
import type { ChatMessage } from '@/types/ChatMessage';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Props for {@link ChatListRow}.
 */
export interface ChatListRowProps {
  /** The friend whose conversation thread this row represents. */
  readonly friend: DummyFullProfile;
  /** Called when the row is pressed. The parent supplies the navigate call. */
  readonly onPress: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * A tappable row in the chat friend list.
 *
 * Displays a 48-px avatar on the left, a name + last-message preview column
 * in the centre (flex 1), and a formatted timestamp on the right.
 *
 * The `useChatHistory(friend.user_id)` hook MUST live at the top level of this
 * component — calling hooks inside `FlatList.renderItem` violates the Rules of
 * Hooks and causes a runtime error.
 *
 * @param props - {@link ChatListRowProps}
 */
export function ChatListRow({ friend, onPress }: ChatListRowProps): React.ReactElement {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Hooks must be at the top level — never inside renderItem.
  const { messages, loading } = useChatHistory(friend.user_id);

  const photoPath = friend.photos?.[0] ?? friend.photo_url ?? '';
  const fullName = `${friend.first_name} ${friend.last_name}`;

  const accessibilityLabel = t('chat.list.rowAccessibility')
    .replace('{firstName}', friend.first_name ?? '')
    .replace('{lastName}', friend.last_name ?? '');

  // Last-message preview logic:
  // - non-empty messages array → last message text (truncated by numberOfLines)
  // - loading (hydration in-flight) → "No messages yet" fallback label
  // - empty (hydrated but no messages) → "No messages yet" fallback label
  // Both the loading and empty cases use the same label. Hydration is fast
  // (< 20 ms on the mock store), so the brief fallback text is imperceptible.
  const lastMessage: ChatMessage | undefined =
    !loading && messages.length > 0 ? messages[messages.length - 1] : undefined;
  const previewText = lastMessage !== undefined
    ? lastMessage.text
    : t('chat.list.noMessagesYet');

  const timestampLabel = lastMessage !== undefined
    ? formatChatTimestamp(lastMessage.timestamp)
    : '';

  return (
    <TouchableArea
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      testID={`chat-list-row-${friend.user_id}`}
    >
      <View style={styles.row}>
        <ProfileThumbnailCircle
          uri={photoPath}
          size={48}
          accessibilityLabel={fullName}
          testID={`chat-list-avatar-${friend.user_id}`}
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
