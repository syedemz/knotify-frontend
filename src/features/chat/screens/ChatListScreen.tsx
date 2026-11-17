/**
 * ChatListScreen — WhatsApp-style list of connected friends with their last
 * message and formatted timestamp.
 *
 * This is the initial route of `ChatStack` (story 15.4). Each row is a
 * `ChatListRow` — a standalone component that holds its own `useChatHistory`
 * call at the top level, satisfying the Rules of Hooks while keeping the
 * `renderItem` callback hook-free.
 *
 * Story 16.FR3: rewired from `useFriendship().friends` to `useFriendsQuery()`.
 * Loading, error, and empty states use the catalog components per story 16.5's
 * AC requirements (the teardown for the mock chat surfaces completes in 16.5;
 * this change unblocks the data shape migration without touching screen visuals).
 *
 * **No tabBarHidden:** Unlike the Marriage and Explore stacks, the Chat tab
 * does not collapse the tab bar on scroll. The tab bar remains visible
 * throughout — `ChatRoomScreen` (story 15.5) owns its own header and does not
 * need the bar to be hidden.
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
import { useFriendsQuery } from '@/features/friends/api';
import type { Friend } from '@/types/api/Friend';
import type { DummyFullProfile } from '@/types/DummyFullProfile';
import type { ChatStackParamList } from '@/navigation/types';
import { ChatListRow } from '@/features/chat/components/ChatListRow';

// ── Navigation typing ─────────────────────────────────────────────────────────

type ChatListNav = NativeStackNavigationProp<ChatStackParamList, 'ChatListScreen'>;

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Chat tab home screen — lists every friend with their last message preview
 * and a formatted timestamp.
 *
 * Pressing a row navigates to `ChatRoomScreen` with the friend's `user_id`.
 * When there are no friends, an `EmptyState` placeholder is shown.
 *
 * @see {@link ChatListRow} for the per-row component.
 */
export function ChatListScreen(): React.ReactElement {
  const navigation = useNavigation<ChatListNav>();
  const insets = useSafeAreaInsets();
  const friendsQuery = useFriendsQuery();
  const friends = friendsQuery.data ?? [];

  // ── Row press handler ──────────────────────────────────────────────────────

  const handleRowPress = useCallback(
    (friendUserId: string) => {
      navigation.navigate('ChatRoomScreen', { friendUserId });
    },
    [navigation],
  );

  // ── renderItem ─────────────────────────────────────────────────────────────
  //
  // DO NOT call useChatHistory here or inside this callback — hooks may only
  // be called at the top level of a React component or custom hook. The
  // standalone ChatListRow component holds the useChatHistory call.

  const renderItem = useCallback(
    ({ item }: { item: Friend }) => (
      <ChatListRow
        // ChatListRow expects DummyFullProfile; Friend (= UserProfile) is
        // structurally compatible for the fields it reads (user_id, first_name,
        // last_name, photo_url). The photos[] optional field is absent on
        // UserProfile but accessed with optional chaining in ChatListRow so it
        // is safe. Full type alignment is deferred to story 16.5 which replaces
        // useChatHistory inside ChatListRow with real query hooks.
        friend={item as unknown as DummyFullProfile}
        onPress={() => handleRowPress(item.user_id)}
      />
    ),
    [handleRowPress],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View testID="chat-list-screen" style={styles.root}>
      {/* ── Header — mirrors ExploreHomeScreen header shape ──────── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Heading variant="heading.md">{t('chat.list.headerTitle')}</Heading>
      </View>

      {/* ── Body ─────────────────────────────────────────────────── */}
      {friendsQuery.isLoading ? (
        <LoadingState message={t('common.loading')} />
      ) : friendsQuery.isError ? (
        <ErrorState
          title={t('common.error')}
          description={t('common.error')}
        />
      ) : friends.length === 0 ? (
        <EmptyState
          title={t('chat.list.emptyTitle')}
          description={t('chat.list.emptyDescription')}
          accessibilityLabel={t('chat.list.emptyTitle')}
        />
      ) : (
        <FlatList
          testID="chat-list-flatlist"
          data={friends}
          keyExtractor={(item) => item.user_id}
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
