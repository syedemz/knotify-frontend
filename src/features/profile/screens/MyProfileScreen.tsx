/**
 * MyProfileScreen — own-profile preview and edit shell.
 *
 * Renders the logged-in user's own profile in two segments:
 * - **Preview tab**: `<ProfileScrollView profile={dummyprofile} viewer="self" />`
 *   with `<ShareProfileButton variant="row-link" />` appended at the bottom.
 * - **Edit tab**: `<DevTriggersPanel>` with a dev-trigger button for the
 *   `IncomingRequestModal` (phase 15). Story 15.7 appends a second trigger
 *   for `RequestAcceptedModal` as a sibling child.
 *
 * The header shows: close X (goBack) left, full name + verified tick centre,
 * share icon-only right. The in-screen tab bar is a lightweight two-segment
 * row (NOT React Navigation stack tabs) driven by local `activeTab` state.
 *
 * Route param: `{ initialTab?: 'preview' | 'edit' }` — defaults to `'preview'`.
 *
 * TODO(mock-only): remove DevTriggersPanel + dev-trigger children when
 * subscription-driven modal triggers ship in phase 17. See teardown checklist
 * in context.md.
 *
 * @module features/profile/screens/MyProfileScreen
 */

import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, CheckCircle } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import {
  Row,
  Column,
  Text,
  Heading,
  TouchableArea,
  Icon,
  Button,
  Snackbar,
} from '@/components';
import { t } from '@/labels';
import { ProfileScrollView } from '@/features/profile-sections';
import type { DummyOverlay } from '@/types/DummyOverlay';
import type { UserProfile } from '@/types/api/UserProfile';
import type { DummyFullProfile } from '@/types/DummyFullProfile';
import { useFriendship } from '@/state/friendship/FriendshipProvider';

import { ShareProfileButton } from '../components/ShareProfileButton';
import { DevTriggersPanel } from '../components/DevTriggersPanel';
import { IncomingRequestModal } from '@/features/friendRequests/components/IncomingRequestModal';

// Static import — no API call in phase 12.
// eslint-disable-next-line @typescript-eslint/no-require-imports
import dummyprofileJson from '../../../../assets/dummyprofile.json';
import type { DummyOwnProfile } from '@/types/DummyOwnProfile';
const dummyprofile = dummyprofileJson as unknown as DummyOwnProfile;

// ── Fixture constants ─────────────────────────────────────────────────────────

/**
 * User ID of Qurat Baloch — the incoming-request fixture for phase 15.
 * Single source of truth for this fixture lookup. Derived once from the
 * fixture JSON at module scope (not at render time).
 *
 * TODO(mock-only): remove when real `onFriendRequestReceived` subscription ships.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const QURAT_USER_ID: string = (require('../../../../assets/dummyqurat.json') as { user_id: string }).user_id;

// ── Navigation ────────────────────────────────────────────────────────────────

/**
 * Minimal param list covering routes this screen participates in.
 * The full `MenuStackParamList` is declared in story 12.6.
 */
type MenuLocalParamList = {
  MenuHomeScreen: undefined;
  MyProfileScreen: { initialTab?: 'preview' | 'edit' } | undefined;
};

type MyProfileNav = NativeStackNavigationProp<MenuLocalParamList, 'MyProfileScreen'>;
type MyProfileRoute = RouteProp<MenuLocalParamList, 'MyProfileScreen'>;

// ── Types ─────────────────────────────────────────────────────────────────────

/** The two in-screen segments. */
type TabKey = 'preview' | 'edit';

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Renders the user's own profile with Preview / Edit tabs.
 *
 * - Preview: read-only `ProfileScrollView` + bottom share row-link.
 * - Edit: `DevTriggersPanel` with dev-trigger buttons for phase-15 modals.
 * - Header: close X → goBack, verified name centre, share icon-only right.
 * - `IncomingRequestModal` mounts at the screen level (not inside the panel).
 * - Local `Snackbar` shows Accept/Decline toasts. `pendingToast` is NOT touched.
 */
export function MyProfileScreen(): React.ReactElement {
  const navigation = useNavigation<MyProfileNav>();
  const route = useRoute<MyProfileRoute>();
  const insets = useSafeAreaInsets();
  const { getFullProfile, acceptRequest, declineRequest } = useFriendship();

  const initialTab: TabKey =
    route.params?.initialTab === 'edit' ? 'edit' : 'preview';

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  // ── Modal + snackbar state (15.6) ──────────────────────────────────────────
  const [incomingModalProfile, setIncomingModalProfile] = useState<DummyFullProfile | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSelectPreview = useCallback(() => {
    setActiveTab('preview');
  }, []);

  const handleSelectEdit = useCallback(() => {
    setActiveTab('edit');
  }, []);

  // ── Dev-trigger handler — Incoming Request (Qurat) ────────────────────────

  /**
   * Opens the IncomingRequestModal with Qurat's full profile.
   * Resolves via `getFullProfile(QURAT_USER_ID)` — the single source of truth.
   *
   * TODO(mock-only): remove when real subscription trigger ships in phase 17.
   */
  const handleOpenIncomingModal = useCallback(() => {
    const profile = getFullProfile(QURAT_USER_ID);
    if (profile !== undefined) {
      setIncomingModalProfile(profile);
    }
  }, [getFullProfile]);

  const handleCloseIncomingModal = useCallback(() => {
    setIncomingModalProfile(null);
  }, []);

  // ── IncomingRequestModal callbacks ─────────────────────────────────────────

  /**
   * Host-owned Accept handler.
   * Calls `acceptRequest` on the provider then shows a local snackbar.
   * `pendingToast` is NOT touched — the user stays on MyProfileScreen.
   */
  const handleAcceptRequest = useCallback(
    (userId: string) => {
      acceptRequest(userId);
      const profile = incomingModalProfile;
      const firstName = profile?.first_name ?? '';
      setSnackbarMessage(
        t('friendRequests.incoming.acceptedToast').replace('{firstName}', firstName),
      );
    },
    [acceptRequest, incomingModalProfile],
  );

  /**
   * Host-owned Decline handler.
   * Calls `declineRequest` on the provider then shows a local snackbar.
   * `pendingToast` is NOT touched.
   */
  const handleDeclineRequest = useCallback(
    (userId: string) => {
      declineRequest(userId);
      setSnackbarMessage(t('friendRequests.incoming.declinedToast'));
    },
    [declineRequest],
  );

  const handleDismissSnackbar = useCallback(() => {
    setSnackbarMessage(null);
  }, []);

  // ── Display values ─────────────────────────────────────────────────────────

  const fullName = `${dummyprofile.first_name} ${dummyprofile.last_name}`;
  const isVerified = dummyprofile.faceSelfieUri != null;

  const profileSlice = {
    user_id: dummyprofile.user_id,
    first_name: dummyprofile.first_name,
  };

  // Cast needed because DummyOwnProfile has a narrowed `preferences` field
  // that is not directly assignable to `UserProfile & DummyOverlay`.
  const profileForSections = dummyprofile as unknown as UserProfile & DummyOverlay;

  return (
    <View testID="my-profile-screen" style={{ flex: 1, paddingTop: insets.top }}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <Row paddingX="lg" paddingY="md" align="center" justify="space-between">
        {/* Close X */}
        <TouchableArea
          onPress={handleClose}
          accessibilityLabel={t('myProfile.close')}
          testID="my-profile-close-button"
        >
          <Icon icon={X} size="lg" color="primary" />
        </TouchableArea>

        {/* Name + verified tick */}
        <Row gap="xs" align="center">
          <Heading variant="heading.sm">{fullName}</Heading>
          {isVerified && (
            <CheckCircle size={16} strokeWidth={2} />
          )}
        </Row>

        {/* Share icon-only */}
        <ShareProfileButton
          profile={profileSlice}
          variant="icon-only"
          testID="my-profile-share-icon"
        />
      </Row>

      {/* ── In-screen tab bar ────────────────────────────────────────── */}
      <Row paddingX="lg" justify="center" gap="huge">
        <TouchableArea
          onPress={handleSelectPreview}
          accessibilityLabel={t('myProfile.tabs.preview')}
          testID="my-profile-tab-preview"
        >
          <Column align="center" gap="xs">
            <Text
              variant="label.md"
              color={activeTab === 'preview' ? 'brand' : 'secondary'}
            >
              {t('myProfile.tabs.preview')}
            </Text>
          </Column>
        </TouchableArea>

        <TouchableArea
          onPress={handleSelectEdit}
          accessibilityLabel={t('myProfile.tabs.edit')}
          testID="my-profile-tab-edit"
        >
          <Column align="center" gap="xs">
            <Text
              variant="label.md"
              color={activeTab === 'edit' ? 'brand' : 'secondary'}
            >
              {t('myProfile.tabs.edit')}
            </Text>
          </Column>
        </TouchableArea>
      </Row>

      {/* ── Tab content ──────────────────────────────────────────────── */}
      {activeTab === 'preview' ? (
        <ScrollView
          testID="my-profile-preview-scroll"
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <ProfileScrollView profile={profileForSections} viewer="self" />
          <ShareProfileButton
            profile={profileSlice}
            variant="row-link"
            testID="my-profile-share-row-link"
          />
        </ScrollView>
      ) : (
        <ScrollView
          testID="my-profile-edit-scroll"
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* TODO(mock-only): remove DevTriggersPanel when subscription-driven
              modal triggers ship in phase 17. See teardown in context.md. */}
          <DevTriggersPanel>
            {/* Trigger 1 — IncomingRequestModal (Qurat)
                Story 15.6. TODO(mock-only): remove when subscription ships. */}
            <Button
              label={t('menu.myProfile.editTab.devTriggers.incomingButtonLabel')}
              variant="ghost"
              onPress={handleOpenIncomingModal}
              testID="dev-trigger-incoming-btn"
            />
            {/* Story 15.7 will append a second Button sibling here — no edits
                to DevTriggersPanel.tsx required. */}
          </DevTriggersPanel>
        </ScrollView>
      )}

      {/* ── IncomingRequestModal — screen-level mount ─────────────────────── */}
      {/* TODO(mock-only): trigger source will change from dev button to
          real AppSync onFriendRequestReceived subscription in phase 17. */}
      <IncomingRequestModal
        visible={incomingModalProfile !== null}
        profile={incomingModalProfile}
        onClose={handleCloseIncomingModal}
        onAccept={handleAcceptRequest}
        onDecline={handleDeclineRequest}
      />

      {/* ── Local Snackbar for Accept/Decline toasts ───────────────────────── */}
      {/* pendingToast is NOT used for this surface — the user stays on this
          screen after tapping Accept/Decline so the toast fires locally. */}
      <Snackbar
        visible={snackbarMessage !== null}
        message={snackbarMessage ?? ''}
        onDismiss={handleDismissSnackbar}
        duration={3000}
        testID="my-profile-snackbar"
      />
    </View>
  );
}
