/**
 * ExploreHomeScreen — Friends + Requests + Bookmarks subtabs for the Explore tab.
 *
 * Phase 13 (story 13.5) shipped Friends + Requests. Phase 14 story 14.3 adds
 * a third **Bookmarks** subtab showing the user's saved deck profiles as a
 * 2-column grid of `BookmarkCard` components.
 *
 * Story 16.FR3: rewired from `useFriendship()` to direct TanStack Query hooks:
 * - Friends: `useFriendsQuery()` returns `Friend[]` (each is a full UserProfile).
 * - Requests: `useIncomingRequestsQuery()` returns `FriendRequest[]`.
 * - Accept: `useAcceptFriendRequestMutation` (optimistic removal + cache invalidation).
 * - Decline: `useDeclineFriendRequestMutation` (optimistic removal) + local snackbar.
 * - `pendingToast` cross-screen handoff REMOVED — Decline no longer propagates a
 *   toast to this screen via provider state; each screen shows its own toast.
 *
 * Subtab order: Friends | Requests | Bookmarks.
 *
 * - **Friends**: flat list of current friends. Row press → `OtherProfileScreen`
 *   with `source='friend'`.
 * - **Requests**: flat list of pending incoming friend requests. Each row has a
 *   sibling-structure (see Note 1) with a left `TouchableArea` (row body → profile
 *   navigate with `source='request'`) and a right sibling `Row` with Accept /
 *   Decline buttons.
 * - **Bookmarks**: 2-column `FlatList` of `BookmarkCard` components read from
 *   `useBookmarks()`. Card press → `BookmarkDeckViewScreen` with `{ userId }`.
 *
 * **Note 1 — touch-scoping:** The requests row uses a sibling structure rather than
 * a single outer `TouchableArea`. This avoids RN's default touch propagation firing
 * BOTH the row-body press AND the button press when a button is tapped. The
 * `TouchableArea` wraps ONLY the left column; the Accept/Decline buttons live in a
 * sibling `Row` outside the touch target.
 *
 * @module features/explore/screens/ExploreHomeScreen
 */

import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  Row,
  Column,
  Text,
  Heading,
  TouchableArea,
  EmptyState,
  LoadingState,
  ErrorState,
  Snackbar,
  Button,
} from '@/components';
import { t } from '@/labels';
import { useBookmarks } from '@/state/bookmarks/BookmarksProvider';
import { FRIENDS_QUERY_KEY, useFriendsQuery } from '@/features/friends/api';
import {
  INCOMING_REQUESTS_QUERY_KEY,
  OUTGOING_REQUESTS_QUERY_KEY,
  useIncomingRequestsQuery,
  useAcceptFriendRequestMutation,
  useDeclineFriendRequestMutation,
} from '@/features/friendRequests/api';
import { useProfileQuery } from '@/features/profile/api';
import type { Friend } from '@/types/api/Friend';
import type { FriendRequest } from '@/types/api/FriendRequest';
import type { DummyDeckProfile } from '@/types/DummyDeckProfile';
import { ProfileThumbnailCircle } from '@/features/profile/components/ProfileThumbnailCircle';
import { BookmarkCard } from '@/features/bookmarks/components/BookmarkCard';
import type { ExploreStackParamList } from '@/navigation/types';

// ── Navigation ────────────────────────────────────────────────────────────────

type ExploreNav = NativeStackNavigationProp<ExploreStackParamList, 'ExploreHomeScreen'>;

// ── Types ─────────────────────────────────────────────────────────────────────

/** The three in-screen subtabs. Order: Friends | Requests | Bookmarks. */
type TabKey = 'friends' | 'requests' | 'bookmarks';

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Explore tab home screen with Friends, Requests, and Bookmarks subtabs.
 *
 * - Friends tab: tap row → `OtherProfileScreen` with `source='friend'`.
 * - Requests tab: tap row body → `OtherProfileScreen` with `source='request'`;
 *   tap Accept → `useAcceptFriendRequestMutation` + snackbar;
 *   tap Decline → `useDeclineFriendRequestMutation` + local snackbar.
 * - Bookmarks tab: 2-column grid of saved deck profiles; tap card →
 *   `BookmarkDeckViewScreen` with `{ userId }`.
 */
export function ExploreHomeScreen(): React.ReactElement {
  const navigation = useNavigation<ExploreNav>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // ── Data hooks ─────────────────────────────────────────────────────────────
  const friendsQuery = useFriendsQuery();
  const requestsQuery = useIncomingRequestsQuery();
  const acceptMutation = useAcceptFriendRequestMutation();
  const declineMutation = useDeclineFriendRequestMutation();
  const { bookmarks } = useBookmarks();

  // Refetch friends + incoming requests every time this screen focuses so a
  // counterpart's unfriend / block (performed from another device) is
  // reflected in the Friends tab without waiting for TanStack's default
  // staleTime window to elapse.
  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: INCOMING_REQUESTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: OUTGOING_REQUESTS_QUERY_KEY });
    }, [queryClient]),
  );

  const friends = friendsQuery.data ?? [];
  const requests = requestsQuery.data ?? [];

  const [activeTab, setActiveTab] = useState<TabKey>('friends');
  const [snackbarMsg, setSnackbarMsg] = useState<string | null>(null);

  // ── Tab handlers ───────────────────────────────────────────────────────────

  const handleSelectFriends = useCallback(() => {
    setActiveTab('friends');
  }, []);

  const handleSelectRequests = useCallback(() => {
    setActiveTab('requests');
  }, []);

  const handleSelectBookmarks = useCallback(() => {
    setActiveTab('bookmarks');
  }, []);

  // ── Friends list handlers ──────────────────────────────────────────────────

  const handleFriendRowPress = useCallback(
    (userId: string) => {
      navigation.navigate('OtherProfileScreen', { userId, source: 'friend' });
    },
    [navigation],
  );

  // ── Requests list handlers ─────────────────────────────────────────────────

  const handleRequestRowBodyPress = useCallback(
    (userId: string) => {
      navigation.navigate('OtherProfileScreen', { userId, source: 'request' });
    },
    [navigation],
  );

  const handleAcceptRequest = useCallback(
    (requestId: string) => {
      acceptMutation.mutate({ requestId });
      setSnackbarMsg(t('explore.requests.acceptedToast'));
    },
    [acceptMutation],
  );

  const handleDeclineRequest = useCallback(
    (requestId: string) => {
      declineMutation.mutate({ requestId });
      setSnackbarMsg(t('explore.requests.declinedToast'));
    },
    [declineMutation],
  );

  const handleSnackbarDismiss = useCallback(() => {
    setSnackbarMsg(null);
  }, []);

  // ── Bookmarks handler ──────────────────────────────────────────────────────

  const handleBookmarkCardPress = useCallback(
    (userId: string) => {
      navigation.navigate('BookmarkDeckViewScreen', { userId });
    },
    [navigation],
  );

  // ── Render helpers ─────────────────────────────────────────────────────────

  const renderFriendRow = useCallback(
    ({ item }: { item: Friend }) => {
      // Pass the raw asset path — Avatar (inside ProfileThumbnailCircle)
      // calls resolveDummyPhoto() internally. Pre-resolving here to a
      // require handle and String()-ing it produces "12" which Avatar
      // treats as a broken remote URL and falls back to the "?" initial.
      const photoPath = item.photo_url ?? '';
      const fullName = `${item.first_name} ${item.last_name}`;

      return (
        <TouchableArea
          onPress={() => handleFriendRowPress(item.user_id)}
          accessibilityLabel={fullName}
          testID={`friend-row-${item.user_id}`}
        >
          <Row paddingX="lg" paddingY="md" gap="md" align="center">
            <ProfileThumbnailCircle
              uri={photoPath}
              size={48}
              accessibilityLabel={fullName}
              fallbackSex={item.sex}
            />
            <Heading variant="heading.sm">{fullName}</Heading>
          </Row>
        </TouchableArea>
      );
    },
    [handleFriendRowPress],
  );

  const renderRequestRow = useCallback(
    ({ item }: { item: FriendRequest }) => (
      <IncomingRequestRow
        item={item}
        onBodyPress={handleRequestRowBodyPress}
        onAccept={handleAcceptRequest}
        onDecline={handleDeclineRequest}
      />
    ),
    [handleRequestRowBodyPress, handleAcceptRequest, handleDeclineRequest],
  );

  // ── Bookmarks render helper ────────────────────────────────────────────────

  const renderBookmarkCard = useCallback(
    ({ item }: { item: DummyDeckProfile }) => (
      <BookmarkCard
        bookmark={item}
        onPress={() => handleBookmarkCardPress(item.user_id)}
        testID={`bookmark-card-${item.user_id}`}
      />
    ),
    [handleBookmarkCardPress],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View testID="explore-home-screen" style={styles.root}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Heading variant="heading.md">{t('explore.title')}</Heading>
      </View>

      {/* ── In-screen tab bar — Friends | Requests | Bookmarks ───────── */}
      <Row paddingX="lg" justify="center" gap="huge">
        <TouchableArea
          onPress={handleSelectFriends}
          accessibilityLabel={t('explore.tabs.friends')}
          testID="explore-tab-friends"
        >
          <Column align="center" gap="xs">
            <Text
              variant="label.md"
              color={activeTab === 'friends' ? 'brand' : 'secondary'}
            >
              {t('explore.tabs.friends')}
            </Text>
          </Column>
        </TouchableArea>

        <TouchableArea
          onPress={handleSelectRequests}
          accessibilityLabel={t('explore.tabs.requests')}
          testID="explore-tab-requests"
        >
          <Column align="center" gap="xs">
            <Text
              variant="label.md"
              color={activeTab === 'requests' ? 'brand' : 'secondary'}
            >
              {t('explore.tabs.requests')}
            </Text>
          </Column>
        </TouchableArea>

        <TouchableArea
          onPress={handleSelectBookmarks}
          accessibilityLabel={t('explore.bookmarks.tab')}
          testID="explore-tab-bookmarks"
        >
          <Column align="center" gap="xs">
            <Text
              variant="label.md"
              color={activeTab === 'bookmarks' ? 'brand' : 'secondary'}
            >
              {t('explore.bookmarks.tab')}
            </Text>
          </Column>
        </TouchableArea>
      </Row>

      {/* ── Tab content ───────────────────────────────────────────────── */}
      {activeTab === 'friends' ? (
        friendsQuery.isLoading ? (
          <LoadingState message={t('common.loading')} testID="loading-state" />
        ) : friendsQuery.isError ? (
          <ErrorState
            title={t('common.error')}
            description={t('common.error')}
          />
        ) : friends.length === 0 ? (
          <EmptyState
            title={t('explore.friends.emptyTitle')}
            description={t('explore.friends.emptyDescription')}
            accessibilityLabel={t('explore.friends.emptyTitle')}
          />
        ) : (
          <FlatList
            key="friends-list"
            testID="explore-friends-list"
            data={friends}
            keyExtractor={(item) => item.user_id}
            renderItem={renderFriendRow}
            contentContainerStyle={styles.listContent}
          />
        )
      ) : activeTab === 'requests' ? (
        requestsQuery.isLoading ? (
          <LoadingState message={t('common.loading')} testID="loading-state" />
        ) : requestsQuery.isError ? (
          <ErrorState
            title={t('common.error')}
            description={t('common.error')}
          />
        ) : requests.length === 0 ? (
          <EmptyState
            title={t('explore.requests.emptyTitle')}
            description={t('explore.requests.emptyDescription')}
            accessibilityLabel={t('explore.requests.emptyTitle')}
          />
        ) : (
          <FlatList
            key="requests-list"
            testID="explore-requests-list"
            data={requests}
            keyExtractor={(item) => item.request_id}
            renderItem={renderRequestRow}
            contentContainerStyle={styles.listContent}
          />
        )
      ) : (
        /* activeTab === 'bookmarks' */
        bookmarks.length === 0 ? (
          <EmptyState
            title={t('explore.bookmarks.emptyTitle')}
            description={t('explore.bookmarks.emptyDescription')}
            accessibilityLabel={t('explore.bookmarks.emptyTitle')}
          />
        ) : (
          <FlatList
            key="bookmarks-list"
            testID="explore-bookmarks-list"
            data={bookmarks}
            keyExtractor={(item) => item.user_id}
            renderItem={renderBookmarkCard}
            numColumns={2}
            columnWrapperStyle={styles.bookmarksColumnWrapper}
            contentContainerStyle={styles.bookmarksContent}
          />
        )
      )}

      {/* ── Snackbar surface ─────────────────────────────────────────── */}
      <Snackbar
        visible={snackbarMsg !== null}
        message={snackbarMsg ?? ''}
        onDismiss={handleSnackbarDismiss}
        duration={3000}
        testID="explore-snackbar"
      />
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
    paddingBottom: 120,
  },
  // Bookmarks 2-column grid
  bookmarksContent: {
    // Horizontal padding matches theme.spacing.md (12). The grid gap is
    // handled via columnWrapperStyle below; row gap via BookmarkCard.marginBottom.
    paddingHorizontal: 12,
    paddingBottom: 120,
  },
  bookmarksColumnWrapper: {
    // Column gap between the two cards per row.
    gap: 12,
  },
});

// ── IncomingRequestRow ────────────────────────────────────────────────────────

/**
 * One row of the Requests subtab. Resolves the sender's profile via
 * `useProfileQuery(from_user_id)` so the row shows a real name + avatar.
 *
 * Extracted as its own component so the per-row `useProfileQuery` call
 * stays Rules-of-Hooks-safe (one hook call per row, stable order).
 */
interface IncomingRequestRowProps {
  readonly item: FriendRequest;
  readonly onBodyPress: (userId: string) => void;
  readonly onAccept: (requestId: string) => void;
  readonly onDecline: (requestId: string) => void;
}

function IncomingRequestRow({
  item,
  onBodyPress,
  onAccept,
  onDecline,
}: IncomingRequestRowProps): React.ReactElement {
  const profileQuery = useProfileQuery(item.from_user_id);
  const profile = profileQuery.data ?? null;

  const firstName = profile?.first_name ?? '';
  const lastName = profile?.last_name ?? '';
  // Never flash the raw user_id — stay blank until the profile query resolves.
  const fullName = firstName.length > 0 || lastName.length > 0
    ? `${firstName} ${lastName}`.trim()
    : '';
  const photoUri = profile?.photo_url ?? '';

  return (
    <Row paddingX="lg" paddingY="md" gap="md" align="center" justify="space-between">
      <TouchableArea
        onPress={() => onBodyPress(item.from_user_id)}
        accessibilityLabel={fullName}
        testID={`request-row-body-${item.from_user_id}`}
      >
        <Row gap="md" align="center">
          <ProfileThumbnailCircle
            uri={photoUri}
            size={48}
            accessibilityLabel={fullName}
            fallbackSex={profile?.sex ?? null}
          />
          <Column gap="xs">
            <Heading variant="heading.sm">{fullName}</Heading>
            <Text variant="label.sm" color="secondary">
              {t('explore.requests.sentYou')}
            </Text>
          </Column>
        </Row>
      </TouchableArea>

      <Row gap="sm" align="center">
        <Button
          label={t('explore.requests.accept')}
          variant="primary"
          size="sm"
          fullWidth={false}
          onPress={() => onAccept(item.request_id)}
          testID={`request-accept-${item.from_user_id}`}
        />
        <Button
          label={t('explore.requests.decline')}
          variant="ghost"
          size="sm"
          fullWidth={false}
          onPress={() => onDecline(item.request_id)}
          testID={`request-decline-${item.from_user_id}`}
        />
      </Row>
    </Row>
  );
}
