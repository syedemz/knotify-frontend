/**
 * Page 14 — Second checkpoint + notification + location permissions.
 *
 * Renders a checkpoint screen that:
 * 1. On mount, checks current permission states from the OS in parallel
 *    (both notification and location) and writes the reconciled statuses to the
 *    draft via `setNotificationPermissionStatus` / `setLocationPermissionStatus`.
 * 2. If either permission is unresolved (`null` / `'undetermined'`), shows the
 *    "Enable Notifications" primary button (prompt state).
 * 3. After the user responds to both prompts — or if both were already
 *    terminal — shows the plain "Continue" button (continue state).
 * 4. On Continue tap in the continue state, calls
 *    `advanceWithCheckpoint(15, 'secondCheckpoint')` and navigates to
 *    `Page15ResidenceCountryScreen`.
 *
 * Layout mirrors `Page08FirstCheckpointScreen`: `WizardHeader` with
 * `hideProgress` + centered content column + `WizardFooter`.
 *
 * @module features/onboarding/screens/Page14SecondCheckpointScreen
 */

import React, { useCallback, useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';

import { Screen, WizardHeader, WizardFooter, Heading, Text, Column } from '@/components';
import { t } from '@/labels';
import { useOnboardingDraft } from '@/features/onboarding/hooks/useOnboardingDraft';
import {
  requestNotificationPermission,
  requestLocationPermission,
} from '@/services/permissions';
import type { OnboardingDraft } from '@/features/onboarding/draftSchema';
import type { OnboardingStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  'Page14SecondCheckpointScreen'
>;

/** Local UI mode for the three-state Continue button. */
type Mode = 'loading' | 'prompt' | 'continue';

type PermissionStatus = OnboardingDraft['notificationPermissionStatus'];

/** Returns true when a permission status is terminal (no prompt needed). */
function isTerminal(status: PermissionStatus): boolean {
  return status === 'granted' || status === 'denied';
}

/**
 * Second-checkpoint screen for onboarding page 14.
 *
 * Requests notification and location permissions sequentially on the user's
 * first tap, then advances to page 15 with the `secondCheckpoint` marker once
 * both permissions are settled.
 */
export function Page14SecondCheckpointScreen({ navigation }: Props): React.JSX.Element {
  const {
    advanceWithCheckpoint,
    setNotificationPermissionStatus,
    setLocationPermissionStatus,
  } = useOnboardingDraft();

  // Start in 'loading' to avoid a visible flicker on resumed sessions where
  // both permissions are already terminal. The mount effect reconciles the
  // OS-reported statuses before flipping to 'prompt' or 'continue'.
  const [mode, setMode] = useState<Mode>('loading');

  // ── Mount reconciliation ──────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const reconcile = async (): Promise<void> => {
      const [notifResult, locResult] = await Promise.all([
        Notifications.getPermissionsAsync(),
        Location.getForegroundPermissionsAsync(),
      ]);

      if (cancelled) return;

      // Respect canAskAgain: denied + canAskAgain:false → terminal 'denied'.
      const notifStatus: PermissionStatus =
        notifResult.status === 'granted'
          ? 'granted'
          : !notifResult.canAskAgain
            ? 'denied'
            : (notifResult.status as PermissionStatus);

      const locStatus: PermissionStatus =
        locResult.status === 'granted'
          ? 'granted'
          : !locResult.canAskAgain
            ? 'denied'
            : (locResult.status as PermissionStatus);

      setNotificationPermissionStatus(notifStatus);
      setLocationPermissionStatus(locStatus);

      if (!cancelled) {
        setMode(isTerminal(notifStatus) && isTerminal(locStatus) ? 'continue' : 'prompt');
      }
    };

    reconcile();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Tap handler ───────────────────────────────────────────────────────────

  const handleContinue = useCallback(async (): Promise<void> => {
    if (mode === 'loading') return;

    if (mode === 'prompt') {
      // Request both permissions sequentially. Write each result whether
      // granted or denied — never skipped.
      const notifStatus = await requestNotificationPermission();
      setNotificationPermissionStatus(notifStatus);

      const locStatus = await requestLocationPermission();
      setLocationPermissionStatus(locStatus);

      setMode('continue');
      return;
    }

    // mode === 'continue'
    advanceWithCheckpoint(15, 'secondCheckpoint');
    navigation.navigate('Page15ResidenceCountryScreen');
  }, [
    mode,
    advanceWithCheckpoint,
    navigation,
    setNotificationPermissionStatus,
    setLocationPermissionStatus,
  ]);

  // ── Derived label ─────────────────────────────────────────────────────────

  const continueLabel =
    mode === 'continue'
      ? t('onboarding.secondCheckpoint.continue')
      : t('onboarding.secondCheckpoint.enableNotifications');

  return (
    <Screen>
      <WizardHeader hideProgress onBack={() => navigation.goBack()} />
      <Column flex align="center" justify="center" gap="md" paddingX="lg">
        <Heading variant="heading.xl" align="center">
          {t('onboarding.secondCheckpoint.title')}
        </Heading>
        <Text variant="body.md" align="center" color="secondary">
          {t('onboarding.secondCheckpoint.subtitle')}
        </Text>
      </Column>
      <WizardFooter
        onContinue={handleContinue}
        continueLabel={continueLabel}
        disabled={mode === 'loading'}
      />
    </Screen>
  );
}
