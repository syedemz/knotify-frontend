/**
 * Page 32 — Confirm captured selfie + final PATCH `/profile/me`.
 *
 * Shows the selfie captured on Page 31 in a large `Image` view, with two
 * primary actions:
 *
 * - **Continue** — runs the 5-step mock-only submit sequence (per PRD):
 *   1. Build the PATCH body via `buildPatchBody(draft, { isRetry: false })`.
 *   2. Submit PATCH `/profile/me` via the HTTP client (mock-mode: dispatched
 *      to `mockRequest`).
 *   3. Snapshot the PATCH body to secure-store key `dummy.profile`.
 *   4. Call `markComplete()` — owns BOTH the secure-store write AND the
 *      in-memory flip (do NOT split across caller and provider).
 *   5. Clear the onboarding draft via `clear()`.
 *
 *   On success the screen does NOT call `navigation.navigate('AppTabs')`.
 *   `markComplete()` triggers a `RootNavigator` re-render which swaps in
 *   `AppTabs` state-driven, not imperatively.
 *
 *   On 409 username collision, regenerates the username via `generateUsername()`
 *   and retries once (retry strips immutable fields via `buildPatchBody(…, { isRetry: true })`).
 *   A second 409 — or any other error — surfaces a retry action and preserves
 *   the draft.
 *
 * - **Retake** — pops back to Page 31 so the user can capture a new selfie.
 *   Disabled while a submit is in flight.
 *
 * This screen owns the entire submit path; Page 31 is capture-only.
 *
 * @module features/onboarding/screens/Page32ConfirmSelfieScreen
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';

import { Button, Heading, Screen, Snackbar, Text } from '@/components';
import { t } from '@/labels';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/theme';
import type { OnboardingStackParamList } from '@/navigation/types';
import { useOnboardingDraft } from '@/features/onboarding/hooks/useOnboardingDraft';
import { buildPatchBody } from '@/features/onboarding/buildPatchBody';
import { generateUsername } from '@/Helper/usernameHelper';
import { useOnboardingCompletion } from '@/state/onboardingCompletion/OnboardingCompletionProvider';
import { request } from '@/services/api/httpClient';
import { SecureStorageKey } from '@/services/auth/secureStorage';

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page32ConfirmSelfieScreen'>;

/**
 * Submit state machine for the PATCH sequence.
 *
 * - `'idle'`        — awaiting Continue tap.
 * - `'submitting'`  — PATCH in flight.
 * - `'retrying'`    — 409 received; regenerating username + re-submitting.
 * - `'error'`       — non-retryable error (network, 500, second 409).
 */
type SubmitState = 'idle' | 'submitting' | 'retrying' | 'error';

// ── Component ─────────────────────────────────────────────────────────────────

// TODO(mock-only): replace with real backend call when shipping. The 5-step
// sequence, 409 retry, and dummy.profile snapshot all go away — see
// context.md → "Before shipping".
export function Page32ConfirmSelfieScreen({ navigation, route }: Props): React.JSX.Element {
  const { faceSelfieUri } = route.params;

  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { getDraft, update, clear } = useOnboardingDraft();
  const mockOnboardingCompletion = useOnboardingCompletion();

  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const isSubmitting = submitState === 'submitting' || submitState === 'retrying';

  // ── Submit sequence ──────────────────────────────────────────────────────────

  /**
   * Executes the 5-step mock-only submit sequence. Aborts on any thrown step,
   * preserving the draft for retry.
   */
  const executeSubmit = useCallback(async (isRetry: boolean): Promise<void> => {
    const draft = getDraft();

    // Step 1: build PATCH body (pure — cannot throw for a valid draft).
    const patchBody = buildPatchBody(draft, { isRetry });

    // Step 2: PATCH /profile/me.
    await request<unknown>({
      method: 'PATCH',
      path: '/profile/me',
      body: patchBody,
    });

    // Step 3: snapshot to secure-store (MUST happen before step 4).
    await SecureStore.setItemAsync(
      SecureStorageKey.dummyProfile,
      JSON.stringify(patchBody),
    );

    // Step 4: markComplete — owns BOTH the secure-store write AND the in-memory flip.
    await mockOnboardingCompletion.markComplete();

    // Step 5: clear the draft (only after steps 3 + 4 succeed).
    clear();
    // State-driven navigation: markComplete() triggers RootNavigator re-render
    // which swaps in AppTabs. No navigation.navigate() call needed.
  }, [getDraft, mockOnboardingCompletion, clear]);

  const handleContinue = useCallback(async (): Promise<void> => {
    if (isSubmitting) return;

    setSubmitState('submitting');
    setSnackbarVisible(false);

    try {
      await executeSubmit(false);
      // Success: state-driven navigation handles the transition.
    } catch (err: unknown) {
      const statusCode = getStatusCode(err);

      if (statusCode === 409) {
        // Regenerate username and retry once.
        setSubmitState('retrying');

        const draft = getDraft();
        const firstName = draft.fields.first_name ?? '';
        const lastName = draft.fields.last_name ?? '';
        const newUsername = generateUsername(firstName, lastName);
        update({ username: newUsername });

        try {
          await executeSubmit(true);
        } catch {
          setSubmitState('error');
          setSnackbarVisible(true);
        }
      } else {
        setSubmitState('error');
        setSnackbarVisible(true);
      }
    }
  }, [isSubmitting, executeSubmit, getDraft, update]);

  const handleRetake = useCallback((): void => {
    if (isSubmitting) return;
    navigation.goBack();
  }, [isSubmitting, navigation]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Screen paddingX="lg">
      <View style={styles.header}>
        <Heading variant="display.md" color="primary">
          {t('onboarding.confirmSelfie.title')}
        </Heading>
        <View style={styles.subtitleSpacer} />
        <Text variant="body.md" color="primary">
          {t('onboarding.confirmSelfie.subtitle')}
        </Text>
      </View>

      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: faceSelfieUri }}
          style={styles.image}
          resizeMode="cover"
          accessibilityLabel={t('onboarding.confirmSelfie.imageAccessibility')}
          testID="confirm-selfie-image"
        />
      </View>

      <View style={styles.footer}>
        <Button
          label={
            isSubmitting
              ? t('onboarding.confirmSelfie.submitting')
              : t('onboarding.confirmSelfie.continueLabel')
          }
          variant="primary"
          onPress={() => { void handleContinue(); }}
          disabled={isSubmitting}
          testID="continue-button"
        />
        <View style={styles.retakeSpacer} />
        <Button
          label={t('onboarding.confirmSelfie.retakeLabel')}
          variant="secondary"
          onPress={handleRetake}
          disabled={isSubmitting}
          testID="retake-button"
        />

        {submitState === 'error' && (
          <View style={styles.errorWrapper}>
            <Text variant="body.sm" color="primary">
              {t('onboarding.confirmSelfie.submitError')}
            </Text>
            <Button
              label={t('onboarding.confirmSelfie.submitRetry')}
              variant="secondary"
              onPress={() => { void handleContinue(); }}
              testID="retry-submit-button"
            />
          </View>
        )}
      </View>

      <Snackbar
        visible={snackbarVisible}
        message={t('onboarding.confirmSelfie.submitError')}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        accessibilityLabel={t('onboarding.confirmSelfie.submitError')}
      />
    </Screen>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extracts the HTTP status code from an unknown error, if available.
 */
function getStatusCode(err: unknown): number | null {
  if (
    err !== null &&
    typeof err === 'object' &&
    'status' in err &&
    typeof (err as Record<string, unknown>)['status'] === 'number'
  ) {
    return (err as { status: number }).status;
  }
  return null;
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    header: {
      paddingTop: theme.spacing.xl,
    },
    subtitleSpacer: {
      height: theme.spacing.sm,
    },
    imageWrapper: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: theme.spacing.lg,
    },
    image: {
      width: '100%',
      aspectRatio: 3 / 4,
      borderRadius: theme.radii.lg,
      backgroundColor: theme.colors.bg.muted,
    },
    footer: {
      paddingBottom: theme.spacing.lg,
    },
    retakeSpacer: {
      height: theme.spacing.sm,
    },
    errorWrapper: {
      marginTop: theme.spacing.md,
      gap: theme.spacing.sm,
    },
  });
}
