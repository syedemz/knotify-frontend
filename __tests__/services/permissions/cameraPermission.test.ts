/**
 * Unit tests for `requestCameraPermission` in src/services/permissions/index.ts
 * (story 11.1).
 *
 * The helper always calls `Camera.requestCameraPermission()` — no pre-check
 * via `getCameraPermissionStatus()`. This is intentional: on Android, the raw
 * status returns `'denied'` on a fresh install (never asked), so pre-checking
 * would skip the system dialog. `requestCameraPermission()` itself is the
 * source of truth and handles every case (granted / never-asked / permanent-
 * deny) correctly.
 *
 * Covers the explicit `mapVisionCameraStatus` mapping table (four raw
 * statuses → `PermissionStatus`).
 */

// ── Module mocks ─────────────────────────────────────────────────────────────

const mockRequestCameraPermission = jest.fn();

jest.mock('react-native-vision-camera', () => ({
  Camera: {
    requestCameraPermission: (...args: unknown[]) =>
      mockRequestCameraPermission(...args),
  },
}));

// ── Imports under test ────────────────────────────────────────────────────────

import { requestCameraPermission } from '@/services/permissions';

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Mapping table tests ───────────────────────────────────────────────────────

describe('requestCameraPermission — mapping table', () => {
  it('given request returns "granted", then returns "granted"', async () => {
    mockRequestCameraPermission.mockResolvedValue('granted');

    const result = await requestCameraPermission();

    expect(result).toBe('granted');
    expect(mockRequestCameraPermission).toHaveBeenCalledTimes(1);
  });

  it('given request returns "denied", then returns "denied"', async () => {
    mockRequestCameraPermission.mockResolvedValue('denied');

    const result = await requestCameraPermission();

    expect(result).toBe('denied');
    expect(mockRequestCameraPermission).toHaveBeenCalledTimes(1);
  });

  it('given request returns "restricted" (OS block), then maps to "denied"', async () => {
    mockRequestCameraPermission.mockResolvedValue('restricted');

    const result = await requestCameraPermission();

    expect(result).toBe('denied');
    expect(mockRequestCameraPermission).toHaveBeenCalledTimes(1);
  });

  it('given request returns "not-determined" (edge case), then maps to "undetermined"', async () => {
    mockRequestCameraPermission.mockResolvedValue('not-determined');

    const result = await requestCameraPermission();

    expect(result).toBe('undetermined');
    expect(mockRequestCameraPermission).toHaveBeenCalledTimes(1);
  });
});
