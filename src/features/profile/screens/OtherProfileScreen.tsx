/**
 * OtherProfileScreen — full profile view behind back-arrow header + access gate.
 *
 * Phase 13 (story 13.4). Opens from Explore when a user taps a friend row
 * (`source='friend'`) or a pending-request row (`source='request'`).
 *
 * **Access guard (B1 / Q7):** On every render, checks that the viewer is
 * still authorized:
 * - `source='friend'`  → authorized iff `isFriend(userId)`.
 * - `source='request'` → authorized iff `receivedRequestFrom(userId)` OR
 *   `isFriend(userId)`. The OR-clause keeps the screen visible during the
 *   1500 ms window after Accept fires (the user IS a friend by then, so the
 *   guard stays open — fixing the same race addressed by B1 for Accept).
 *
 * **Profile resolution (NG1 / Q15):** Resolved exclusively via
 * `useFriendship().getFullProfile(userId)`. No fixture re-imports here.
 *
 * **Decline handoff (NG2 / Q16 — option b):** On Decline, calls
 * `declineRequest(userId)`, stores the "declined" toast via
 * `FriendshipProvider.setPendingToast()`, and calls `navigation.goBack()`
 * IMMEDIATELY (no delay). ExploreHomeScreen (story 13.5) consumes the pending
 * toast on focus. Holding the screen open for any delay would trip the access
 * guard because after `declineRequest()` the user is neither a friend nor a
 * pending-request sender.
 *
 * **Scroll-driven tab-bar + FAB collapse (post-story-13.5 polish):**
 * The scroll surface is an `Animated.ScrollView` whose `onScroll` handler
 * writes to the shared `tabBarHidden` value using the same 8 px
 * delta threshold as `MarriageLandingScreen`. Both the bottom tab bar
 * (`AppTabs.CollapsingTabBar` — widened to also participate on the Explore
 * tab) and the friend-view `FloatingChatButton` read that same shared value
 * and translate in lock-step. On mount + unmount the value is reset to 0 so
 * the bar always returns visible when arriving here or leaving.
 *
 * **Friend-view extras (post-story-13.5 polish):**
 * - `BackHeaderBar` shows a right-side ⋮ menu button (unfriend / block /
 *   report — dropdown UI ships in a later phase; for now the press fires a
 *   "coming soon" snackbar).
 * - `FloatingChatButton` — round bottom-right FAB. Pressed, it opens the
 *   chat room with this friend (chat lands in phase 17; for now the press
 *   fires a "coming soon" snackbar).
 *
 * Neither the menu button nor the chat FAB renders on the request view.
 *
 * **Route typing (story 13.5):** Uses `RouteProp<ExploreStackParamList, 'OtherProfileScreen'>`
 * from `src/navigation/types.ts`.
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

import { EmptyState, Snackbar, Button, Row } from '@/components';
import { t } from '@/labels';
import { ProfileScrollView } from '@/features/profile-sections';
import type { DummyOverlay } from '@/types/DummyOverlay';
import type { UserProfile } from '@/types/api/UserProfile';
import { useFriendship } from '@/state/friendship/FriendshipProvider';
import type { ExploreStackParamList } from '@/navigation/types';
import { CandidateHero } from '@/features/landing/components/CandidateHero';
import { tabBarHidden } from '@/state/ui/tabBarHidden';

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

  const {
    isFriend,
    receivedRequestFrom,
    getFullProfile,
    acceptRequest,
    declineRequest,
    setPendingToast,
  } = useFriendship();

  // ── Snackbar (Accept toast + menu/chat "coming soon" toasts) ───────────────
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
  // and again on unmount so ExploreHomeScreen — which does not write to this
  // shared value — always sees the tab bar visible after we leave.
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
  const isAuthorized: boolean = (() => {
    if (source === 'friend') {
      return isFriend(userId);
    }
    return receivedRequestFrom(userId) || isFriend(userId);
  })();

  // ── Profile resolution (NG1 / Q15) ────────────────────────────────────────
  const profile = getFullProfile(userId);
  const profileForSections = profile as unknown as UserProfile & DummyOverlay;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleAccept = useCallback(() => {
    acceptRequest(userId);
    setSnackbarMsg(t('otherProfile.acceptedToast'));
    goBackTimerRef.current = setTimeout(() => {
      navigation.goBack();
    }, 1500);
  }, [acceptRequest, userId, navigation]);

  const handleDecline = useCallback(() => {
    declineRequest(userId);
    setPendingToast(t('otherProfile.declinedToast'));
    navigation.goBack();
  }, [declineRequest, userId, setPendingToast, navigation]);

  const handleMenuPress = useCallback(() => {
    // TODO(mock-only): dropdown UI (unfriend / block / report) ships in a
    // later phase. For now the button is clickable but shows only a toast.
    setSnackbarMsg(t('otherProfile.menu.comingSoonToast'));
  }, []);

  const handleChatPress = useCallback(() => {
    // TODO(mock-only): real chat ships in phase 17. For now the FAB is
    // clickable but shows only a toast.
    setSnackbarMsg(t('otherProfile.chat.comingSoonToast'));
  }, []);

  const handleSnackbarDismiss = useCallback(() => {
    setSnackbarMsg(null);
  }, []);

  const isFriendView = source === 'friend';

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

      {(!isAuthorized || profile === undefined) ? (
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
              here directly, matching the MarriageLandingScreen pattern. */}
          <CandidateHero profile={profile} />

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
