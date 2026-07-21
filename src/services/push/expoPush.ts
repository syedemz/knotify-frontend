/**
 * Expo push notification registration.
 *
 * `registerForPushNotifications()` is the single public entry point.
 * It follows the three-step flow documented in the Expo push notifications
 * guide:
 *
 *  1. Check and request OS-level notification permission.
 *  2. Obtain the Expo push token (requires a physical device; simulators
 *     return `null` gracefully).
 *  3. POST the token to `/v1/push-tokens` via `httpClient`.
 *
 * The UI wiring (where to call this on first launch) lives in story 19.2
 * (settings phase). This file only exports the helper.
 *
 * @module services/push/expoPush
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { request } from '../api/httpClient';

// ── Internal helpers ──────────────────────────────────────────────────────

/**
 * Requests notification permission if not already granted.
 *
 * Returns `'granted'` if the user approved (or previously approved),
 * `'denied'` if the user declined, and `'undetermined'` if the OS prevents
 * requesting.
 *
 * @returns Permission status string.
 */
async function requestNotificationPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') {
    return 'granted';
  }

  const { status: requestedStatus } = await Notifications.requestPermissionsAsync();
  return requestedStatus === 'granted' ? 'granted' : 'denied';
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Shape of the push-token registration request body sent to the backend.
 */
interface RegisterPushTokenBody {
  /** Expo push token string (format: `ExponentPushToken[...]`). */
  token: string;
}

/**
 * Registers the device for Expo push notifications.
 *
 * Steps:
 * 1. Skips and returns `null` if running on a simulator (physical device
 *    required for push tokens).
 * 2. Requests notification permission. Returns `null` if the user declines.
 * 3. Fetches the Expo push token.
 * 4. POSTs the token to `POST /v1/push-tokens` via `httpClient`.
 * 5. Returns the token string so the caller can store or log it.
 *
 * The settings phase (story 19.2) is responsible for calling this at the
 * right time in the app lifecycle. Do not call it from feature code directly.
 *
 * @returns The registered Expo push token, or `null` if registration was
 *   skipped (simulator) or denied (user declined permission).
 * @throws {@link ApiError} If the POST to `/v1/push-tokens` fails.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push tokens are only available on physical devices.
  if (!Device.isDevice) {
    return null;
  }

  const permissionStatus = await requestNotificationPermission();
  if (permissionStatus !== 'granted') {
    return null;
  }

  const pushToken = await Notifications.getExpoPushTokenAsync();
  const tokenValue = pushToken.data;

  await request<void>({
    method: 'POST',
    path: '/v1/push-tokens',
    body: { token: tokenValue } satisfies RegisterPushTokenBody,
  });

  return tokenValue;
}
