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
 * **Route typing (story 13.5):** Uses `RouteProp<ExploreStackParamList, 'OtherProfileScreen'>`
 * from `src/navigation/types.ts`. The local placeholder type from story 13.4 has been
 * replaced with the real ParamList entry.
 *
 * @module features/profile/screens/OtherProfileScreen
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
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

import { BackHeaderBar } from '../components/BackHeaderBar';

// ── Route types ────────────────────────────────────────────────────────────────

/**
 * Navigation prop and route prop derived from the real `ExploreStackParamList`.
 *
 * Wired in story 13.5 — replaces the lightweight local placeholder from 13.4.
 *
 * @see {@link ExploreStackParamList} in `src/navigation/types.ts`.
 */
type OtherProfileNav = NativeStackNavigationProp<ExploreStackParamList, 'OtherProfileScreen'>;
type OtherProfileRoute = RouteProp<ExploreStackParamList, 'OtherProfileScreen'>;

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Renders a friend's or pending-request-sender's full profile.
 *
 * Gated by the access guard — renders an EmptyState if the viewer is no longer
 * authorized (e.g. the request was declined and they arrived via a stale link).
 */
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

  // ── Accept snackbar state ──────────────────────────────────────────────────
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

  // ── Access guard (B1 / Q7) ─────────────────────────────────────────────────
  // Evaluated on every render so a state change (accept/decline) re-evaluates
  // the guard without requiring a separate useEffect.
  const isAuthorized: boolean = (() => {
    if (source === 'friend') {
      return isFriend(userId);
    }
    // source === 'request': authorized while either pending OR already a friend.
    // The OR-clause prevents flicker during the 1500ms Accept window.
    return receivedRequestFrom(userId) || isFriend(userId);
  })();

  // ── Profile resolution (NG1 / Q15) ────────────────────────────────────────
  // If the profile is not in the registry, isAuthorized will already be false
  // (because neither isFriend nor receivedRequestFrom would match). The
  // undefined-profile guard below is an additional defensive layer for the NG1
  // defensive path (e.g. a userId that is in neither the registry nor state).
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
    // Handoff mechanism (option b — story 13.4 / Q16):
    // The "Request declined" toast is forwarded to ExploreHomeScreen via
    // FriendshipProvider.pendingToast. ExploreHomeScreen reads it on focus
    // (story 13.5). We do NOT show the toast here because:
    //   1. goBack() unmounts this screen immediately.
    //   2. Holding the screen open for even 1ms after declineRequest() would
    //      trip the access guard (the user is no longer friend NOR pending).
    setPendingToast(t('otherProfile.declinedToast'));
    navigation.goBack();
  }, [declineRequest, userId, setPendingToast, navigation]);

  const handleSnackbarDismiss = useCallback(() => {
    setSnackbarMsg(null);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View testID="other-profile-screen" style={styles.root}>
      {/* Sticky back-arrow header */}
      <BackHeaderBar
        onBack={handleBack}
        accessibilityLabel={t('otherProfile.back')}
      />

      {/* Guard: render EmptyState if not authorized or profile not found */}
      {(!isAuthorized || profile === undefined) ? (
        <EmptyState
          title={t('otherProfile.notAuthorized.title')}
          description={t('otherProfile.notAuthorized.description')}
          accessibilityLabel={t('otherProfile.notAuthorized.title')}
        />
      ) : (
        <ScrollView
          testID="other-profile-scroll"
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

          {/* Full profile — 14-section catalog */}
          <ProfileScrollView
            profile={profileForSections}
            viewer="other"
            contactVisible={source === 'friend'}
          />
        </ScrollView>
      )}

      {/* Accepted toast — shown during the 1500ms window, dismissed by Snackbar timer */}
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
