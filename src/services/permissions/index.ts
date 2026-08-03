/**
 * Centralised permission helpers for Knotify.
 *
 * Both helpers return a narrow `'granted' | 'denied' | 'undetermined'` union
 * so callers never need to inspect the raw Expo permission object. No screen
 * may import `expo-notifications` or `expo-location` directly — all permission
 * calls go through this module.
 *
 * @module services/permissions
 */

import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

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
