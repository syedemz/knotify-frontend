/**
 * ChatListScreen — WhatsApp-style list of connected friends with their last
 * message and formatted timestamp.
 *
 * This is the initial route of `ChatStack` (story 15.4). Each row is a
 * `ChatListRow` — a standalone component that holds its own `useChatHistory`
 * call at the top level, satisfying the Rules of Hooks while keeping the
 * `renderItem` callback hook-free.
 *
 * **Empty state:** When the current user has no friends yet, an `EmptyState`
 * is rendered instead of the list. In the mock-phase seed, Mehvish is always
 * a friend, so this state is unlikely in normal dev usage but is covered by
 * tests.
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

import { Heading, EmptyState } from '@/components';
import { t } from '@/labels';
import { useFriendship } from '@/state/friendship/FriendshipProvider';
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
  const { friends } = useFriendship();

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
    ({ item }: { item: DummyFullProfile }) => (
      <ChatListRow
        friend={item}
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
      {friends.length === 0 ? (
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
