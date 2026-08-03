/**
 * Tests for src/features/onboarding/hooks/useOnboardingDraft.ts
 *
 * Verifies:
 * - Debounced write behavior (trailing-edge, 200 ms)
 * - Checkpoint non-regression on back-navigation
 * - getDraft() returns current state
 * - advance() and update() mutate the draft correctly
 * - reset() clears the draft
 */

import { renderHook, act } from '@testing-library/react-native';
import {
  OnboardingDraftProvider,
  useOnboardingDraft,
} from '@/features/onboarding/hooks/useOnboardingDraft';
import { secureStorage } from '@/services/auth/secureStorage';

// ── Mock expo-secure-store via the secureStorage facade ─────────────────────
jest.mock('@/services/auth/secureStorage', () => ({
  secureStorage: {
    getOnboardingDraft: jest.fn(),
    setOnboardingDraft: jest.fn(),
    clearOnboardingDraft: jest.fn(),
  },
}));

const mockSecureStorage = secureStorage as jest.Mocked<typeof secureStorage>;

// ── Jest fake timers for debounce control ───────────────────────────────────
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  // Default: no stored draft
  mockSecureStorage.getOnboardingDraft.mockResolvedValue(null);
  mockSecureStorage.setOnboardingDraft.mockResolvedValue(undefined);
  mockSecureStorage.clearOnboardingDraft.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// ── Helpers ──────────────────────────────────────────────────────────────────

async function renderDraftHook() {
  const result = renderHook(() => useOnboardingDraft(), {
    wrapper: OnboardingDraftProvider,
  });
  // Let the initial load settle
  await act(async () => {
    await Promise.resolve();
  });
  return result;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useOnboardingDraft — initial load', () => {
  it('starts with isLoading=true then settles to false', async () => {
    let resolveLoad!: (v: string | null) => void;
    mockSecureStorage.getOnboardingDraft.mockReturnValue(
      new Promise<string | null>((res) => {
        resolveLoad = res;
      }),
    );

    const { result } = renderHook(() => useOnboardingDraft(), {
      wrapper: OnboardingDraftProvider,
    });
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveLoad(null);
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('loads a previously persisted draft from secure-store', async () => {
    const stored = JSON.stringify({
      schemaVersion: 3,
      lastCheckpoint: 'firstCheckpoint',
      currentPage: 9,
      fields: { email: 'test@example.com' },
      siblings: [],
      photoPreviewUris: [],
      notificationPermissionStatus: null,
      locationPermissionStatus: null,
      phone_number: null,
      timestamps: { createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
    });
    mockSecureStorage.getOnboardingDraft.mockResolvedValue(stored);

    const { result } = await renderDraftHook();

    const draft = result.current.getDraft();
    expect(draft.lastCheckpoint).toBe('firstCheckpoint');
    expect(draft.currentPage).toBe(9);
    expect(draft.fields.email).toBe('test@example.com');
  });

  it('falls back to an empty draft when stored JSON is corrupted', async () => {
    mockSecureStorage.getOnboardingDraft.mockResolvedValue('{invalid json{{');

    const { result } = await renderDraftHook();

    const draft = result.current.getDraft();
    expect(draft.schemaVersion).toBe(3);
    expect(draft.currentPage).toBe(1);
    expect(draft.lastCheckpoint).toBeNull();
  });
});

describe('useOnboardingDraft — schemaVersion discard policy', () => {
  it('given a v1 draft on disk, then it is discarded and a fresh empty draft is returned', async () => {
    const v1Draft = JSON.stringify({
      schemaVersion: 1,
      lastCheckpoint: 'secondCheckpoint',
      currentPage: 18,
      fields: { first_name: 'OldUser' },
      siblings: [],
      photoPreviewUris: [],
      notificationPermissionStatus: null,
      locationPermissionStatus: null,
      timestamps: { createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
    });
    mockSecureStorage.getOnboardingDraft.mockResolvedValue(v1Draft);

    const { result } = await renderDraftHook();

    const draft = result.current.getDraft();
    // Must be a fresh empty draft — the v1 data is discarded
    expect(draft.schemaVersion).toBe(3);
    expect(draft.currentPage).toBe(1);
    expect(draft.lastCheckpoint).toBeNull();
    expect(draft.fields).toEqual({});
  });

  it('given a v2 draft on disk, then it is discarded and a fresh empty draft is returned', async () => {
    const v2Draft = JSON.stringify({
      schemaVersion: 2,
      lastCheckpoint: 'secondCheckpoint',
      currentPage: 18,
      fields: { first_name: 'OldUser' },
      siblings: [],
      photoPreviewUris: [],
      notificationPermissionStatus: null,
      locationPermissionStatus: null,
      timestamps: { createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
    });
    mockSecureStorage.getOnboardingDraft.mockResolvedValue(v2Draft);

    const { result } = await renderDraftHook();

    const draft = result.current.getDraft();
    // Must be a fresh empty draft — v2 is discarded in favour of v3
    expect(draft.schemaVersion).toBe(3);
    expect(draft.currentPage).toBe(1);
    expect(draft.lastCheckpoint).toBeNull();
    expect(draft.fields).toEqual({});
  });

  it('given a v3 draft on disk, then it is loaded as-is', async () => {
    const v3Draft = JSON.stringify({
      schemaVersion: 3,
      lastCheckpoint: 'secondCheckpoint',
      currentPage: 18,
      fields: { first_name: 'CurrentUser' },
      siblings: [],
      photoPreviewUris: [],
      notificationPermissionStatus: null,
      locationPermissionStatus: null,
      phone_number: null,
      timestamps: { createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
    });
    mockSecureStorage.getOnboardingDraft.mockResolvedValue(v3Draft);

    const { result } = await renderDraftHook();

    const draft = result.current.getDraft();
    expect(draft.schemaVersion).toBe(3);
    expect(draft.currentPage).toBe(18);
    expect(draft.lastCheckpoint).toBe('secondCheckpoint');
    expect(draft.fields.first_name).toBe('CurrentUser');
  });

  it('given a missing draft (null from secure-store), then a fresh empty draft is returned', async () => {
    mockSecureStorage.getOnboardingDraft.mockResolvedValue(null);

    const { result } = await renderDraftHook();

    const draft = result.current.getDraft();
    expect(draft.schemaVersion).toBe(3);
    expect(draft.currentPage).toBe(1);
    expect(draft.lastCheckpoint).toBeNull();
    expect(draft.fields).toEqual({});
  });

  it('given a corrupt draft (unparseable JSON), then a fresh empty draft is returned', async () => {
    mockSecureStorage.getOnboardingDraft.mockResolvedValue('{not: valid json}');

    const { result } = await renderDraftHook();

    const draft = result.current.getDraft();
    expect(draft.schemaVersion).toBe(3);
    expect(draft.currentPage).toBe(1);
    expect(draft.lastCheckpoint).toBeNull();
  });
});

describe('useOnboardingDraft — update()', () => {
  it('merges partial fields into the draft', async () => {
    const { result } = await renderDraftHook();

    act(() => {
      result.current.update({ email: 'user@example.com' });
    });

    expect(result.current.getDraft().fields.email).toBe('user@example.com');
  });

  it('accumulates multiple update() calls without losing prior fields', async () => {
    const { result } = await renderDraftHook();

    act(() => {
      result.current.update({ email: 'user@example.com' });
    });
    act(() => {
      result.current.update({ first_name: 'Fatima' });
    });

    const draft = result.current.getDraft();
    expect(draft.fields.email).toBe('user@example.com');
    expect(draft.fields.first_name).toBe('Fatima');
  });
});

describe('useOnboardingDraft — advance()', () => {
  it('updates currentPage', async () => {
    const { result } = await renderDraftHook();

    act(() => {
      result.current.advance(5);
    });

    expect(result.current.getDraft().currentPage).toBe(5);
  });
});

describe('useOnboardingDraft — debounced write (trailing-edge, 200 ms)', () => {
  it('does NOT write to secure-store immediately on update()', async () => {
    const { result } = await renderDraftHook();

    act(() => {
      result.current.update({ email: 'user@example.com' });
    });

    // No write yet
    expect(mockSecureStorage.setOnboardingDraft).not.toHaveBeenCalled();
  });

  it('writes to secure-store after 200 ms (trailing-edge)', async () => {
    const { result } = await renderDraftHook();

    act(() => {
      result.current.update({ email: 'user@example.com' });
    });

    // Still no write before 200 ms
    act(() => {
      jest.advanceTimersByTime(199);
    });
    expect(mockSecureStorage.setOnboardingDraft).not.toHaveBeenCalled();

    // Write fires at 200 ms
    await act(async () => {
      jest.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(mockSecureStorage.setOnboardingDraft).toHaveBeenCalledTimes(1);
  });

  it('batches multiple rapid updates into a single write (trailing-edge)', async () => {
    const { result } = await renderDraftHook();

    act(() => {
      result.current.update({ email: 'a@example.com' });
    });
    act(() => {
      // 50 ms later — still within the 200 ms window
      jest.advanceTimersByTime(50);
      result.current.update({ first_name: 'Ali' });
    });
    act(() => {
      // Another 50 ms — still within debounce
      jest.advanceTimersByTime(50);
      result.current.update({ last_name: 'Khan' });
    });

    // Still no write at 100 ms total
    expect(mockSecureStorage.setOnboardingDraft).not.toHaveBeenCalled();

    // Fire the trailing edge (200 ms from last update = 150 ms more)
    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve();
    });

    // Exactly one write, containing all three fields
    expect(mockSecureStorage.setOnboardingDraft).toHaveBeenCalledTimes(1);
    // Non-null assertion: we just confirmed toHaveBeenCalledTimes(1) above
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const writtenJson = mockSecureStorage.setOnboardingDraft.mock.calls[0]![0]!;
    const written = JSON.parse(writtenJson);
    expect(written.fields.email).toBe('a@example.com');
    expect(written.fields.first_name).toBe('Ali');
    expect(written.fields.last_name).toBe('Khan');
  });

  it('resets the 200 ms timer on each update (debounce behavior)', async () => {
    const { result } = await renderDraftHook();

    act(() => {
      result.current.update({ email: 'first@example.com' });
    });
    // 150 ms passes — inside window
    act(() => {
      jest.advanceTimersByTime(150);
    });
    // A new update resets the timer
    act(() => {
      result.current.update({ email: 'second@example.com' });
    });
    // 150 ms more (300 ms total from first update) — but only 150 ms from second
    act(() => {
      jest.advanceTimersByTime(150);
    });
    // Should NOT have written yet — the timer was reset by the second update
    expect(mockSecureStorage.setOnboardingDraft).not.toHaveBeenCalled();

    // 50 ms more (200 ms from second update) — write fires
    await act(async () => {
      jest.advanceTimersByTime(50);
      await Promise.resolve();
    });
    expect(mockSecureStorage.setOnboardingDraft).toHaveBeenCalledTimes(1);
    // Non-null assertion: we just confirmed toHaveBeenCalledTimes(1) above
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const written = JSON.parse(
      mockSecureStorage.setOnboardingDraft.mock.calls[0]![0]!,
    );
    expect(written.fields.email).toBe('second@example.com');
  });
});

describe('useOnboardingDraft — checkpoint non-regression', () => {
  it('sets firstCheckpoint when advancing from null', async () => {
    const { result } = await renderDraftHook();

    act(() => {
      result.current.advanceWithCheckpoint(9, 'firstCheckpoint');
    });

    expect(result.current.getDraft().lastCheckpoint).toBe('firstCheckpoint');
  });

  it('advances from firstCheckpoint to secondCheckpoint', async () => {
    const { result } = await renderDraftHook();

    act(() => {
      result.current.advanceWithCheckpoint(9, 'firstCheckpoint');
    });
    act(() => {
      result.current.advanceWithCheckpoint(15, 'secondCheckpoint');
    });

    expect(result.current.getDraft().lastCheckpoint).toBe('secondCheckpoint');
  });

  it('does NOT regress secondCheckpoint to firstCheckpoint on back-navigation', async () => {
    const { result } = await renderDraftHook();

    act(() => {
      result.current.advanceWithCheckpoint(15, 'secondCheckpoint');
    });
    // Simulates a back-navigation calling advanceWithCheckpoint with firstCheckpoint
    act(() => {
      result.current.advanceWithCheckpoint(8, 'firstCheckpoint');
    });

    expect(result.current.getDraft().lastCheckpoint).toBe('secondCheckpoint');
  });

  it('does NOT regress firstCheckpoint to null on back-navigation', async () => {
    const { result } = await renderDraftHook();

    act(() => {
      result.current.advanceWithCheckpoint(9, 'firstCheckpoint');
    });
    // Simulates going back to page 1 without a checkpoint
    act(() => {
      result.current.advanceWithCheckpoint(1, null);
    });

    expect(result.current.getDraft().lastCheckpoint).toBe('firstCheckpoint');
  });

  it('does NOT regress secondCheckpoint to null', async () => {
    const { result } = await renderDraftHook();

    act(() => {
      result.current.advanceWithCheckpoint(15, 'secondCheckpoint');
    });
    act(() => {
      result.current.advanceWithCheckpoint(1, null);
    });

    expect(result.current.getDraft().lastCheckpoint).toBe('secondCheckpoint');
  });

  it('a plain advance() does not affect lastCheckpoint', async () => {
    const { result } = await renderDraftHook();

    act(() => {
      result.current.advanceWithCheckpoint(9, 'firstCheckpoint');
    });
    act(() => {
      result.current.advance(8); // back navigation without checkpoint param
    });

    expect(result.current.getDraft().lastCheckpoint).toBe('firstCheckpoint');
  });
});

describe('useOnboardingDraft — reset()', () => {
  it('clears the in-memory draft to defaults', async () => {
    const { result } = await renderDraftHook();

    act(() => {
      result.current.update({ email: 'user@example.com' });
      result.current.advance(5);
    });
    act(() => {
      result.current.reset();
    });

    const draft = result.current.getDraft();
    expect(draft.currentPage).toBe(1);
    expect(draft.lastCheckpoint).toBeNull();
    expect(draft.fields).toEqual({});
  });

  it('calls clearOnboardingDraft on secureStorage', async () => {
    const { result } = await renderDraftHook();

    await act(async () => {
      result.current.reset();
      await Promise.resolve();
    });

    expect(mockSecureStorage.clearOnboardingDraft).toHaveBeenCalledTimes(1);
  });

  it('cancels any pending debounced write on reset()', async () => {
    const { result } = await renderDraftHook();

    act(() => {
      result.current.update({ email: 'user@example.com' });
    });

    // Reset before the 200 ms fires
    act(() => {
      result.current.reset();
    });

    // Advance past 200 ms — no write should fire for the stale update
    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    // setOnboardingDraft should NOT have been called
    expect(mockSecureStorage.setOnboardingDraft).not.toHaveBeenCalled();
  });
});

describe('useOnboardingDraft — setSiblings()', () => {
  it('replaces the siblings array', async () => {
    const { result } = await renderDraftHook();

    act(() => {
      result.current.setSiblings([
        { name: 'Umar', age: 28, maritalStatus: 'Never Married', gender: 'Male', profession: 'Engineer' },
      ]);
    });

    expect(result.current.getDraft().siblings).toHaveLength(1);
    expect(result.current.getDraft().siblings[0]?.name).toBe('Umar');
  });
});

describe('useOnboardingDraft — setNotificationPermissionStatus()', () => {
  it('given status granted, then notificationPermissionStatus on draft is granted', async () => {
    const { result } = await renderDraftHook();

    act(() => {
      result.current.setNotificationPermissionStatus('granted');
    });

    expect(result.current.getDraft().notificationPermissionStatus).toBe('granted');
  });

  it('given status denied, then notificationPermissionStatus on draft is denied', async () => {
    const { result } = await renderDraftHook();

    act(() => {
      result.current.setNotificationPermissionStatus('denied');
    });

    expect(result.current.getDraft().notificationPermissionStatus).toBe('denied');
  });

  it('given status set, then fields are unaffected', async () => {
    const { result } = await renderDraftHook();

    act(() => {
      result.current.update({ first_name: 'Sara' });
    });

    act(() => {
      result.current.setNotificationPermissionStatus('granted');
    });

    expect(result.current.getDraft().fields.first_name).toBe('Sara');
  });
});

describe('useOnboardingDraft — setLocationPermissionStatus()', () => {
  it('given status granted, then locationPermissionStatus on draft is granted', async () => {
    const { result } = await renderDraftHook();

    act(() => {
      result.current.setLocationPermissionStatus('granted');
    });

    expect(result.current.getDraft().locationPermissionStatus).toBe('granted');
  });

  it('given status denied, then locationPermissionStatus on draft is denied', async () => {
    const { result } = await renderDraftHook();

    act(() => {
      result.current.setLocationPermissionStatus('denied');
    });

    expect(result.current.getDraft().locationPermissionStatus).toBe('denied');
  });

  it('given status set, then siblings and fields are unaffected', async () => {
    const { result } = await renderDraftHook();

    act(() => {
      result.current.setSiblings([{ name: 'Aisha', age: 25, maritalStatus: null, gender: 'Female', profession: null }]);
    });

    act(() => {
      result.current.setLocationPermissionStatus('granted');
    });

    expect(result.current.getDraft().siblings).toHaveLength(1);
    expect(result.current.getDraft().locationPermissionStatus).toBe('granted');
  });
});
