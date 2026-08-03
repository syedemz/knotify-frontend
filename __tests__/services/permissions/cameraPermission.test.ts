/**
 * Unit tests for `requestCameraPermission` in src/services/permissions/index.ts
 * (story 11.1).
 *
 * Covers:
 * - The explicit `mapVisionCameraStatus` mapping table (four cases).
 * - Already-granted: returns `'granted'` without calling
 *   `requestCameraPermission()`.
 * - First-request-grant: `'not-determined'` → dialog → user grants.
 * - First-request-deny: `'not-determined'` → dialog → user denies.
 * - Permanent-deny via `'restricted'` (OS-level block, never re-prompts).
 * - Permanent-deny via subsequent `'denied'` calls (user has previously denied).
 */

// ── Module mocks ─────────────────────────────────────────────────────────────

const mockGetCameraPermissionStatus = jest.fn();
const mockRequestCameraPermission = jest.fn();

jest.mock('react-native-vision-camera', () => ({
  Camera: {
    getCameraPermissionStatus: (...args: unknown[]) =>
      mockGetCameraPermissionStatus(...args),
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

describe('mapVisionCameraStatus — mapping table', () => {
  it('given existing status "granted", then returns "granted" without calling requestCameraPermission', async () => {
    mockGetCameraPermissionStatus.mockReturnValue('granted');

    const result = await requestCameraPermission();

    expect(result).toBe('granted');
    expect(mockRequestCameraPermission).not.toHaveBeenCalled();
  });

  it('given existing status "denied", then returns "denied" without calling requestCameraPermission', async () => {
    mockGetCameraPermissionStatus.mockReturnValue('denied');

    const result = await requestCameraPermission();

    expect(result).toBe('denied');
    expect(mockRequestCameraPermission).not.toHaveBeenCalled();
  });

  it('given existing status "restricted" (OS block), then maps to "denied" without calling requestCameraPermission', async () => {
    mockGetCameraPermissionStatus.mockReturnValue('restricted');

    const result = await requestCameraPermission();

    expect(result).toBe('denied');
    expect(mockRequestCameraPermission).not.toHaveBeenCalled();
  });

  it('given existing status "not-determined" and request returns "granted", then maps to "granted"', async () => {
    mockGetCameraPermissionStatus.mockReturnValue('not-determined');
    mockRequestCameraPermission.mockResolvedValue('granted');

    const result = await requestCameraPermission();

    expect(result).toBe('granted');
    expect(mockRequestCameraPermission).toHaveBeenCalledTimes(1);
  });

  it('given existing status "not-determined" and request returns "denied", then maps to "denied"', async () => {
    mockGetCameraPermissionStatus.mockReturnValue('not-determined');
    mockRequestCameraPermission.mockResolvedValue('denied');

    const result = await requestCameraPermission();

    expect(result).toBe('denied');
    expect(mockRequestCameraPermission).toHaveBeenCalledTimes(1);
  });
});

// ── Already-granted (no re-prompt) ───────────────────────────────────────────

describe('requestCameraPermission — already-granted', () => {
  it('given permission is already granted, then returns "granted" without re-prompting', async () => {
    mockGetCameraPermissionStatus.mockReturnValue('granted');

    const result = await requestCameraPermission();

    expect(result).toBe('granted');
    expect(mockRequestCameraPermission).not.toHaveBeenCalled();
  });
});

// ── First-request-grant ───────────────────────────────────────────────────────

describe('requestCameraPermission — first-request-grant', () => {
  it('given OS not yet determined and user approves, then returns "granted"', async () => {
    mockGetCameraPermissionStatus.mockReturnValue('not-determined');
    mockRequestCameraPermission.mockResolvedValue('granted');

    const result = await requestCameraPermission();

    expect(result).toBe('granted');
    expect(mockRequestCameraPermission).toHaveBeenCalledTimes(1);
  });
});

// ── First-request-deny ────────────────────────────────────────────────────────

describe('requestCameraPermission — first-request-deny', () => {
  it('given OS not yet determined and user denies, then returns "denied"', async () => {
    mockGetCameraPermissionStatus.mockReturnValue('not-determined');
    mockRequestCameraPermission.mockResolvedValue('denied');

    const result = await requestCameraPermission();

    expect(result).toBe('denied');
    expect(mockRequestCameraPermission).toHaveBeenCalledTimes(1);
  });
});

// ── Permanent-deny via "restricted" ──────────────────────────────────────────

describe('requestCameraPermission — permanent-deny via restricted', () => {
  it('given OS status is "restricted", then returns "denied" without re-prompting', async () => {
    mockGetCameraPermissionStatus.mockReturnValue('restricted');

    const result = await requestCameraPermission();

    expect(result).toBe('denied');
    expect(mockRequestCameraPermission).not.toHaveBeenCalled();
  });
});

// ── Permanent-deny via subsequent denied calls ───────────────────────────────

describe('requestCameraPermission — permanent-deny via subsequent denied', () => {
  it('given OS status is "denied" on a subsequent call, then returns "denied" without re-prompting', async () => {
    // Simulates the state after the user has denied once; OS status is now 'denied'.
    mockGetCameraPermissionStatus.mockReturnValue('denied');

    const result = await requestCameraPermission();

    expect(result).toBe('denied');
    expect(mockRequestCameraPermission).not.toHaveBeenCalled();
  });
});
