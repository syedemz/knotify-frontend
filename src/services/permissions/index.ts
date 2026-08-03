/**
 * Centralised permission helpers for Knotify.
 *
 * All helpers return a narrow `'granted' | 'denied' | 'undetermined'` union
 * so callers never need to inspect raw platform permission objects. No screen
 * may import `expo-notifications`, `expo-location`, `expo-image-picker`, or
 * `react-native-vision-camera` directly for permission purposes — all
 * permission calls go through this module.
 *
 * @module services/permissions
 */

import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'react-native-vision-camera';
import type { CameraPermissionStatus as VisionCameraPermissionStatus } from 'react-native-vision-camera';

/** The three terminal permission outcomes Knotify tracks. */
export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

/**
 * Requests OS-level notification permission if it has not already been
 * determined.
 *
 * - If permission is already `'granted'`, returns `'granted'` immediately
 *   without re-prompting.
 * - If the OS disallows re-requesting (`canAskAgain === false`), returns
 *   `'denied'` immediately without re-prompting.
 * - Otherwise, shows the system dialog and returns the user's answer.
 *
 * @returns `'granted'` if the user approved (or had already approved),
 *   `'denied'` if the user declined (or the OS prevents asking again),
 *   `'undetermined'` only if the OS returned an unexpected status.
 */
export async function requestNotificationPermission(): Promise<PermissionStatus> {
  const { status: existingStatus, canAskAgain } =
    await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') {
    return 'granted';
  }

  if (!canAskAgain) {
    return 'denied';
  }

  const { status: requestedStatus } =
    await Notifications.requestPermissionsAsync();

  return requestedStatus === 'granted' ? 'granted' : 'denied';
}

/**
 * Requests OS-level foreground ("when in use") location permission if it has
 * not already been determined.
 *
 * - If permission is already `'granted'`, returns `'granted'` immediately
 *   without re-prompting.
 * - If the OS disallows re-requesting (`canAskAgain === false`), returns
 *   `'denied'` immediately without re-prompting.
 * - Otherwise, shows the system dialog and returns the user's answer.
 *
 * @returns `'granted'` if the user approved (or had already approved),
 *   `'denied'` if the user declined (or the OS prevents asking again),
 *   `'undetermined'` only if the OS returned an unexpected status.
 */
export async function requestLocationPermission(): Promise<PermissionStatus> {
  const { status: existingStatus, canAskAgain } =
    await Location.getForegroundPermissionsAsync();

  if (existingStatus === 'granted') {
    return 'granted';
  }

  if (!canAskAgain) {
    return 'denied';
  }

  const { status: requestedStatus } =
    await Location.requestForegroundPermissionsAsync();

  return requestedStatus === 'granted' ? 'granted' : 'denied';
}

/**
 * Requests OS-level media library (photos) permission if it has not already
 * been determined.
 *
 * - If permission is already `'granted'`, returns `'granted'` immediately
 *   without re-prompting.
 * - If the OS disallows re-requesting (`canAskAgain === false`), returns
 *   `'denied'` immediately without re-prompting.
 * - Otherwise, shows the system dialog and returns the user's answer.
 *
 * @returns `'granted'` if the user approved (or had already approved),
 *   `'denied'` if the user declined (or the OS prevents asking again),
 *   `'undetermined'` only if the OS returned an unexpected status.
 */
export async function requestMediaLibraryPermission(): Promise<PermissionStatus> {
  const { status: existingStatus, canAskAgain } =
    await ImagePicker.getMediaLibraryPermissionsAsync();

  if (existingStatus === 'granted') {
    return 'granted';
  }

  if (!canAskAgain) {
    return 'denied';
  }

  const { status: requestedStatus } =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  return requestedStatus === 'granted' ? 'granted' : 'denied';
}

// ── Camera permission ──────────────────────────────────────────────────────────

/**
 * Maps a `react-native-vision-camera` raw permission string to the Knotify
 * `PermissionStatus` union.
 *
 * Mapping table (explicit — do not collapse into a default branch):
 * - `'granted'`        → `'granted'`
 * - `'denied'`         → `'denied'`
 * - `'not-determined'` → `'undetermined'`
 * - `'restricted'`     → `'denied'`  (OS-level block; treat as permanent deny)
 *
 * @param raw - The raw `CameraPermissionStatus` from vision-camera.
 * @returns The mapped {@link PermissionStatus}.
 */
function mapVisionCameraStatus(raw: VisionCameraPermissionStatus): PermissionStatus {
  switch (raw) {
    case 'granted':
      return 'granted';
    case 'denied':
      return 'denied';
    case 'not-determined':
      return 'undetermined';
    case 'restricted':
      return 'denied';
  }
}

/**
 * Requests OS-level camera permission via `react-native-vision-camera`.
 *
 * We always call `Camera.requestCameraPermission()` rather than pre-checking
 * with `getCameraPermissionStatus()`. On Android, the raw status returns
 * `'denied'` on a fresh install (never asked) because Android's
 * `checkSelfPermission()` cannot distinguish "never asked" from "user denied"
 * — only iOS reports `'not-determined'` for a fresh install. Pre-checking
 * therefore skips the system dialog on Android's first-launch case.
 *
 * `Camera.requestCameraPermission()` itself handles every case correctly:
 * - Already granted → returns `'granted'` (no dialog).
 * - Never asked (or soft-deny with `canAskAgain`) → shows system dialog.
 * - Permanently denied ("don't ask again", or OS-restricted) → returns
 *   `'denied'` immediately without a dialog.
 *
 * Callers that need the two-stage "retry vs open settings" UX escalate on
 * their own by counting consecutive `'denied'` results (see Page 30).
 *
 * Raw vision-camera statuses are mapped via `mapVisionCameraStatus`:
 * `'granted' → 'granted'`, `'denied' → 'denied'`,
 * `'not-determined' → 'undetermined'`, `'restricted' → 'denied'`.
 *
 * @returns `'granted'` if the user approved (or had already approved),
 *   `'denied'` if the user declined, the OS prevents asking, or the OS
 *   restricts the app, `'undetermined'` only in an unexpected edge case.
 */
export async function requestCameraPermission(): Promise<PermissionStatus> {
  const requestedRaw = await Camera.requestCameraPermission();
  return mapVisionCameraStatus(requestedRaw);
}
