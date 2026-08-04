/**
 * Page 31 — Face capture, capture-only.
 *
 * Renders a full-screen camera preview with a `FaceOvalOverlay` on top. Face
 * detection is driven by `react-native-vision-camera-face-detector`'s
 * `useFaceDetector()` hook and fed into `useAutoCaptureController`, which
 * signals capture after `CONSECUTIVE_FRAMES_REQUIRED` consecutive frames with
 * a face inside the oval. A manual Shutter button is always rendered alongside
 * auto-capture; both auto and manual capture reach the same handler.
 *
 * When a photo is captured — via `Camera.takePhoto()` — the resulting `file://`
 * URI is written to the onboarding draft and the screen navigates forward to
 * `Page32ConfirmSelfieScreen`, which owns the confirm / retake / submit flow.
 * This screen never talks to the backend directly; the submit sequence lives
 * on Page 32.
 *
 * On re-focus (user taps Retake on Page 32), local state is reset so the user
 * can capture again.
 *
 * @module features/onboarding/screens/Page31FaceCaptureScreen
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';

import { Button, Heading, Screen, Text } from '@/components';
import { t } from '@/labels';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/theme';
import type { OnboardingStackParamList } from '@/navigation/types';
import { useOnboardingDraft } from '@/features/onboarding/hooks/useOnboardingDraft';
import { useAutoCaptureController } from '@/features/onboarding/hooks/useAutoCaptureController';
import { FaceOvalOverlay } from '@/features/onboarding/components/FaceOvalOverlay';

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page31FaceCaptureScreen'>;

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Onboarding page 31: face capture.
 *
 * Full-screen camera preview with oval overlay. Supports both auto-capture
 * (face detection) and manual shutter button. After capture, forwards the
 * `file://` URI to Page 32 for confirmation + submit.
 */
export function Page31FaceCaptureScreen({ navigation }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { setFaceSelfieUri } = useOnboardingDraft();

  const autoCapture = useAutoCaptureController();

  // Front camera device (face capture uses the front camera).
  const device = useCameraDevice('front');

  // Face detector plugin instance (memoized inside the hook).
  const { detectFaces } = useFaceDetector({ performanceMode: 'fast' });

  // Camera ref for imperative photo capture.
  const cameraRef = useRef<Camera>(null);

  // ── Local state ─────────────────────────────────────────────────────────────

  /** True while `takePhoto()` is in flight — prevents double-fire. */
  const [isCapturing, setIsCapturing] = useState(false);

  // Ref mirror of `isCapturing` so the auto-capture effect can gate off it
  // without adding it to the dependency array (which would re-fire the effect).
  const capturingRef = useRef(false);

  // ── Capture handler ──────────────────────────────────────────────────────────

  /**
   * Shared capture handler for auto and manual captures. Invokes
   * `cameraRef.current.takePhoto()`, writes the resulting `file://` URI to the
   * onboarding draft, and navigates to Page 32.
   */
  const handleCapture = useCallback(async (): Promise<void> => {
    if (capturingRef.current) return;
    capturingRef.current = true;
    setIsCapturing(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const photo = await cameraRef.current!.takePhoto();
      // `photo.path` is a bare filesystem path — prefix `file://` for RN <Image>.
      const uri = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;

      setFaceSelfieUri(uri);
      navigation.navigate('Page32ConfirmSelfieScreen', { faceSelfieUri: uri });
    } finally {
      // Reset for the next capture (in case the user returns via Retake).
      capturingRef.current = false;
      setIsCapturing(false);
      autoCapture.reset();
    }
  }, [autoCapture, navigation, setFaceSelfieUri]);

  // ── Auto-capture wiring ──────────────────────────────────────────────────────

  React.useEffect(() => {
    if (autoCapture.shouldCapture && !capturingRef.current) {
      void handleCapture();
    }
  }, [autoCapture.shouldCapture, handleCapture]);

  // Reset local state whenever the screen re-focuses (e.g. after Retake on Page 32).
  useFocusEffect(
    useCallback(() => {
      capturingRef.current = false;
      setIsCapturing(false);
      autoCapture.reset();
    }, [autoCapture]),
  );

  // ── Frame processor (face detection) ────────────────────────────────────────

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
    // Real bounds-check tracked in context.md follow-ups.
    onFrameJS(faces.length > 0);
  }, [onFrameJS, detectFaces]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      {device != null && (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive
          photo
          frameProcessor={frameProcessor}
          testID="camera-preview"
        />
      )}

      <FaceOvalOverlay />

      {/* Screen content layer — transparent so the Camera preview underneath shows through */}
      <Screen paddingX="lg" transparent>
        <View style={styles.header}>
          <Heading variant="display.md" color="inverse">
            {t('onboarding.faceCapture.title')}
          </Heading>
          <View style={styles.subtitleSpacer} />
          <Text variant="body.md" color="inverse">
            {t('onboarding.faceCapture.subtitle')}
          </Text>
        </View>

        <View style={styles.spacer} />

        <View style={styles.footer}>
          <Button
            label={t('onboarding.faceCapture.shutterButton')}
            variant="primary"
            onPress={() => { void handleCapture(); }}
            disabled={isCapturing}
            testID="shutter-button"
          />
        </View>
      </Screen>
    </View>
  );
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
  });
}
