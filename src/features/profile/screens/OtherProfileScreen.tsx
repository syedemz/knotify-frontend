/**
 * OtherProfileScreen — full profile view behind back-arrow header + access gate.
 *
 * Phase 13 (story 13.4). Opens from Explore when a user taps a friend row
 * (`source='friend'`) or a pending-request row (`source='request'`).
 *
 * Story 16.FR3: rewired from `useFriendship()` to direct TanStack Query hooks:
 * - `useFriendsQuery()` — determines whether the viewer is a friend.
 * - `useIncomingRequestsQuery()` — determines whether a pending request exists.
 * - `useAcceptFriendRequestMutation` — accepts a request (optimistic removal).
 * - `useDeclineFriendRequestMutation` — declines a request (optimistic removal);
 *   shows a local snackbar instead of the old `setPendingToast` cross-screen handoff.
 * - `useProfileQuery(userId)` — resolves the viewed user's full `UserProfile`.
 *
 * **Access guard (B1 / Q7):** On every render, checks that the viewer is
 * still authorized:
 * - `source='friend'`  → authorized iff `userId` appears in `useFriendsQuery()`.
 * - `source='request'` → authorized iff `userId` appears in
 *   `useIncomingRequestsQuery().from_user_id` OR in `useFriendsQuery()`.
 *   The OR-clause keeps the screen visible during the optimistic-removal window
 *   after Accept fires (the user IS now a friend so the guard stays open).
 *
 * **Decline handoff removed.** The `setPendingToast` / `consumePendingToast`
 * mechanism is deleted. OtherProfileScreen now shows its own snackbar locally
 * on Decline and calls `navigation.goBack()` immediately after.
 *
 * @module features/profile/screens/OtherProfileScreen
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { EmptyState, LoadingState, Snackbar, Button, Row } from '@/components';
import { t } from '@/labels';
import { ProfileScrollView } from '@/features/profile-sections';
import type { DummyOverlay } from '@/types/DummyOverlay';
import type { UserProfile } from '@/types/api/UserProfile';
import type { ExploreStackParamList } from '@/navigation/types';
import { CandidateHero } from '@/features/landing/components/CandidateHero';
import type { CandidateHeroProfile } from '@/features/landing/components/CandidateHero';
import { tabBarHidden } from '@/state/ui/tabBarHidden';
import { useOpenChatRoom } from '@/features/chat/navigation/openChatRoom';
import { useFriendsQuery } from '@/features/friends/api';
import {
  useIncomingRequestsQuery,
  useAcceptFriendRequestMutation,
  useDeclineFriendRequestMutation,
} from '@/features/friendRequests/api';
import { useProfileQuery } from '@/features/profile/api';

import { BackHeaderBar } from '../components/BackHeaderBar';
import { FloatingChatButton } from '../components/FloatingChatButton';

// ── Route types ────────────────────────────────────────────────────────────────

type OtherProfileNav = NativeStackNavigationProp<ExploreStackParamList, 'OtherProfileScreen'>;
type OtherProfileRoute = RouteProp<ExploreStackParamList, 'OtherProfileScreen'>;

// ── Constants ─────────────────────────────────────────────────────────────────

/** Minimum scroll delta (px) before the tab bar starts collapsing. Matches
 *  MarriageLandingScreen so both surfaces feel identical. */
const SCROLL_DELTA_THRESHOLD = 8;

// ── Component ─────────────────────────────────────────────────────────────────

export function OtherProfileScreen(): React.ReactElement {
  const navigation = useNavigation<OtherProfileNav>();
  const route = useRoute<OtherProfileRoute>();
  const { userId, source } = route.params;

  // ── Data hooks ─────────────────────────────────────────────────────────────
  const friendsQuery = useFriendsQuery();
  const requestsQuery = useIncomingRequestsQuery();
  const profileQuery = useProfileQuery(userId);
  const acceptMutation = useAcceptFriendRequestMutation();
  const declineMutation = useDeclineFriendRequestMutation();

  const friends = friendsQuery.data ?? [];
  const requests = requestsQuery.data ?? [];

  // ── Chat-room navigation helper ─────────────────────────────────────────────
  const openChatRoom = useOpenChatRoom();

  // ── Snackbar (Accept toast + menu "coming soon" toast + Decline toast) ───────
  const [snackbarMsg, setSnackbarMsg] = useState<string | null>(null);

  // ── goBack timer ref — cleared on unmount ──────────────────────────────────
  const goBackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (goBackTimerRef.current !== null) {
        clearTimeout(goBackTimerRef.current);
      }
    };
  }, []);

  // ── Tab-bar-hidden lifecycle reset ─────────────────────────────────────────
  // Reset to 0 on mount so we arrive with the tab bar (and chat FAB) visible,
  // and again on unmount so ExploreHomeScreen always sees the tab bar visible
  // after we leave.
  useEffect(() => {
    tabBarHidden.value = withTiming(0, { duration: 220 });
    return () => {
      tabBarHidden.value = withTiming(0, { duration: 220 });
    };
  }, []);

  // ── Scroll handler → drives tabBarHidden ───────────────────────────
  const previousScrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      const currentY = event.contentOffset.y;
      const delta = currentY - previousScrollY.value;

      if (delta > SCROLL_DELTA_THRESHOLD) {
        tabBarHidden.value = withTiming(1, { duration: 220 });
      } else if (delta < -SCROLL_DELTA_THRESHOLD) {
        tabBarHidden.value = withTiming(0, { duration: 220 });
      }

      previousScrollY.value = currentY;
    },
  });

  // ── Access guard (B1 / Q7) ─────────────────────────────────────────────────
  const isFriend = friends.some((f) => f.user_id === userId);
  const hasIncomingRequest = requests.some((r) => r.from_user_id === userId);

  const isAuthorized: boolean = (() => {
    if (source === 'friend') {
      return isFriend;
    }
    return hasIncomingRequest || isFriend;
  })();

  // ── Profile data (from query) ──────────────────────────────────────────────
  const profile = profileQuery.data;
  const profileForSections = profile as unknown as UserProfile & DummyOverlay;

  // ── Incoming request row (needed to get request_id for mutations) ──────────
  const incomingRequest = requests.find((r) => r.from_user_id === userId);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleAccept = useCallback(() => {
    if (incomingRequest === undefined) return;
    acceptMutation.mutate({ requestId: incomingRequest.request_id });
    setSnackbarMsg(t('otherProfile.acceptedToast'));
    goBackTimerRef.current = setTimeout(() => {
      navigation.goBack();
    }, 1500);
  }, [acceptMutation, incomingRequest, navigation]);

  const handleDecline = useCallback(() => {
    if (incomingRequest === undefined) return;
    declineMutation.mutate({ requestId: incomingRequest.request_id });
    // Show a local snackbar then immediately navigate back.
    // (The old pendingToast cross-screen handoff is deleted in story 16.FR3.)
    setSnackbarMsg(t('otherProfile.declinedToast'));
    navigation.goBack();
  }, [declineMutation, incomingRequest, navigation]);

  const handleMenuPress = useCallback(() => {
    setSnackbarMsg(t('otherProfile.menu.comingSoonToast'));
  }, []);

  const handleChatPress = useCallback(() => {
    if (profile === undefined) {
      return;
    }
    void openChatRoom(profile.user_id);
  }, [openChatRoom, profile]);

  const handleSnackbarDismiss = useCallback(() => {
    setSnackbarMsg(null);
  }, []);

  const isFriendView = source === 'friend';

  // ── Loading / error states for profile data ────────────────────────────────
  // Show a spinner while the profile is loading. If the access guard passes
  // but the profile query hasn't resolved yet, show the spinner.
  const isProfileLoading = profileQuery.isLoading;
  const isProfileError = profileQuery.isError;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View testID="other-profile-screen" style={styles.root}>
      {/* Sticky back-arrow header. Friend view also gets a right-side kebab. */}
      <BackHeaderBar
        onBack={handleBack}
        accessibilityLabel={t('otherProfile.back')}
        onMenuPress={isFriendView ? handleMenuPress : undefined}
        menuAccessibilityLabel={t('otherProfile.menu.accessibility')}
      />

      {(!isAuthorized) ? (
        <EmptyState
          title={t('otherProfile.notAuthorized.title')}
          description={t('otherProfile.notAuthorized.description')}
          accessibilityLabel={t('otherProfile.notAuthorized.title')}
        />
      ) : isProfileLoading ? (
        <LoadingState message={t('common.loading')} />
      ) : isProfileError || profile === undefined ? (
        <EmptyState
          title={t('otherProfile.notAuthorized.title')}
          description={t('otherProfile.notAuthorized.description')}
          accessibilityLabel={t('otherProfile.notAuthorized.title')}
        />
      ) : (
        <Animated.ScrollView
          testID="other-profile-scroll"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Request-action bar (only for source='request') */}
          {source === 'request' && (
            <View testID="other-profile-request-bar" style={styles.requestBar}>
              <Row gap="md" justify="center">
                <Button
                  label={t('otherProfile.actions.accept')}
                  variant="primary"
                  size="md"
                  fullWidth={false}
                  onPress={handleAccept}
                  testID="other-profile-accept-button"
                />
                <Button
                  label={t('otherProfile.actions.decline')}
                  variant="ghost"
                  size="md"
                  fullWidth={false}
                  onPress={handleDecline}
                  testID="other-profile-decline-button"
                />
              </Row>
            </View>
          )}

          {/* Hero — HeroBlock inside ProfileScrollView returns null for
              viewer='other' (phase-12 design), so we render CandidateHero
              here directly, matching the MarriageLandingScreen pattern.
              UserProfile satisfies CandidateHeroProfile structurally (all
              shared fields are present); the cast via unknown is safe. */}
          <CandidateHero profile={profile as unknown as CandidateHeroProfile} />

          {/* Full profile — 14-section catalog */}
          <ProfileScrollView
            profile={profileForSections}
            viewer="other"
            contactVisible={source === 'friend'}
          />
        </Animated.ScrollView>
      )}

      {/* Friend-view chat FAB — collapses with the tab bar via the same
          shared value. Not rendered on the request view. */}
      {isFriendView && isAuthorized && profile !== undefined && (
        <FloatingChatButton
          onPress={handleChatPress}
          accessibilityLabel={t('otherProfile.chat.accessibility').replace(
            '{name}',
            profile.first_name ?? '',
          )}
          hidden={tabBarHidden}
        />
      )}

      <Snackbar
        visible={snackbarMsg !== null}
        message={snackbarMsg ?? ''}
        onDismiss={handleSnackbarDismiss}
        duration={3000}
        testID="other-profile-accept-snackbar"
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  requestBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
