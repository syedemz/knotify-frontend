/**
 * Page 31 — Face capture, mock-only submit, local completion flag.
 *
 * Renders a full-screen camera preview with a `FaceOvalOverlay` drawn on top.
 * Face detection is driven by `react-native-vision-camera-face-detector`'s
 * `useFaceDetector()` hook (returns `{ detectFaces }`) and fed into
 * `useAutoCaptureController` which signals capture after
 * `CONSECUTIVE_FRAMES_REQUIRED` consecutive frames with a face inside the oval.
 *
 * A manual Shutter button is always rendered alongside auto-capture (per user
 * decision, concern #10). Both auto and manual capture reach the same handler.
 *
 * **Mock-only submit path (explicit ordering per PRD):**
 * 1. Build PATCH body via `buildPatchBody(draft, { isRetry: false })`.
 * 2. Submit PATCH `/profile/me` via the HTTP client (intercepted by MSW).
 * 3. Snapshot the PATCH body to secure-store key `dummy.profile`.
 * 4. Call `markComplete()` — owns BOTH the secure-store write AND the in-memory flip.
 * 5. Clear the onboarding draft via `clear()`.
 *
 * On success, the screen does NOT call `navigation.navigate('AppTabs')`.
 * `markComplete()` triggers a re-render of `RootNavigator` which swaps in
 * `AppTabs` state-driven, not imperatively.
 *
 * On 409 username collision, regenerates the username via `generateUsername()`
 * and retries once (retry strips immutable fields via `buildPatchBody(…, { isRetry: true })`).
 * A second 409 surfaces a "try again" action without clearing the draft.
 *
 * @module features/onboarding/screens/Page31FaceCaptureScreen
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';
import * as SecureStore from 'expo-secure-store';

import { Button, Heading, Screen, Snackbar, Text } from '@/components';
import { t } from '@/labels';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/theme';
import type { OnboardingStackParamList } from '@/navigation/types';
import { useOnboardingDraft } from '@/features/onboarding/hooks/useOnboardingDraft';
import { useAutoCaptureController } from '@/features/onboarding/hooks/useAutoCaptureController';
import { FaceOvalOverlay } from '@/features/onboarding/components/FaceOvalOverlay';
import { buildPatchBody } from '@/features/onboarding/buildPatchBody';
import { generateUsername } from '@/Helper/usernameHelper';
import { useOnboardingCompletion } from '@/state/onboardingCompletion/OnboardingCompletionProvider';
import { request } from '@/services/api/httpClient';
import { SecureStorageKey } from '@/services/auth/secureStorage';

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page31FaceCaptureScreen'>;

/**
 * Submit state machine for the PATCH sequence.
 *
 * - `'idle'`        — awaiting capture.
 * - `'submitting'`  — PATCH in flight.
 * - `'retrying'`    — 409 received; regenerating username + re-submitting.
 * - `'error'`       — non-retryable error (network, 500, second 409).
 */
type SubmitState = 'idle' | 'submitting' | 'retrying' | 'error';

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Onboarding page 31: face capture + mock-only submit.
 *
 * Full-screen camera preview with oval overlay. Supports both auto-capture
 * (face detection) and manual shutter button. After capture, executes the
 * 5-step mock-only submit sequence.
 */
// TODO(mock-only): remove the submit sequence and replace with real backend call when shipping
export function Page31FaceCaptureScreen(_props: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { getDraft, setFaceSelfieUri, update, clear } = useOnboardingDraft();
  const mockOnboardingCompletion = useOnboardingCompletion();

  const autoCapture = useAutoCaptureController();

  // Front camera device (face capture uses the front camera).
  const device = useCameraDevice('front');

  // Face detector plugin instance (memoized inside the hook).
  const { detectFaces } = useFaceDetector({ performanceMode: 'fast' });

  // ── Local state ─────────────────────────────────────────────────────────────

  /** Whether a selfie URI has been captured (auto or manual). */
  const [capturedUri, setCapturedUri] = useState<string | null>(null);

  /** Submit state machine. */
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

  /** Error message to display when submitState === 'error'. */
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /** Whether the error Snackbar is visible. */
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  // Ref to prevent double-capture when both auto and manual fire.
  const capturingRef = useRef(false);

  // ── Capture handler ──────────────────────────────────────────────────────────

  /**
   * Shared capture handler for auto and manual captures.
   *
   * In a real implementation this would call `cameraRef.current.takePhoto()`.
   * In mock-mode (and tests) we synthesize a local URI.
   *
   * TODO(mock-only): replace with real `camera.takePhoto()` when backend ships.
   */
  const handleCapture = useCallback(async (): Promise<void> => {
    if (capturingRef.current) return;
    capturingRef.current = true;

    // Synthesize a local URI in mock mode.
    // TODO(mock-only): replace with real camera.takePhoto() call.
    const uri = 'mock://face-selfie-' + Date.now() + '.jpg';
    setCapturedUri(uri);

    // Write the URI to the draft for the submit sequence.
    setFaceSelfieUri(uri);

    // Reset auto-capture so re-takes work.
    autoCapture.reset();
    capturingRef.current = false;
  }, [autoCapture, setFaceSelfieUri]);

  // ── Auto-capture wiring ──────────────────────────────────────────────────────

  // When the state machine signals capture, trigger the handler.
  // This effect fires whenever shouldCapture changes — but we gate on
  // `submitState === 'idle'` so a pending submit doesn't re-trigger.
  React.useEffect(() => {
    if (autoCapture.shouldCapture && submitState === 'idle' && capturedUri === null) {
      void handleCapture();
    }
  }, [autoCapture.shouldCapture, submitState, capturedUri, handleCapture]);

  // ── Frame processor (face detection) ────────────────────────────────────────

  /**
   * Vision Camera frame processor: runs `detectFaces` on each frame and feeds
   * the result into the auto-capture state machine.
   *
   * In tests, the camera is mocked so this is never called — the auto-capture
   * controller is tested directly with synthetic events.
   */
  // Frame processor runs on a worklet thread; JS closures cannot be shared
  // directly. `createRunOnJS` marshals `autoCapture.onFrame` back to the JS
  // thread so we can mutate React state from the worklet.
  const onFrameJS = useMemo(
    () => Worklets.createRunOnJS(autoCapture.onFrame),
    [autoCapture.onFrame],
  );

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const faces = detectFaces(frame);
    // Simplified oval check: assume any detected face is "inside" the oval.
    // A real implementation would compare face bounds to the oval dimensions.
    onFrameJS(faces.length > 0);
  }, [onFrameJS, detectFaces]);

  // ── Retake handler ───────────────────────────────────────────────────────────

  const handleRetake = useCallback((): void => {
    setCapturedUri(null);
    setSubmitState('idle');
    setErrorMessage(null);
    setSnackbarVisible(false);
    autoCapture.reset();
  }, [autoCapture]);

  // ── Submit sequence ──────────────────────────────────────────────────────────

  /**
   * Executes the 5-step mock-only submit sequence (per PRD).
   * Aborts on any thrown step, preserving the draft for retry.
   *
   * TODO(mock-only): replace with real PATCH call + JWT refresh sequence.
   */
  const executeSubmit = useCallback(async (isRetry: boolean): Promise<void> => {
    const draft = getDraft();

    // Step 1: Build the PATCH body (pure — cannot throw for a valid draft).
    const patchBody = buildPatchBody(draft, { isRetry });

    // Step 2: Submit PATCH /profile/me via the HTTP client.
    await request<unknown>({
      method: 'PATCH',
      path: '/profile/me',
      body: patchBody,
    });

    // Step 3: Snapshot the PATCH body to secure-store (MUST happen before step 4).
    // TODO(mock-only): remove when real backend + JWT claim decode ship
    await SecureStore.setItemAsync(
      SecureStorageKey.dummyProfile,
      JSON.stringify(patchBody),
    );

    // Step 4: Call markComplete() — owns BOTH the secure-store write AND the
    // in-memory state flip. Do NOT split across caller and provider.
    // TODO(mock-only): remove when real backend + JWT claim decode ship
    await mockOnboardingCompletion.markComplete();

    // Step 5: Clear the onboarding draft (only after steps 3 + 4 succeed).
    clear();
    // State-driven navigation: markComplete() triggers RootNavigator re-render
    // which swaps in AppTabs. No navigation.navigate() call needed.
  }, [getDraft, mockOnboardingCompletion, clear]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (submitState === 'submitting' || submitState === 'retrying') return;

    setSubmitState('submitting');
    setErrorMessage(null);
    setSnackbarVisible(false);

    try {
      await executeSubmit(false);
      // On success: state-driven navigation handles the transition.
    } catch (err: unknown) {
      // Check for 409 username collision.
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
          // On retry success: state-driven navigation handles the transition.
        } catch {
          // Second failure (including 409 again) — surface error to user.
          setSubmitState('error');
          setErrorMessage(t('onboarding.faceCapture.submitError'));
          setSnackbarVisible(true);
        }
      } else {
        // Non-retryable failure (500, network, etc.) — draft preserved.
        setSubmitState('error');
        setErrorMessage(t('onboarding.faceCapture.submitError'));
        setSnackbarVisible(true);
      }
    }
  }, [submitState, executeSubmit, getDraft, update]);

  // ── Derived flags ────────────────────────────────────────────────────────────

  const isSubmitting = submitState === 'submitting';
  const isRetrying = submitState === 'retrying';
  const hasCaptured = capturedUri !== null;
  const submitButtonLabel = isRetrying
    ? t('onboarding.faceCapture.usernameRegenerating')
    : t('onboarding.faceCapture.shutterButton');

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      {/* Camera preview — only when a device is available */}
      {device != null && !hasCaptured && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive
          frameProcessor={frameProcessor}
          testID="camera-preview"
        />
      )}

      {/* Face oval overlay — shown during capture phase */}
      {!hasCaptured && <FaceOvalOverlay />}

      {/* Screen content layer — transparent so the Camera preview underneath shows through */}
      <Screen paddingX="lg" transparent>
        {/* Header */}
        <View style={styles.header}>
          <Heading variant="display.md" color="inverse">
            {t('onboarding.faceCapture.title')}
          </Heading>
          <View style={styles.subtitleSpacer} />
          <Text variant="body.md" color="inverse">
            {hasCaptured
              ? t('onboarding.faceCapture.autoCaptureHint')
              : t('onboarding.faceCapture.subtitle')}
          </Text>
        </View>

        {/* Spacer to push footer to bottom */}
        <View style={styles.spacer} />

        {/* Footer actions */}
        <View style={styles.footer}>
          {!hasCaptured ? (
            /* Manual shutter button — always rendered */
            <Button
              label={submitButtonLabel}
              variant="primary"
              onPress={() => { void handleCapture(); }}
              testID="shutter-button"
            />
          ) : (
            /* Post-capture actions: Submit + Retake */
            <View style={styles.postCaptureActions}>
              <Button
                label={
                  isSubmitting || isRetrying
                    ? t('onboarding.faceCapture.usernameRegenerating')
                    : t('onboarding.faceCapture.shutterButton')
                }
                variant="primary"
                onPress={() => { void handleSubmit(); }}
                disabled={isSubmitting || isRetrying}
                testID="submit-button"
              />
              <View style={styles.retakeButtonSpacer} />
              <Button
                label={t('onboarding.faceCapture.captureRetry')}
                variant="secondary"
                onPress={handleRetake}
                disabled={isSubmitting || isRetrying}
                testID="retake-button"
              />
            </View>
          )}

          {submitState === 'error' && errorMessage !== null && (
            <View style={styles.errorWrapper}>
              <Text variant="body.sm" color="primary">
                {errorMessage}
              </Text>
              <Button
                label={t('onboarding.faceCapture.submitRetry')}
                variant="secondary"
                onPress={() => { void handleSubmit(); }}
                testID="retry-submit-button"
              />
            </View>
          )}
        </View>
      </Screen>

      {/* Error Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        message={t('onboarding.faceCapture.submitError')}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        accessibilityLabel={t('onboarding.faceCapture.submitError')}
      />
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extracts the HTTP status code from an unknown error, if available.
 *
 * @param err - Unknown thrown value.
 * @returns The status code, or `null` if unavailable.
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
    root: {
      flex: 1,
      backgroundColor: theme.colors.bg.primary,
    },
    header: {
      paddingTop: theme.spacing.xl,
    },
    subtitleSpacer: {
      height: theme.spacing.sm,
    },
    spacer: {
      flex: 1,
    },
    footer: {
      paddingBottom: theme.spacing.lg,
    },
    postCaptureActions: {
      gap: theme.spacing.sm,
    },
    retakeButtonSpacer: {
      height: theme.spacing.xs,
    },
    errorWrapper: {
      marginTop: theme.spacing.md,
      gap: theme.spacing.sm,
    },
  });
}
