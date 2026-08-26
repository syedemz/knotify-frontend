/**
 * MenuHomeScreen — the Menu-tab home screen.
 *
 * Renders the own-profile summary page shown in the Menu tab, including:
 * - Top bar: "Marriage v" dropdown left (no-op), settings + bell right (no-ops).
 * - Profile row: round avatar (`ProfileThumbnailCircle`), full name + verified
 *   tick, Share pill (`ShareProfileButton variant="pill"`), Edit pill.
 * - Static chip row: Membership / Invite / Help / Safety & Advice (all no-ops).
 * - Basic-plan membership card (static copy, Upgrade no-op).
 * - Engagement cards row: 15 Likes / 3 Compliments / 1 Profile Boost
 *   (hard-coded, Get-more no-ops).
 * - €10 off Gold discount card (hard-coded, Claim no-op).
 *
 * Data source: `assets/dummyprofile.json` (static import, no API call in
 * phase 12). Navigation: avatar press → `MyProfileScreen` with
 * `{ initialTab: 'preview' }`; Edit pill press → `MyProfileScreen` with
 * `{ initialTab: 'edit' }`.
 *
 * @module features/profile/screens/MenuHomeScreen
 */

import React, { useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings, Bell, ChevronDown, CheckCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  Row,
  Column,
  Box,
  Text,
  Heading,
  Button,
  TouchableArea,
  Icon,
} from '@/components';
import { t } from '@/labels';

import { ShareProfileButton } from '../components/ShareProfileButton';
import { ProfileThumbnailCircle } from '../components/ProfileThumbnailCircle';

// Static import — no API call in phase 12.
import dummyprofileJson from '../../../../assets/dummyprofile.json';
import type { DummyOwnProfile } from '@/types/DummyOwnProfile';
const dummyprofile = dummyprofileJson as unknown as DummyOwnProfile;

// ── Navigation ────────────────────────────────────────────────────────────────

/**
 * Minimal param list for the Menu stack, scoped to routes this screen
 * navigates to. The full `MenuStackParamList` is declared in story 12.6.
 */
type MenuLocalParamList = {
  MenuHomeScreen: undefined;
  MyProfileScreen: { initialTab?: 'preview' | 'edit' } | undefined;
};

type MenuHomeNav = NativeStackNavigationProp<MenuLocalParamList, 'MenuHomeScreen'>;

// ── Hard-coded engagement data ─────────────────────────────────────────────
// TODO(dummy-only): replace with real engagement counters when the engagement
// / monetisation API ships in a later phase.

const ENGAGEMENT_LIKES = 15;
const ENGAGEMENT_COMPLIMENTS = 3;
const ENGAGEMENT_BOOST = 1;

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Renders the Menu-tab home: own-profile row, chip shortcut rail, membership
 * card, and engagement cards. Navigation events delegate to `MyProfileScreen`.
 */
export function MenuHomeScreen(): React.ReactElement {
  const navigation = useNavigation<MenuHomeNav>();
  const insets = useSafeAreaInsets();

  const handleAvatarPress = useCallback(() => {
    navigation.navigate('MyProfileScreen', { initialTab: 'preview' });
  }, [navigation]);

  const handleEditPress = useCallback(() => {
    navigation.navigate('MyProfileScreen', { initialTab: 'edit' });
  }, [navigation]);

  const noop = useCallback(() => {}, []);

  const avatarUri = dummyprofile.photos?.[0] ?? dummyprofile.photo_url ?? '';
  const fullName = `${dummyprofile.first_name} ${dummyprofile.last_name}`;
  const isVerified = dummyprofile.faceSelfieUri != null;

  const profileSlice = {
    user_id: dummyprofile.user_id,
    first_name: dummyprofile.first_name,
  };

  return (
    // Apply the safe-area inset on the OUTER container so the "Marriage v"
    // dropdown never renders under the status bar. Applying paddingTop via
    // ScrollView's contentContainerStyle proved unreliable on Android edge-
    // to-edge configurations.
    <View
      testID="menu-home-screen"
      style={{ flex: 1, paddingTop: insets.top }}
    >
    <ScrollView
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <Row paddingX="lg" paddingY="md" justify="space-between" align="center">
        <TouchableArea
          onPress={noop}
          accessibilityLabel={t('menu.marriageDropdown')}
          testID="menu-home-dropdown"
        >
          <Row gap="xs" align="center">
            <Text variant="label.lg" color="primary">{t('menu.marriageDropdown')}</Text>
            <ChevronDown size={16} strokeWidth={2} />
          </Row>
        </TouchableArea>
        <Row gap="lg" align="center">
          <TouchableArea
            onPress={noop}
            accessibilityLabel={t('menu.settings')}
            testID="menu-home-settings-button"
          >
            <Icon icon={Settings} size="md" color="primary" />
          </TouchableArea>
          <TouchableArea
            onPress={noop}
            accessibilityLabel={t('menu.notifications')}
            testID="menu-home-bell-button"
          >
            <Icon icon={Bell} size="md" color="primary" />
          </TouchableArea>
        </Row>
      </Row>

      {/* ── Profile row ──────────────────────────────────────────────── */}
      <Row paddingX="lg" paddingY="md" gap="md" align="center">
        <ProfileThumbnailCircle
          uri={avatarUri}
          onPress={handleAvatarPress}
          showEditDot={false}
          size={64}
          accessibilityLabel={fullName}
          testID="menu-home-avatar"
        />
        <Column gap="sm" flex>
          <Row gap="xs" align="center">
            <Heading variant="heading.md" numberOfLines={1}>
              {fullName}
            </Heading>
            {isVerified && (
              <CheckCircle size={16} strokeWidth={2} />
            )}
          </Row>
          <Row gap="sm" align="center">
            <ShareProfileButton
              profile={profileSlice}
              variant="pill"
              testID="menu-home-share-pill"
            />
            <Button
              label={t('menu.editPill')}
              onPress={handleEditPress}
              variant="primary"
              size="sm"
              fullWidth={false}
              testID="menu-home-edit-pill"
            />
          </Row>
        </Column>
      </Row>

      {/* ── Chip shortcut row ────────────────────────────────────────── */}
      <Row paddingX="lg" gap="sm" paddingY="sm" wrap>
        <Button label={t('menu.chips.membership')} onPress={noop} variant="ghost" size="sm" fullWidth={false} />
        <Button label={t('menu.chips.invite')} onPress={noop} variant="ghost" size="sm" fullWidth={false} />
        <Button label={t('menu.chips.help')} onPress={noop} variant="ghost" size="sm" fullWidth={false} />
        <Button label={t('menu.chips.safety')} onPress={noop} variant="ghost" size="sm" fullWidth={false} />
      </Row>

      {/* ── Basic-plan membership card ────────────────────────────────── */}
      <Box paddingX="lg" paddingY="sm">
        <Row justify="space-between" align="center" gap="md">
          <Column gap="xs" flex>
            <Text variant="label.lg" color="primary">{t('menu.membershipCard.title')}</Text>
            <Text variant="body.sm" color="secondary">{t('menu.membershipCard.subtitle')}</Text>
          </Column>
          <Button
            label={t('menu.membershipCard.upgrade')}
            onPress={noop}
            variant="primary"
            size="sm"
            fullWidth={false}
          />
        </Row>
      </Box>

      {/* ── Engagement cards row ──────────────────────────────────────── */}
      <Row paddingX="lg" paddingY="sm" gap="sm">
        {/* Likes */}
        <Column gap="xs" align="center" flex>
          <Heading variant="heading.lg">
            {String(ENGAGEMENT_LIKES)}
          </Heading>
          <Text variant="label.sm" color="secondary">{t('menu.engagement.likes')}</Text>
          <TouchableArea onPress={noop} accessibilityLabel={t('menu.engagement.getMore')}>
            <Text variant="label.sm" color="brand">{t('menu.engagement.getMore')}</Text>
          </TouchableArea>
        </Column>

        {/* Compliments */}
        <Column gap="xs" align="center" flex>
          <Heading variant="heading.lg">
            {String(ENGAGEMENT_COMPLIMENTS)}
          </Heading>
          <Text variant="label.sm" color="secondary">{t('menu.engagement.compliments')}</Text>
          <TouchableArea onPress={noop} accessibilityLabel={t('menu.engagement.getMore')}>
            <Text variant="label.sm" color="brand">{t('menu.engagement.getMore')}</Text>
          </TouchableArea>
        </Column>

        {/* Profile Boost */}
        <Column gap="xs" align="center" flex>
          <Heading variant="heading.lg">
            {String(ENGAGEMENT_BOOST)}
          </Heading>
          <Text variant="label.sm" color="secondary">{t('menu.engagement.boost')}</Text>
          <TouchableArea onPress={noop} accessibilityLabel={t('menu.engagement.getMore')}>
            <Text variant="label.sm" color="brand">{t('menu.engagement.getMore')}</Text>
          </TouchableArea>
        </Column>
      </Row>

      {/* ── Discount card ─────────────────────────────────────────────── */}
      <Box paddingX="lg" paddingY="sm">
        <Row justify="space-between" align="center" gap="md">
          <Column gap="xs" flex>
            <Text variant="label.lg" color="primary">{t('menu.engagement.discount')}</Text>
            <Text variant="body.sm" color="secondary">{t('menu.engagement.discountSubtitle')}</Text>
          </Column>
          <Button
            label={t('menu.engagement.claim')}
            onPress={noop}
            variant="primary"
            size="sm"
            fullWidth={false}
          />
        </Row>
      </Box>
    </ScrollView>
    </View>
  );
}
