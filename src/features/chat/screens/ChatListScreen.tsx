/**
 * ChatListScreen — WhatsApp-style list of chat rooms with their last-message
 * preview and formatted timestamp.
 *
 * Story 15.4: initial shell.
 * Story 16.FR3: rewired from `useFriendship().friends` to `useFriendsQuery()`.
 * Story 16.5: rewired from `useFriendsQuery()` to `useRoomsQuery()`. Route
 * param switched to `roomId` per PRD Round-1 BLOCKING 5. Counterpart user_id
 * derived from `ChatRoom.userA`/`userB` using `currentUserId` from
 * `useOwnProfile()`. Each row is a `ChatListRow` driven by one `ChatRoom`.
 *
 * Loading / error / empty states use the catalog components (`LoadingState`,
 * `ErrorState`, `EmptyState`) per story 16.5 ACs.
 *
 * **No tabBarHidden:** Unlike the Marriage and Explore stacks, the Chat tab
 * does not collapse the tab bar on scroll. The tab bar remains visible
 * throughout — `ChatRoomScreen` owns its own header and does not need the bar
 * to be hidden.
 *
 * @module features/chat/screens/ChatListScreen
 */

import React, { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Heading, EmptyState, LoadingState, ErrorState } from '@/components';
import { t } from '@/labels';
import { useRoomsQuery } from '@/features/chat/api';
import { useOwnProfile } from '@/state/ownProfile/OwnProfileProvider';
import type { ChatRoom } from '@/services/graphql/types';
import type { ChatStackParamList } from '@/navigation/types';
import { ChatListRow } from '@/features/chat/components/ChatListRow';

// ── Navigation typing ─────────────────────────────────────────────────────────

type ChatListNav = NativeStackNavigationProp<ChatStackParamList, 'ChatListScreen'>;

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Chat tab home screen — lists every chat room with the counterpart's name,
 * last-message preview, and a formatted timestamp.
 *
 * Pressing a row navigates to `ChatRoomScreen` with the room's `roomId`.
 * When there are no rooms, an `EmptyState` placeholder is shown.
 *
 * @see {@link ChatListRow} for the per-row component.
 */
export function ChatListScreen(): React.ReactElement {
  const navigation = useNavigation<ChatListNav>();
  const insets = useSafeAreaInsets();
  const roomsQuery = useRoomsQuery();
  const rooms = roomsQuery.data ?? [];

  // The signed-in user's id — used by ChatListRow to derive the counterpart.
  const { profile: ownProfile } = useOwnProfile();
  const currentUserId = ownProfile?.user_id ?? '';

  // ── Row press handler ──────────────────────────────────────────────────────

  const handleRowPress = useCallback(
    (roomId: string) => {
      navigation.navigate('ChatRoomScreen', { roomId });
    },
    [navigation],
  );

  // ── renderItem ─────────────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: ChatRoom }) => (
      <ChatListRow
        room={item}
        currentUserId={currentUserId}
        onPress={() => handleRowPress(item.roomId)}
      />
    ),
    [currentUserId, handleRowPress],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View testID="chat-list-screen" style={styles.root}>
      {/* ── Header — mirrors ExploreHomeScreen header shape ──────── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Heading variant="heading.md">{t('chat.list.headerTitle')}</Heading>
      </View>

      {/* ── Body ─────────────────────────────────────────────────── */}
      {roomsQuery.isLoading ? (
        <LoadingState message={t('common.loading')} />
      ) : roomsQuery.isError ? (
        <ErrorState
          title={t('common.error')}
          description={t('common.error')}
        />
      ) : rooms.length === 0 ? (
        <EmptyState
          title={t('chat.list.emptyTitle')}
          description={t('chat.list.emptyDescription')}
          accessibilityLabel={t('chat.list.emptyTitle')}
        />
      ) : (
        <FlatList
          testID="chat-list-flatlist"
          data={rooms}
          keyExtractor={(item) => item.roomId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  listContent: {
    paddingBottom: 80,
  },
});
