/**
 * IncomingRequestModal — fully presentation-only modal for surfacing an
 * incoming friend-request event.
 *
 * This component is intentionally decoupled from `FriendshipProvider`:
 * it fires callbacks (`onAccept`, `onDecline`) and the HOST is responsible
 * for calling `acceptRequest` / `declineRequest` on the provider and for
 * showing a snackbar. The modal MUST NOT call `useFriendship()` internally.
 *
 * **Dev-trigger:** For phase 15 this modal is opened by a button on the
 * `MyProfileScreen` Edit tab. In phase 17 it will be opened by the AppSync
 * `onFriendRequestReceived` subscription event.
 *
 * TODO(mock-only): remove dev trigger when subscription-driven modal trigger
 * ships in phase 17.
 *
 * @module features/friendRequests/components/IncomingRequestModal
 */

import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';

import {
  Avatar,
  Button,
  Column,
  Heading,
  Row,
  Text,
  TouchableArea,
} from '@/components';
import { useTheme } from '@/theme';
import { t } from '@/labels';
import type { DummyFullProfile } from '@/types/DummyFullProfile';
import type { Theme } from '@/theme/theme';
import type { AppTabsParamList, ExploreStackParamList } from '@/navigation/types';

// ── Navigation ────────────────────────────────────────────────────────────────

/**
 * Minimal cross-tab navigation type for navigating from within the modal
 * to OtherProfileScreen inside the Explore stack.
 *
 * `AppTabsParamList.Explore` is already `NavigatorScreenParams<ExploreStackParamList>`
 * (wired in phase 13.5), so this nested navigate call type-checks correctly.
 */
type CrossTabNav = NativeStackNavigationProp<AppTabsParamList>;

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Props for `IncomingRequestModal`.
 *
 * The modal is fully presentation-only: it fires callbacks but does NOT call
 * `useFriendship()` or render a snackbar internally.
 */
export interface IncomingRequestModalProps {
  /** Whether the modal is currently visible. */
  readonly visible: boolean;

  /**
   * The full profile of the user who sent the request.
   * When `null`, the modal renders nothing.
   */
  readonly profile: DummyFullProfile | null;

  /** Called when the modal should close (backdrop tap, Accept, or Decline). */
  readonly onClose: () => void;

  /**
   * Called when the user taps Accept.
   * The HOST is responsible for calling `acceptRequest(userId)` and showing
   * a snackbar. The modal calls `onAccept(profile.user_id)` then `onClose()`.
   *
   * @param userId - The `user_id` of the request sender.
   */
  readonly onAccept: (userId: string) => void;

  /**
   * Called when the user taps Decline.
   * The HOST is responsible for calling `declineRequest(userId)` and showing
   * a snackbar. The modal calls `onDecline(profile.user_id)` then `onClose()`.
   *
   * @param userId - The `user_id` of the request sender.
   */
  readonly onDecline: (userId: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Presentation-only modal for an incoming friend request event.
 *
 * Card content order (top to bottom):
 * 1. Avatar circle (~96px, via `Avatar size="xl"`)
 * 2. Full name heading (`heading.md`, centered)
 * 3. Age · city subtitle (`label.sm`, `text.secondary`, centered; null-guarded)
 * 4. About-me teaser (`body.sm`, 2 lines max; only when non-empty)
 * 5. Accept / Decline button row (equal flex)
 * 6. "View full profile" link — `onClose()` FIRST then navigates to
 *    `OtherProfileScreen` in the Explore stack with `source: 'request'`
 *
 * Backdrop tap fires `onClose()` only — no accept/decline action.
 * Accept fires `onAccept(profile.user_id)` + `onClose()`.
 * Decline fires `onDecline(profile.user_id)` + `onClose()`.
 *
 * @param props - {@link IncomingRequestModalProps}
 */
export function IncomingRequestModal({
  visible,
  profile,
  onClose,
  onAccept,
  onDecline,
}: IncomingRequestModalProps): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Navigation declared before any conditional return to satisfy Rules of Hooks.
  const navigation = useNavigation<CrossTabNav>();

  // Render nothing when no profile is provided.
  if (profile === null) {
    return null;
  }

  // Render nothing when not visible.
  if (!visible) {
    return null;
  }

  // ── Derived display values ──────────────────────────────────────────────────

  // Photo URI: prefer photos[0] over photo_url; Avatar resolves dummy-asset
  // registry lookups internally via resolveDummyPhoto.
  const photoUri: string | undefined =
    profile.photos?.[0] ?? profile.photo_url ?? undefined;

  const fullName = `${profile.first_name} ${profile.last_name}`;

  // "age · city" with null guards matching BookmarkCard pattern.
  const subtitleParts: string[] = [];
  if (profile.age != null) {
    subtitleParts.push(String(profile.age));
  }
  if (
    profile.current_residence_city != null &&
    profile.current_residence_city.trim() !== ''
  ) {
    subtitleParts.push(profile.current_residence_city);
  }
  const subtitle = subtitleParts.join(' · ');

  // Show about_me teaser only when non-empty.
  // `about_me` is not in the DummyFullProfile type but exists in the fixture
  // JSON and will land in UserProfile when the backend ships.
  // Cast via `unknown` first to avoid TS2352 (DummyFullProfile lacks an index signature).
  const aboutMeRaw = (profile as unknown as Record<string, unknown>)['about_me'];
  const aboutMe: string | null =
    typeof aboutMeRaw === 'string' && aboutMeRaw.trim().length > 0
      ? aboutMeRaw.trim()
      : null;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleAccept = () => {
    onAccept(profile.user_id);
    onClose();
  };

  const handleDecline = () => {
    onDecline(profile.user_id);
    onClose();
  };

  const handleViewFullProfile = () => {
    // Dismiss the modal first, then navigate — so the modal unmounts before
    // OtherProfileScreen is pushed onto the Explore stack.
    onClose();
    navigation.navigate('Explore', {
      screen: 'OtherProfileScreen',
      params: { userId: profile.user_id, source: 'request' },
    } as NavigatorScreenParams<ExploreStackParamList>);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      testID="incoming-request-modal"
    >
      {/* Dimmed backdrop — tap dismisses (no accept/decline action) */}
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t('friendRequests.incoming.title')}
        testID="incoming-request-backdrop"
      >
        {/* Card — inner Pressable stops backdrop tap propagating through the card */}
        <Pressable
          style={styles.card}
          accessibilityLabel={fullName}
          testID="incoming-request-card"
        >
          {/* 1. Avatar circle (~96px) */}
          <View style={styles.avatarRow}>
            <Avatar
              uri={photoUri}
              initials={`${(profile.first_name ?? '?')[0] ?? '?'}${(profile.last_name ?? '')[0] ?? ''}`}
              size="xl"
              accessibilityLabel={fullName}
            />
          </View>

          {/* 2. Full name */}
          <Heading
            variant="heading.md"
            align="center"
          >
            {fullName}
          </Heading>

          {/* 3. Age · city subtitle (null-guarded) */}
          {subtitle.length > 0 && (
            <Text
              variant="label.sm"
              color="secondary"
              align="center"
            >
              {subtitle}
            </Text>
          )}

          {/* 4. About-me teaser (2 lines max, only when non-empty) */}
          {aboutMe !== null && (
            <Text
              variant="body.sm"
              numberOfLines={2}
            >
              {aboutMe}
            </Text>
          )}

          {/* 5. Accept / Decline button row */}
          <Row gap="sm">
            <View style={styles.buttonFlex}>
              <Button
                label={t('friendRequests.incoming.acceptLabel')}
                variant="primary"
                onPress={handleAccept}
                testID="incoming-request-accept-btn"
              />
            </View>
            <View style={styles.buttonFlex}>
              <Button
                label={t('friendRequests.incoming.declineLabel')}
                variant="ghost"
                onPress={handleDecline}
                testID="incoming-request-decline-btn"
              />
            </View>
          </Row>

          {/* 6. View full profile link — colour: accent.primary (N1) */}
          <TouchableArea
            onPress={handleViewFullProfile}
            accessibilityLabel={t('friendRequests.incoming.viewFullProfileLabel')}
            testID="incoming-request-view-profile-link"
          >
            <Text
              variant="label.sm"
              color="brand"
              align="center"
            >
              {t('friendRequests.incoming.viewFullProfileLabel')}
            </Text>
          </TouchableArea>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      backgroundColor: theme.colors.bg.surface,
      borderRadius: theme.radii.lg,
      padding: theme.spacing.lg,
      width: '86%',
      maxWidth: 360,
      gap: theme.spacing.md,
      ...theme.shadows.md,
    },
    avatarRow: {
      alignItems: 'center',
    },
    buttonFlex: {
      flex: 1,
    },
  });
}
