/**
 * BlockedUsersScreen — full-screen list of users the signed-in user has blocked.
 *
 * Story 16.10. Registered in the Explore stack (consistent with
 * `FriendsListScreen` from story 16.2). Renders a `FlatList` of `ListRow`
 * components, each with an Unblock `Button` in the trailing slot wired to
 * `useUnblockUserMutation`.
 *
 * State coverage:
 * - **Loading** — `useBlockedUsersQuery` pending → `<LoadingState />`.
 * - **Error** — query rejected → `<ErrorState />` with retry.
 * - **Empty** — query resolved with an empty array → `<EmptyState />`.
 * - **Ready** — query resolved with data → `FlatList` of `<ListRow />`.
 *
 * Visual layout is explicitly deferred (PRD story 16.10 notes). This is a
 * thin-wire implementation: wiring, states, navigation, and test coverage only.
 *
 * @module features/blocks/screens/BlockedUsersScreen
 */

import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  LoadingState,
  EmptyState,
  ErrorState,
  ListRow,
  Heading,
  Button,
} from '@/components';
import { t } from '@/labels';
import {
  useBlockedUsersQuery,
  useUnblockUserMutation,
} from '@/features/blocks/api';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/theme';
import type { BlockedUser } from '@/services/api/endpoints';

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * Full-screen standalone blocked-users list for the Explore stack.
 *
 * Uses `useBlockedUsersQuery()` from story 16.9. Each row has an Unblock
 * button that fires `useUnblockUserMutation.mutate({ userId })`.
 */
export function BlockedUsersScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme, insets.top), [theme, insets.top]);

  const { data: blocked, isLoading, isError, refetch } = useBlockedUsersQuery();
  const unblockMutation = useUnblockUserMutation();

  // ── Unblock handler ──────────────────────────────────────────────────────────

  const handleUnblock = useCallback(
    (userId: string) => {
      unblockMutation.mutate({ userId });
    },
    [unblockMutation],
  );

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderRow = useCallback(
    ({ item }: { item: BlockedUser }) => (
      <ListRow
        label={item.user_id}
        trailing={
          <Button
            label={t('blocks.blockedUsers.unblockButton')}
            variant="ghost"
            size="sm"
            fullWidth={false}
            onPress={() => handleUnblock(item.user_id)}
            testID={`unblock-btn-${item.user_id}`}
          />
        }
        accessibilityLabel={item.user_id}
        testID={`blocked-row-${item.user_id}`}
      />
    ),
    [handleUnblock],
  );

  const keyExtractor = useCallback((item: BlockedUser) => item.user_id, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View testID="blocked-users-screen" style={styles.root}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Heading variant="heading.md">
          {t('blocks.blockedUsers.headerTitle')}
        </Heading>
      </View>

      {/* ── Content ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <LoadingState
          message={t('common.loading')}
          testID="blocked-users-loading-state"
        />
      ) : isError ? (
        <ErrorState
          title={t('blocks.blockedUsers.errorTitle')}
          description={t('blocks.blockedUsers.errorDescription')}
          retryLabel={t('common.retry')}
          onRetry={refetch}
        />
      ) : blocked === undefined || blocked.length === 0 ? (
        <EmptyState
          title={t('blocks.blockedUsers.emptyTitle')}
          description={t('blocks.blockedUsers.emptyDescription')}
          testID="blocked-users-empty-state"
        />
      ) : (
        <FlatList
          testID="blocked-users-flat-list"
          data={blocked}
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
