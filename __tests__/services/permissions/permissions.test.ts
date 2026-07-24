/**
 * Unit tests for src/services/permissions/index.ts (story 5.3).
 *
 * Covers:
 * - `requestNotificationPermission`: happy-path grant, deny path, and
 *   pre-granted-already-returns-granted-without-request.
 * - `requestLocationPermission`: happy-path grant, deny path, and
 *   pre-granted-already-returns-granted-without-request.
 * - `canAskAgain: false` → returns `'denied'` without calling
 *   `requestPermissionsAsync`.
 */

// ── Module mocks ─────────────────────────────────────────────────────────────

const mockGetNotifPermissions = jest.fn();
const mockRequestNotifPermissions = jest.fn();
const mockGetLocationPermissions = jest.fn();
const mockRequestLocationPermissions = jest.fn();

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: (...args: unknown[]) => mockGetNotifPermissions(...args),
  requestPermissionsAsync: (...args: unknown[]) => mockRequestNotifPermissions(...args),
}));

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: (...args: unknown[]) => mockGetLocationPermissions(...args),
  requestForegroundPermissionsAsync: (...args: unknown[]) => mockRequestLocationPermissions(...args),
}));

// ── Imports under test ────────────────────────────────────────────────────────

import {
  requestNotificationPermission,
  requestLocationPermission,
} from '@/services/permissions';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePermResult(status: string, canAskAgain = true) {
  return { status, canAskAgain };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// ── requestNotificationPermission ────────────────────────────────────────────

describe('requestNotificationPermission — happy path (granted)', () => {
  it('given OS not yet granted and user approves, then returns granted', async () => {
    mockGetNotifPermissions.mockResolvedValue(makePermResult('undetermined'));
    mockRequestNotifPermissions.mockResolvedValue(makePermResult('granted'));

    const result = await requestNotificationPermission();

    expect(result).toBe('granted');
    expect(mockRequestNotifPermissions).toHaveBeenCalledTimes(1);
  });
});

describe('requestNotificationPermission — deny path', () => {
  it('given OS not yet granted and user denies, then returns denied', async () => {
    mockGetNotifPermissions.mockResolvedValue(makePermResult('undetermined'));
    mockRequestNotifPermissions.mockResolvedValue(makePermResult('denied'));

    const result = await requestNotificationPermission();

    expect(result).toBe('denied');
    expect(mockRequestNotifPermissions).toHaveBeenCalledTimes(1);
  });
});

describe('requestNotificationPermission — pre-granted (no re-prompt)', () => {
  it('given permission is already granted, then returns granted without calling requestPermissionsAsync', async () => {
    mockGetNotifPermissions.mockResolvedValue(makePermResult('granted'));

    const result = await requestNotificationPermission();

    expect(result).toBe('granted');
    expect(mockRequestNotifPermissions).not.toHaveBeenCalled();
  });
});

describe('requestNotificationPermission — canAskAgain false', () => {
  it('given canAskAgain is false (OS-blocked), then returns denied without calling requestPermissionsAsync', async () => {
    mockGetNotifPermissions.mockResolvedValue(makePermResult('denied', false));

    const result = await requestNotificationPermission();

    expect(result).toBe('denied');
    expect(mockRequestNotifPermissions).not.toHaveBeenCalled();
  });
});

// ── requestLocationPermission ────────────────────────────────────────────────

describe('requestLocationPermission — happy path (granted)', () => {
  it('given OS not yet granted and user approves, then returns granted', async () => {
    mockGetLocationPermissions.mockResolvedValue(makePermResult('undetermined'));
    mockRequestLocationPermissions.mockResolvedValue(makePermResult('granted'));

    const result = await requestLocationPermission();

    expect(result).toBe('granted');
    expect(mockRequestLocationPermissions).toHaveBeenCalledTimes(1);
  });
});

describe('requestLocationPermission — deny path', () => {
  it('given OS not yet granted and user denies, then returns denied', async () => {
    mockGetLocationPermissions.mockResolvedValue(makePermResult('undetermined'));
    mockRequestLocationPermissions.mockResolvedValue(makePermResult('denied'));

    const result = await requestLocationPermission();

    expect(result).toBe('denied');
    expect(mockRequestLocationPermissions).toHaveBeenCalledTimes(1);
  });
});

describe('requestLocationPermission — pre-granted (no re-prompt)', () => {
  it('given permission is already granted, then returns granted without calling requestForegroundPermissionsAsync', async () => {
    mockGetLocationPermissions.mockResolvedValue(makePermResult('granted'));

    const result = await requestLocationPermission();

    expect(result).toBe('granted');
    expect(mockRequestLocationPermissions).not.toHaveBeenCalled();
  });
});

describe('requestLocationPermission — canAskAgain false', () => {
  it('given canAskAgain is false (OS-blocked), then returns denied without calling requestForegroundPermissionsAsync', async () => {
    mockGetLocationPermissions.mockResolvedValue(makePermResult('denied', false));

    const result = await requestLocationPermission();

    expect(result).toBe('denied');
    expect(mockRequestLocationPermissions).not.toHaveBeenCalled();
  });
});
