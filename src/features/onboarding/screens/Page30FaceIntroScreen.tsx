/**
 * Page 30 — Face verification intro + camera permission gate.
 *
 * Renders an explainer body and a "Verify photo" button. On tap, the screen
 * calls `requestCameraPermission()`:
 *
 * - **Granted** → navigates to `Page31FaceCaptureScreen`.
 * - **First-time denied** (`'denied'` on the first tap, status was previously
 *   `'undetermined'`) → shows an inline "camera required" message with a Retry
 *   button. The Open Settings button is NOT shown yet.
 * - **Permanent deny** (tapping Retry again returns `'denied'`, or OS status
 *   was `'restricted'`) → additionally shows an "Open Settings" button that
 *   calls `Linking.openSettings()`, and surfaces a Snackbar/toast explaining
 *   that camera permission is required to complete registration.
 *
 * This screen mirrors the OS-settings deep-link pattern introduced in phase 10
 * story 10.1 (commit 48a13c3) for photo permission. The Snackbar reuses the
 * pattern from Page25PersonalityTraitsScreen (phase 9).
 *
 * @module features/onboarding/screens/Page30FaceIntroScreen
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  Button,
  Heading,
  Screen,
  Snackbar,
  Text,
  WizardHeader,
} from '@/components';
import { t } from '@/labels';
import { requestCameraPermission } from '@/services/permissions';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/theme';
import type { OnboardingStackParamList } from '@/navigation/types';

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page30FaceVerifyIntroScreen'>;

/**
 * Tracks the camera permission denial state within this screen's session.
 *
 * - `'none'`      — no denial has occurred yet (initial state, or permission granted).
 * - `'firstDeny'` — the user denied on the first request; Retry is shown but
 *                   Open Settings is not.
 * - `'permanent'` — a subsequent tap returned `'denied'` again (or OS returned
 *                   `'restricted'`); both Retry and Open Settings are shown,
 *                   plus the Snackbar toast.
 */
type DenialState = 'none' | 'firstDeny' | 'permanent';

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Onboarding page 30: face verification intro.
 *
 * Shows an explainer and calls `requestCameraPermission()` on "Verify photo"
 * tap. Escalates denial UI state from none → firstDeny → permanent. Permanent
 * deny shows "Open Settings" (mirrors page 28's pattern) plus a Snackbar toast
 * (mirrors page 25's pattern).
 */
export function Page30FaceIntroScreen({ navigation }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // ── Local state ──────────────────────────────────────────────────────────────

  /**
   * Current permission denial escalation level for this screen session.
   */
  const [denialState, setDenialState] = useState<DenialState>('none');

  /**
   * Whether the permanent-deny Snackbar toast is visible.
   */
  const [toastVisible, setToastVisible] = useState(false);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  /**
   * Handles "Verify photo" / "Retry" button press.
   *
   * Calls `requestCameraPermission()` and branches on the result:
   * - `'granted'` → navigate to Page31.
   * - `'denied'` with `denialState === 'none'` → first deny; show Retry.
   * - `'denied'` with `denialState === 'firstDeny'` → permanent deny; show
   *    Open Settings and the Snackbar toast.
   * - `'undetermined'` → treat as a no-op (edge case; system dialog may have
   *    been interrupted).
   */
  const handleVerifyPress = useCallback(async (): Promise<void> => {
    const status = await requestCameraPermission();

    if (status === 'granted') {
      navigation.navigate('Page31FaceCaptureScreen');
      return;
    }

    if (status === 'denied') {
      if (denialState === 'none') {
        // First denial — show Retry, not Open Settings yet.
        setDenialState('firstDeny');
        return;
      }
      // Subsequent denial — permanent deny flow.
      setDenialState('permanent');
      setToastVisible(true);
    }
    // 'undetermined' is a no-op; the system dialog may have been dismissed.
  }, [denialState, navigation]);

  /**
   * Opens OS settings so the user can manually grant camera permission.
   *
   * Also clears the Snackbar so it can re-appear if the user returns without
   * granting (Retry will show the toast again on the next permanent-deny).
   */
  const handleOpenSettings = useCallback((): void => {
    setToastVisible(false);
    void Linking.openSettings();
  }, []);

  const handleToastDismiss = useCallback((): void => {
    setToastVisible(false);
  }, []);

  // ── Derived flags ─────────────────────────────────────────────────────────────

  const showDeniedMessage = denialState === 'firstDeny' || denialState === 'permanent';
  const showOpenSettings = denialState === 'permanent';

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Screen paddingX="lg">
      <WizardHeader currentPage={30} onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <Heading variant="display.md" color="primary">
          {t('onboarding.faceIntro.title')}
        </Heading>

        <View style={styles.subtitleSpacer} />

        <Text variant="body.md" color="secondary">
          {t('onboarding.faceIntro.subtitle')}
        </Text>

        {showDeniedMessage && (
          <View style={styles.deniedMessageWrapper}>
            <Text variant="body.md" color="secondary">
              {t('onboarding.faceIntro.deniedMessage')}
            </Text>
          </View>
        )}

        {showOpenSettings && (
          <View style={styles.openSettingsWrapper}>
            <Button
              label={t('onboarding.faceIntro.openSettings')}
              variant="secondary"
              onPress={handleOpenSettings}
            />
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Button
          label={
            showDeniedMessage
              ? t('onboarding.faceIntro.retryButton')
              : t('onboarding.faceIntro.verifyButton')
          }
          variant="primary"
          onPress={() => { void handleVerifyPress(); }}
        />
      </View>

      <Snackbar
        visible={toastVisible}
        message={t('onboarding.faceIntro.permissionRequiredMessage')}
        onDismiss={handleToastDismiss}
        duration={4000}
        accessibilityLabel={t('onboarding.faceIntro.permissionRequiredMessage')}
      />
    </Screen>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    content: {
      flex: 1,
    },
    subtitleSpacer: {
      height: theme.spacing.sm,
    },
    deniedMessageWrapper: {
      marginTop: theme.spacing.xl,
    },
    openSettingsWrapper: {
      marginTop: theme.spacing.md,
    },
    footer: {
      paddingBottom: theme.spacing.lg,
    },
  });
}
