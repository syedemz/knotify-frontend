/**
 * FaceOvalOverlay — feature-local component for Page 31.
 *
 * Renders a translucent full-screen overlay with a transparent oval cut-out
 * in the centre, guiding the user to position their face. The oval is drawn
 * using `View` borders and `borderRadius` so it works without `react-native-svg`.
 *
 * The component is intentionally simple: no animation, no camera interaction.
 * The camera preview underneath is visible through the transparent oval area.
 *
 * @module features/onboarding/components/FaceOvalOverlay
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import type { Theme } from '@/theme/theme';

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Full-screen overlay with an oval cut-out for face positioning guidance.
 *
 * Rendered on top of the camera preview in `Page31FaceCaptureScreen`.
 * The oval area is transparent; the surrounding area is semi-opaque dark.
 *
 * This component carries no interactive props — it is purely presentational.
 */
export function FaceOvalOverlay(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View
      style={styles.overlay}
      pointerEvents="none"
      testID="face-oval-overlay"
    >
      <View style={styles.oval} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme) {
  const OVAL_WIDTH = 240;
  const OVAL_HEIGHT = 300;

  return StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.bg.overlay,
    },
    oval: {
      width: OVAL_WIDTH,
      height: OVAL_HEIGHT,
      borderRadius: OVAL_WIDTH / 2,
      // Transparent centre — the camera preview shows through here.
      backgroundColor: 'transparent',
      borderWidth: 3,
      borderColor: theme.colors.accent.primary,
    },
  });
}
