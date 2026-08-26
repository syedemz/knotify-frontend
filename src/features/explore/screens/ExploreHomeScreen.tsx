/**
 * ExploreHomeScreen — Friends + Requests subtabs for the Explore tab.
 *
 * Phase 13 (story 13.5). Renders two in-screen subtabs:
 * - **Friends**: flat list of current friends. Row press → `OtherProfileScreen`
 *   with `source='friend'`.
 * - **Requests**: flat list of pending incoming friend requests. Each row has a
 *   sibling-structure (see Note 1) with a left `TouchableArea` (row body → profile
 *   navigate with `source='request'`) and a right sibling `Row` with Accept /
 *   Decline buttons.
 *
 * **Note 1 — touch-scoping:** The requests row uses a sibling structure rather than
 * a single outer `TouchableArea`. This avoids RN's default touch propagation firing
 * BOTH the row-body press AND the button press when a button is tapped. The
 * `TouchableArea` wraps ONLY the left column; the Accept/Decline buttons live in a
 * sibling `Row` outside the touch target.
 *
 * **Snackbar surface (NG2 / Q16):** This screen is the canonical snackbar surface
 * for the Explore stack. It serves:
 * 1. Row-level Accept/Decline button toasts.
 * 2. The "Request declined" toast forwarded from `OtherProfileScreen` via
 *    `FriendshipProvider.pendingToast` (consumed on `useFocusEffect`).
 *
 * **Tab-segment pattern:** Mirrors `MyProfileScreen`'s Preview/Edit approach —
 * local `activeTab` state, brand color on active, secondary color on inactive.
 *
 * @module features/explore/screens/ExploreHomeScreen
 */

import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  Row,
  Column,
  Text,
  Heading,
  TouchableArea,
  EmptyState,
  Snackbar,
  Button,
} from '@/components';
import { t } from '@/labels';
import { useFriendship } from '@/state/friendship/FriendshipProvider';
import type { DummyFullProfile } from '@/types/DummyFullProfile';
import type { PendingRequest } from '@/state/friendship/FriendshipProvider';
import { ProfileThumbnailCircle } from '@/features/profile/components/ProfileThumbnailCircle';
import { resolveDummyPhoto } from '@/assets/dummyPhotoRegistry';
import type { ExploreStackParamList } from '@/navigation/types';

// ── Navigation ────────────────────────────────────────────────────────────────

type ExploreNav = NativeStackNavigationProp<ExploreStackParamList, 'ExploreHomeScreen'>;

// ── Types ─────────────────────────────────────────────────────────────────────

/** The two in-screen subtabs. */
type TabKey = 'friends' | 'requests';

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Explore tab home screen with Friends and Requests subtabs.
 *
 * - Friends tab: tap row → `OtherProfileScreen` with `source='friend'`.
 * - Requests tab: tap row body → `OtherProfileScreen` with `source='request'`;
 *   tap Accept → `acceptRequest` + snackbar; tap Decline → `declineRequest` + snackbar.
 * - Snackbar surface: also consumes `FriendshipProvider.pendingToast` on every
 *   screen-focus event (cross-screen Decline handoff from `OtherProfileScreen`).
 */
export function ExploreHomeScreen(): React.ReactElement {
  const navigation = useNavigation<ExploreNav>();
  const insets = useSafeAreaInsets();
  const {
    friends,
    requests,
    acceptRequest,
    declineRequest,
    getFullProfile,
    consumePendingToast,
    pendingToast,
  } = useFriendship();

  const [activeTab, setActiveTab] = useState<TabKey>('friends');
  const [snackbarMsg, setSnackbarMsg] = useState<string | null>(null);

  // ── pendingToast consume on focus (NG2 / Q16) ──────────────────────────────
  // Every time this screen regains focus (e.g. after OtherProfileScreen goBack),
  // check if FriendshipProvider has a pending toast from the Decline handoff.
  // Call consumePendingToast() to clear it so it is shown exactly once.
  useFocusEffect(
    useCallback(() => {
      consumePendingToast();
      if (pendingToast !== null) {
        setSnackbarMsg(pendingToast);
      }
    }, [consumePendingToast, pendingToast]),
  );

  // ── Tab handlers ───────────────────────────────────────────────────────────

  const handleSelectFriends = useCallback(() => {
    setActiveTab('friends');
  }, []);

  const handleSelectRequests = useCallback(() => {
    setActiveTab('requests');
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
    (userId: string) => {
      acceptRequest(userId);
      setSnackbarMsg(t('explore.requests.acceptedToast'));
    },
    [acceptRequest],
  );

  const handleDeclineRequest = useCallback(
    (userId: string) => {
      declineRequest(userId);
      setSnackbarMsg(t('explore.requests.declinedToast'));
    },
    [declineRequest],
  );

  const handleSnackbarDismiss = useCallback(() => {
    setSnackbarMsg(null);
  }, []);

  // ── Render helpers ─────────────────────────────────────────────────────────

  const renderFriendRow = useCallback(
    ({ item }: { item: DummyFullProfile }) => {
      const photoPath = item.photos?.[0] ?? item.photo_url ?? '';
      const photoSource = resolveDummyPhoto(photoPath);
      const uri = photoSource !== undefined
        ? String(photoSource)
        : '';
      const fullName = `${item.first_name} ${item.last_name}`;

      return (
        <TouchableArea
          onPress={() => handleFriendRowPress(item.user_id)}
          accessibilityLabel={fullName}
          testID={`friend-row-${item.user_id}`}
        >
          <Row paddingX="lg" paddingY="md" gap="md" align="center">
            <ProfileThumbnailCircle
              uri={uri}
              size={48}
              accessibilityLabel={fullName}
            />
            <Heading variant="heading.sm">{fullName}</Heading>
          </Row>
        </TouchableArea>
      );
    },
    [handleFriendRowPress],
  );

  const renderRequestRow = useCallback(
    ({ item }: { item: PendingRequest }) => {
      const profile = getFullProfile(item.from_user_id);
      // Defensive: skip rows whose userId is not in the registry.
      if (profile === undefined) {
        return null;
      }

      const photoPath = profile.photos?.[0] ?? profile.photo_url ?? '';
      const photoSource = resolveDummyPhoto(photoPath);
      const uri = photoSource !== undefined ? String(photoSource) : '';
      const fullName = `${profile.first_name} ${profile.last_name}`;

      return (
        // Outer Row uses sibling structure (Note 1):
        // - Left: TouchableArea wrapping thumbnail + name column.
        // - Right: sibling Row with Accept/Decline buttons.
        // This prevents touch propagation firing BOTH the row press AND a button.
        <Row paddingX="lg" paddingY="md" gap="md" align="center" justify="space-between">
          {/* Left: row body — tappable column */}
          <TouchableArea
            onPress={() => handleRequestRowBodyPress(item.from_user_id)}
            accessibilityLabel={fullName}
            testID={`request-row-body-${item.from_user_id}`}
          >
            <Row gap="md" align="center">
              <ProfileThumbnailCircle
                uri={uri}
                size={48}
                accessibilityLabel={fullName}
              />
              <Column gap="xs">
                <Heading variant="heading.sm">{fullName}</Heading>
                <Text variant="label.sm" color="secondary">
                  {t('explore.requests.sentYou')}
                </Text>
              </Column>
            </Row>
          </TouchableArea>

          {/* Right: Accept + Decline buttons — sibling to TouchableArea */}
          <Row gap="sm" align="center">
            <Button
              label={t('explore.requests.accept')}
              variant="primary"
              size="sm"
              fullWidth={false}
              onPress={() => handleAcceptRequest(item.from_user_id)}
              testID={`request-accept-${item.from_user_id}`}
            />
            <Button
              label={t('explore.requests.decline')}
              variant="ghost"
              size="sm"
              fullWidth={false}
              onPress={() => handleDeclineRequest(item.from_user_id)}
              testID={`request-decline-${item.from_user_id}`}
            />
          </Row>
        </Row>
      );
    },
    [getFullProfile, handleRequestRowBodyPress, handleAcceptRequest, handleDeclineRequest],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View testID="explore-home-screen" style={styles.root}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Heading variant="heading.md">{t('explore.title')}</Heading>
      </View>

      {/* ── In-screen tab bar ─────────────────────────────────────────── */}
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
      </Row>

      {/* ── Tab content ───────────────────────────────────────────────── */}
      {activeTab === 'friends' ? (
        friends.length === 0 ? (
          <EmptyState
            title={t('explore.friends.emptyTitle')}
            description={t('explore.friends.emptyDescription')}
            accessibilityLabel={t('explore.friends.emptyTitle')}
          />
        ) : (
          <FlatList
            testID="explore-friends-list"
            data={friends}
            keyExtractor={(item) => item.user_id}
            renderItem={renderFriendRow}
            contentContainerStyle={styles.listContent}
          />
        )
      ) : (
        /* activeTab === 'requests' */
        requests.length === 0 ? (
          <EmptyState
            title={t('explore.requests.emptyTitle')}
            description={t('explore.requests.emptyDescription')}
            accessibilityLabel={t('explore.requests.emptyTitle')}
          />
        ) : (
          <FlatList
            testID="explore-requests-list"
            data={requests}
            keyExtractor={(item) => item.request_id}
            renderItem={renderRequestRow}
            contentContainerStyle={styles.listContent}
          />
        )
      )}

      {/* ── Snackbar surface (NG2 / Q16) ─────────────────────────────── */}
      {/* Serves row-level Accept/Decline toasts AND cross-screen Decline handoff */}
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
});
