/**
 * Page 28 — Profile photos.
 *
 * Renders a 6-tile flex-wrap grid. Each tile is a `PhotoTile` component:
 * - Empty tile: tap requests media library permission, then opens the image
 *   picker on grant. On permission denied the tile shows a "grant photos
 *   access" hint and the Continue button stays disabled until at least one
 *   tile is filled via another route.
 * - Filled tile: shows the selected image, a remove "×" badge (top-right),
 *   and tapping the tile body re-opens the picker for replacement.
 *
 * Draft field: `photoPreviewUris: string[]` — already present in schema v2,
 * no schema bump required for this story.
 *
 * **Continue label:**
 * - 0 URIs → "Add photos" label, button disabled.
 * - ≥ 1 URI → "Continue" label, button enabled; tap advances to Page29.
 *
 * **Known limitation (v1):** Local URIs on Android are `content://` URIs
 * that may not survive a cold app restart until the backend photo upload
 * pipeline is implemented (§17.14).
 *
 * @module features/onboarding/screens/Page28PhotosScreen
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Heading, Screen, Text, WizardFooter, WizardHeader } from '@/components';
import { t } from '@/labels';
import { requestMediaLibraryPermission } from '@/services/permissions';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/theme';
import { useOnboardingDraft } from '../hooks/useOnboardingDraft';
import { PhotoTile } from '../components/PhotoTile';
import type { OnboardingStackParamList } from '@/navigation/types';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Total number of photo tiles to render in the grid. */
const TILE_COUNT = 6;

/** Size of each tile in logical pixels. 3 tiles per row on standard widths. */
const TILE_SIZE = 108;

/** Image picker options per AC. */
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: 'images' as ImagePicker.MediaType,
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
};

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page28PhotosScreen'>;

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Onboarding page 28: photo grid (6 tiles, image picker, media permission).
 *
 * Photos are stored as local device URIs in `onboardingDraft.photoPreviewUris`.
 * They are NOT uploaded to the backend in v1 (§17.14).
 */
export function Page28PhotosScreen({ navigation }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { getDraft, advance, setPhotoPreviewUris } = useOnboardingDraft();

  // ── Local state ──────────────────────────────────────────────────────────────

  /**
   * The current list of photo URIs, mirroring `draft.photoPreviewUris`.
   * Kept in component state for instant UI updates; synchronised to the draft
   * on every change via `writeUris`.
   */
  const [uris, setUris] = useState<string[]>([]);

  /**
   * Whether media library permission has been explicitly denied by the user.
   * `false` until the first `requestMediaLibraryPermission()` call returns
   * `'denied'`.
   */
  const [permissionDenied, setPermissionDenied] = useState(false);

  // ── Mount-time rehydration ───────────────────────────────────────────────────

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const draft = getDraft();
    if (draft.photoPreviewUris.length > 0) {
      setUris(draft.photoPreviewUris);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Draft writer ─────────────────────────────────────────────────────────────

  /**
   * Writes `nextUris` to both component state and the draft.
   *
   * @param nextUris - The updated URI array after an add, replace, or remove.
   */
  const writeUris = useCallback(
    (nextUris: string[]): void => {
      setUris(nextUris);
      setPhotoPreviewUris(nextUris);
    },
    [setPhotoPreviewUris],
  );

  // ── Picker logic ─────────────────────────────────────────────────────────────

  /**
   * Opens the image picker and returns the selected asset's local URI,
   * or `null` if the user cancelled.
   */
  const openPicker = useCallback(async (): Promise<string | null> => {
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (result.canceled) {
      return null;
    }
    const asset = result.assets[0];
    return asset?.uri ?? null;
  }, []);

  // ── Tile press handlers ───────────────────────────────────────────────────────

  /**
   * Handles a press on a tile body (empty or filled).
   *
   * For an **empty** tile (`index ≥ uris.length`):
   * 1. Requests media library permission.
   * 2. On `'denied'`, sets `permissionDenied = true` and returns.
   * 3. On `'granted'`, opens the picker; appends the URI on a valid selection.
   *
   * For a **filled** tile (`index < uris.length`):
   * 1. Opens the picker directly (permission was already granted earlier).
   * 2. On a valid selection, replaces the URI at that index in-place.
   *
   * When the picker returns `canceled === true` (user dismissed without
   * selecting), the tile stays unchanged and nothing is written to the draft.
   *
   * @param index - 0-based tile index.
   */
  const handleTilePress = useCallback(
    async (index: number): Promise<void> => {
      const snapshot = uris;
      const isFilled = index < snapshot.length;

      if (!isFilled) {
        const status = await requestMediaLibraryPermission();
        if (status === 'denied') {
          setPermissionDenied(true);
          return;
        }
        if (status !== 'granted') {
          return;
        }
      }

      const uri = await openPicker();
      if (uri === null) {
        // User cancelled — leave tile unchanged.
        return;
      }

      const nextUris = [...snapshot];
      if (isFilled) {
        nextUris[index] = uri;
      } else {
        nextUris.push(uri);
      }

      writeUris(nextUris);
    },
    [uris, openPicker, writeUris],
  );

  /**
   * Handles a tap on the "×" remove badge.
   *
   * Splices the URI at `index` out of the array; the tile reverts to empty.
   *
   * @param index - 0-based tile index to remove.
   */
  const handleRemove = useCallback(
    (index: number): void => {
      const nextUris = [...uris];
      nextUris.splice(index, 1);
      writeUris(nextUris);
    },
    [uris, writeUris],
  );

  // ── Continue handler ─────────────────────────────────────────────────────────

  const handleContinue = useCallback((): void => {
    advance(29);
    navigation.navigate('Page29PhoneScreen');
  }, [advance, navigation]);

  // ── Derived values ───────────────────────────────────────────────────────────

  const hasPhoto = uris.length > 0;

  const continueLabel = hasPhoto
    ? t('onboarding.photos.continueLabel')
    : t('onboarding.photos.addPhotosLabel');

  /** Array of 6 URI-or-undefined values, one per tile position. */
  const tileUris = useMemo(
    (): (string | undefined)[] =>
      Array.from({ length: TILE_COUNT }, (_, i) => uris[i]),
    [uris],
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Screen paddingX="lg">
      <WizardHeader currentPage={28} onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <Heading variant="display.md" color="primary">
          {t('onboarding.photos.title')}
        </Heading>

        <View style={styles.subtitleSpacer} />

        <Text variant="body.md" color="secondary">
          {t('onboarding.photos.subtitle')}
        </Text>

        <View style={styles.grid}>
          {tileUris.map((uri, index) => (
            <PhotoTile
              key={index}
              uri={uri}
              index={index + 1}
              size={TILE_SIZE}
              onPress={() => { void handleTilePress(index); }}
              onRemove={() => handleRemove(index)}
              permissionDenied={permissionDenied && uri === undefined}
            />
          ))}
        </View>
      </ScrollView>

      <WizardFooter
        onContinue={handleContinue}
        disabled={!hasPhoto}
        continueLabel={continueLabel}
      />
    </Screen>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    subtitleSpacer: {
      height: theme.spacing.sm,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xxl,
      marginBottom: theme.spacing.lg,
    },
  });
}
