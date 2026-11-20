/**
 * MyProfileScreen — own-profile preview and edit shell.
 *
 * Renders the logged-in user's own profile in two segments:
 * - **Preview tab**: `<ProfileScrollView profile={dummyprofile} viewer="self" />`
 *   with `<ShareProfileButton variant="row-link" />` appended at the bottom.
 * - **Edit tab**: "Coming soon" `EmptyState` (dev-trigger buttons removed in
 *   story 16.FR3; subscription-driven modal triggers move to
 *   `FriendRequestSubscriptionListener` in story 16.8).
 *
 * The header shows: close X (goBack) left, full name + verified tick centre,
 * share icon-only right. The in-screen tab bar is a lightweight two-segment
 * row (NOT React Navigation stack tabs) driven by local `activeTab` state.
 *
 * Route param: `{ initialTab?: 'preview' | 'edit' }` — defaults to `'preview'`.
 *
 * @module features/profile/screens/MyProfileScreen
 */

import React, { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, CheckCircle } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { AppTabsParamList } from '@/navigation/types';

import {
  Row,
  Column,
  Text,
  Heading,
  TouchableArea,
  Icon,
  Button,
  LoadingState,
  EmptyState,
} from '@/components';
import { t } from '@/labels';
import { ProfileScrollView } from '@/features/profile-sections';
import type { DummyOverlay } from '@/types/DummyOverlay';
import type { UserProfile } from '@/types/api/UserProfile';
import { useOwnProfile } from '@/state/ownProfile/OwnProfileProvider';

import { ShareProfileButton } from '../components/ShareProfileButton';
import { AppearanceSection } from '../components/AppearanceSection';
import { AccountSection } from '../components/AccountSection';

// ── Navigation ────────────────────────────────────────────────────────────────

/**
 * Minimal param list covering routes this screen participates in.
 * The full `MenuStackParamList` is declared in story 12.6.
 */
type MenuLocalParamList = {
  MenuHomeScreen: undefined;
  MyProfileScreen: { initialTab?: 'preview' | 'edit' } | undefined;
};

type MyProfileRoute = RouteProp<MenuLocalParamList, 'MyProfileScreen'>;

/**
 * Cross-tab navigation type that covers both the Menu stack (goBack, close)
 * and the top-level tab navigator.
 */
type MyProfileNav = NativeStackNavigationProp<AppTabsParamList>;

// ── Types ─────────────────────────────────────────────────────────────────────

/** The two in-screen segments. */
type TabKey = 'preview' | 'edit';

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Renders the user's own profile with Preview / Edit tabs.
 *
 * - Preview: read-only `ProfileScrollView` + bottom share row-link.
 * - Edit: "Coming soon" `EmptyState` (dev-trigger panel removed in story 16.FR3).
 * - Header: close X → goBack, verified name centre, share icon-only right.
 */
export function MyProfileScreen(): React.ReactElement {
  const navigation = useNavigation<MyProfileNav>();
  const route = useRoute<MyProfileRoute>();
  const insets = useSafeAreaInsets();
  const { profile: ownProfile, status: ownStatus, refresh: refreshOwn } = useOwnProfile();

  const initialTab: TabKey =
    route.params?.initialTab === 'edit' ? 'edit' : 'preview';

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSelectPreview = useCallback(() => {
    setActiveTab('preview');
  }, []);

  const handleSelectEdit = useCallback(() => {
    setActiveTab('edit');
  }, []);

  // ── Loading / error gating ─────────────────────────────────────────────────
  // Show a spinner while the first hydration (cache or network) is in flight.
  // If the network errored AND we have no cached snapshot, show a retry CTA.

  if (ownProfile === null) {
    return (
      <View testID="my-profile-screen" style={{ flex: 1, paddingTop: insets.top }}>
        {ownStatus === 'error' ? (
          <Column gap="md" align="center" justify="center" flex>
            <EmptyState
              title={t('common.error')}
              description={t('myProfile.errors.loadFailed')}
            />
            <Button
              label={t('common.retry')}
              variant="primary"
              size="sm"
              fullWidth={false}
              onPress={() => { void refreshOwn(); }}
              testID="my-profile-retry-button"
            />
          </Column>
        ) : (
          <LoadingState message={t('common.loading')} />
        )}
      </View>
    );
  }

  // ── Display values ─────────────────────────────────────────────────────────

  const firstName = ownProfile.first_name ?? '';
  const lastName = ownProfile.last_name ?? '';
  const fullName = `${firstName} ${lastName}`.trim() || t('myProfile.nameFallback');
  const isVerified = ownProfile.profile_complete_verified === true;

  const profileSlice = {
    user_id: ownProfile.user_id,
    first_name: ownProfile.first_name,
  };

  // Real `UserProfile` satisfies `UserProfile & DummyOverlay` — every
  // DummyOverlay field is optional, so sections like PhotoBlockSection and
  // VerifiedProfileSection simply hide until the real backend equivalents ship.
  const profileForSections = ownProfile as UserProfile & DummyOverlay;

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
          {/* Edit functionality ships in a later phase. */}
          <EmptyState
            title={t('myProfile.editComingSoon.title')}
            description={t('myProfile.editComingSoon.description')}
            testID="my-profile-edit-empty-state"
          />

          {/* Appearance — light / dark / system theme selector */}
          <AppearanceSection />

          {/* Account — logout action (destructive, two-step confirm) */}
          <AccountSection />
        </ScrollView>
      )}
    </View>
  );
}
