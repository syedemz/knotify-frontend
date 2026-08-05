/**
 * MyProfileScreen — own-profile preview and edit shell.
 *
 * Renders the logged-in user's own profile in two segments:
 * - **Preview tab**: `<ProfileScrollView profile={dummyprofile} viewer="self" />`
 *   with `<ShareProfileButton variant="row-link" />` appended at the bottom.
 * - **Edit tab**: `<EmptyState title="Coming soon" />` placeholder.
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

import {
  Row,
  Column,
  Text,
  Heading,
  TouchableArea,
  Icon,
  EmptyState,
} from '@/components';
import { t } from '@/labels';
import { ProfileScrollView } from '@/features/profile-sections';
import type { DummyOverlay } from '@/types/DummyOverlay';
import type { UserProfile } from '@/types/api/UserProfile';

import { ShareProfileButton } from '../components/ShareProfileButton';

// Static import — no API call in phase 12.
import dummyprofileJson from '../../../../assets/dummyprofile.json';
import type { DummyOwnProfile } from '@/types/DummyOwnProfile';
const dummyprofile = dummyprofileJson as unknown as DummyOwnProfile;

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
 * - Edit: coming-soon `EmptyState`.
 * - Header: close X → goBack, verified name centre, share icon-only right.
 */
export function MyProfileScreen(): React.ReactElement {
  const navigation = useNavigation<MyProfileNav>();
  const route = useRoute<MyProfileRoute>();
  const insets = useSafeAreaInsets();

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
      <Row paddingX="lg" justify="center" gap="xl">
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
        <ScrollView testID="my-profile-preview-scroll">
          <ProfileScrollView profile={profileForSections} viewer="self" />
          <ShareProfileButton
            profile={profileSlice}
            variant="row-link"
            testID="my-profile-share-row-link"
          />
        </ScrollView>
      ) : (
        <EmptyState
          title={t('myProfile.editComingSoon.title')}
          description={t('myProfile.editComingSoon.description')}
          accessibilityLabel={t('myProfile.editComingSoon.title')}
        />
      )}
    </View>
  );
}
