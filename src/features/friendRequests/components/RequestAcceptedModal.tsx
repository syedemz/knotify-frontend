/**
 * RequestAcceptedModal — fully presentation-only modal for surfacing a
 * "friend request accepted" lifecycle event.
 *
 * This component is intentionally decoupled from `FriendshipProvider` and
 * from navigation knowledge: it fires `onSayHi()` and the HOST is responsible
 * for calling the cross-tab navigate. This matches the B1 contract established
 * by `IncomingRequestModal` (story 15.6).
 *
 * **Dev-trigger:** For phase 15 this modal is opened by a button on the
 * `MyProfileScreen` Edit tab (story 15.7). In phase 17 it will be opened by
 * the AppSync `onFriendRequestAccepted` subscription event.
 *
 * TODO(mock-only): remove dev trigger when subscription-driven modal trigger
 * ships in phase 17.
 *
 * @module features/friendRequests/components/RequestAcceptedModal
 */

import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import {
  Avatar,
  Button,
  Column,
  Heading,
  Row,
  Text,
} from '@/components';
import { useTheme } from '@/theme';
import { t } from '@/labels';
import type { DummyFullProfile } from '@/types/DummyFullProfile';
import type { Theme } from '@/theme/theme';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Props for `RequestAcceptedModal`.
 *
 * The modal is fully presentation-only: it fires callbacks but does NOT call
 * any provider hook or perform navigation internally. The host owns all
 * side-effects (navigation, provider mutations).
 */
export interface RequestAcceptedModalProps {
  /** Whether the modal is currently visible. */
  readonly visible: boolean;

  /**
   * The full profile of the user who accepted the request.
   * When `null`, the modal renders nothing.
   */
  readonly profile: DummyFullProfile | null;

  /** Called when the modal should close (backdrop tap, Say hi, or Not now). */
  readonly onClose: () => void;

  /**
   * Called when the user taps "Say hi".
   * The HOST is responsible for navigating to `ChatRoomScreen`.
   * The modal calls `onSayHi()` then `onClose()`.
   */
  readonly onSayHi: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Presentation-only modal for a "friend request accepted" event.
 *
 * Card content order (top to bottom):
 * 1. Avatar circle (~96px, via `Avatar size="xl"`)
 * 2. Interpolated title heading (`heading.md`, centered) —
 *    `friendRequests.accepted.title` with `firstName` substituted
 * 3. Subtitle paragraph (`body.sm`, `text.secondary`, centered) —
 *    `friendRequests.accepted.subtitle`
 * 4. Say-hi / Not-now button row (equal flex)
 *
 * Backdrop tap fires `onClose()` only.
 * Say hi fires `onSayHi()` + `onClose()`.
 * Not now fires `onClose()` only.
 *
 * @param props - {@link RequestAcceptedModalProps}
 */
export function RequestAcceptedModal({
  visible,
  profile,
  onClose,
  onSayHi,
}: RequestAcceptedModalProps): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSayHi = () => {
    onSayHi();
    onClose();
  };

  const handleNotNow = () => {
    onClose();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      testID="request-accepted-modal"
    >
      {/* Dimmed backdrop — tap dismisses (no action fired) */}
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t('friendRequests.accepted.title').replace(
          '{{firstName}}',
          profile.first_name ?? '',
        )}
        testID="request-accepted-backdrop"
      >
        {/* Card — inner Pressable stops backdrop tap propagating through the card */}
        <Pressable
          style={styles.card}
          accessibilityLabel={`${profile.first_name} ${profile.last_name}`}
          testID="request-accepted-card"
        >
          {/* 1. Avatar circle (~96px) */}
          <Column align="center">
            <Avatar
              uri={photoUri}
              initials={`${(profile.first_name ?? '?')[0] ?? '?'}${(profile.last_name ?? '')[0] ?? ''}`}
              size="xl"
              accessibilityLabel={`${profile.first_name} ${profile.last_name}`}
            />
          </Column>

          {/* 2. Interpolated title — "You and {firstName} are now connected!" */}
          <Heading
            variant="heading.md"
            align="center"
          >
            {t('friendRequests.accepted.title').replace('{{firstName}}', profile.first_name ?? '')}
          </Heading>

          {/* 3. Subtitle — "You can start a chat now." */}
          <Text
            variant="body.sm"
            color="secondary"
            align="center"
          >
            {t('friendRequests.accepted.subtitle')}
          </Text>

          {/* 4. Say-hi / Not-now button row */}
          <Row gap="sm">
            <View style={styles.buttonFlex}>
              <Button
                label={t('friendRequests.accepted.sayHiLabel')}
                variant="primary"
                onPress={handleSayHi}
                testID="request-accepted-say-hi-btn"
              />
            </View>
            <View style={styles.buttonFlex}>
              <Button
                label={t('friendRequests.accepted.notNowLabel')}
                variant="ghost"
                onPress={handleNotNow}
                testID="request-accepted-not-now-btn"
              />
            </View>
          </Row>
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
    buttonFlex: {
      flex: 1,
    },
  });
}
