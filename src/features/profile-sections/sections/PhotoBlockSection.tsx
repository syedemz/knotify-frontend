/**
 * PhotoBlockSection — mid-scroll full-bleed photo.
 *
 * Field bindings:
 * - `photos[1]` — renders if `photos.length >= 2`; hides otherwise.
 *
 * @module features/profile-sections/sections/PhotoBlockSection
 */

import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

import type { UserProfile } from '@/types/api/UserProfile';
import type { DummyOverlay } from '@/types/DummyOverlay';
import { resolveDummyPhoto } from '@/assets/dummyPhotoRegistry';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PhotoBlockSectionProps {
  readonly profile: UserProfile & DummyOverlay;
}

// ── Component ─────────────────────────────────────────────────────────────────

const BLOCK_HEIGHT = Dimensions.get('window').height * 0.5;

export function PhotoBlockSection({
  profile,
}: PhotoBlockSectionProps): React.ReactElement | null {
  const photos = profile.photos;

  if (photos === undefined || photos.length < 2) {
    return null;
  }

  const photoSource = resolveDummyPhoto(photos[1]);
  if (photoSource === undefined) {
    return null;
  }

  return (
    <View style={styles.container} testID="photo-block-section">
      <ExpoImage
        source={photoSource}
        style={styles.image}
        contentFit="cover"
        accessibilityLabel="Profile photo"
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: BLOCK_HEIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
