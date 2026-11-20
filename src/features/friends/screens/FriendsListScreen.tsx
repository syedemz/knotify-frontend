/**
 * FriendsListScreen — standalone full-screen list of the signed-in user's
 * accepted friends.
 *
 * Registered in the Explore stack (story 16.2). Renders a `FlatList` of
 * `ListRow` components. Tapping a row navigates to `OtherProfileScreen` with
 * `{ userId, source: 'friend' }`.
 *
 * State coverage:
 * - **Loading** — `useFriendsQuery` pending → `<LoadingState />`.
 * - **Error** — query rejected → `<ErrorState />` with retry.
 * - **Empty** — query resolved with an empty array → `<EmptyState />`.
 * - **Ready** — query resolved with data → `FlatList` of `<ListRow />`.
 *
 * Visual layout is explicitly deferred (PRD story 16.2 notes). This is a
 * thin-wire implementation: wiring, states, navigation, and test coverage only.
 *
 * @module features/friends/screens/FriendsListScreen
 */

import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  LoadingState,
  EmptyState,
  ErrorState,
  ListRow,
  Heading,
} from '@/components';
import { Avatar } from '@/components/Avatar';
import { t } from '@/labels';
import { FRIENDS_QUERY_KEY, useFriendsQuery } from '@/features/friends/api';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/theme';
import type { Friend } from '@/types/api/Friend';
import type { ExploreStackParamList } from '@/navigation/types';

// ── Navigation ─────────────────────────────────────────────────────────────────

type ExploreNav = NativeStackNavigationProp<
  ExploreStackParamList,
  'FriendsListScreen'
>;

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * Full-screen standalone friends list for the Explore stack.
 *
 * Uses `useFriendsQuery()` from story 16.1. Each row taps through to
 * `OtherProfileScreen` with `source='friend'`.
 */
export function FriendsListScreen(): React.ReactElement {
  const navigation = useNavigation<ExploreNav>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const styles = useMemo(() => createStyles(theme, insets.top), [theme, insets.top]);

  const { data: friends, isLoading, isError, refetch } = useFriendsQuery();

  // Refetch friends every time this screen focuses. The counterpart may have
  // unfriended us while we were on another tab; without this invalidation
  // their row would remain visible until TanStack's staleTime expires
  // (default 5 min). Matches the ChatListScreen focus pattern.
  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
    }, [queryClient]),
  );

  // ── Row navigation ──────────────────────────────────────────────────────────

  const handleRowPress = useCallback(
    (userId: string) => {
      navigation.navigate('OtherProfileScreen', { userId, source: 'friend' });
    },
    [navigation],
  );

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderRow = useCallback(
    ({ item }: { item: Friend }) => {
      const fullName = `${item.first_name ?? ''} ${item.last_name ?? ''}`.trim();
      return (
        <ListRow
          label={fullName}
          leading={
            <Avatar
              uri={item.photo_url ?? ''}
              size="md"
              accessibilityLabel={fullName}
              fallbackSex={item.sex}
            />
          }
          onPress={() => handleRowPress(item.user_id)}
          accessibilityLabel={fullName}
          testID={`friend-row-${item.user_id}`}
        />
      );
    },
    [handleRowPress],
  );

  const keyExtractor = useCallback((item: Friend) => item.user_id, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View testID="friends-list-screen" style={styles.root}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Heading variant="heading.md">
          {t('friends.list.headerTitle')}
        </Heading>
      </View>

      {/* ── Content ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <LoadingState
          message={t('common.loading')}
          testID="friends-loading-state"
        />
      ) : isError ? (
        <ErrorState
          title={t('friends.list.errorTitle')}
          description={t('friends.list.errorDescription')}
          retryLabel={t('common.retry')}
          onRetry={refetch}
        />
      ) : friends === undefined || friends.length === 0 ? (
        <EmptyState
          title={t('friends.list.emptyTitle')}
          description={t('friends.list.emptyDescription')}
          testID="friends-empty-state"
        />
      ) : (
        <FlatList
          testID="friends-flat-list"
          data={friends}
          keyExtractor={keyExtractor}
          renderItem={renderRow}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme, topInset: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.bg.primary,
    },
    header: {
      alignItems: 'center',
      paddingTop: topInset + 12,
      paddingBottom: 12,
      paddingHorizontal: theme.spacing.lg,
    },
    listContent: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: 120,
      gap: theme.spacing.sm,
    },
  });
}
