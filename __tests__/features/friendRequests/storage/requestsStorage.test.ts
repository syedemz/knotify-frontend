/**
 * Unit tests for requestsStorage (story 15.1).
 *
 * Uses the official `@react-native-async-storage/async-storage` jest mock,
 * already wired in `jest.config.js` via `moduleNameMapper`.
 *
 * AC coverage:
 * (a) `getOutgoingRequests` on empty storage returns `[]` (cold hydration).
 * (b) `addOutgoingRequest` with the same userId twice does not duplicate
 *     (idempotent / deduplication).
 * (c) `hasOutgoingRequest(id)` returns `false` before add, `true` after add.
 * (d) `removeOutgoingRequest` removes by userId; removing unknown id is a no-op.
 * (e) `clearOutgoingRequests` wipes the key; subsequent `getOutgoingRequests` returns `[]`.
 * (f) Corrupt JSON returns `[]` and logs `console.warn` (fail-open policy).
 * (g) `saveOutgoingRequests` roundtrip: save then get returns the same array.
 *
 * TODO(mock-only): remove when real send-request endpoint ships
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  OUTGOING_REQUESTS_STORAGE_KEY,
  addOutgoingRequest,
  clearOutgoingRequests,
  getOutgoingRequests,
  hasOutgoingRequest,
  removeOutgoingRequest,
  saveOutgoingRequests,
} from '@/features/friendRequests/storage/requestsStorage';

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

// ── AC (a): cold hydration returns empty array ────────────────────────────────

describe('getOutgoingRequests', () => {
  it('given storage is empty, when getOutgoingRequests is called, then returns []', async () => {
    const result = await getOutgoingRequests();
    expect(result).toEqual([]);
  });

  // AC (f)
  it('given storage contains corrupt JSON, when getOutgoingRequests is called, then returns [] and warns', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    await AsyncStorage.setItem(OUTGOING_REQUESTS_STORAGE_KEY, '{ not valid json {{{{');

    const result = await getOutgoingRequests();

    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('failed to parse stored JSON'),
    );

    warnSpy.mockRestore();
  });

  // AC (g)
  it('given saveOutgoingRequests was called, when getOutgoingRequests is called, then returns the saved array', async () => {
    await saveOutgoingRequests(['user-a', 'user-b']);
    const result = await getOutgoingRequests();
    expect(result).toEqual(['user-a', 'user-b']);
  });
});

// ── AC (b): addOutgoingRequest deduplication ──────────────────────────────────

describe('addOutgoingRequest', () => {
  it('given empty storage, when addOutgoingRequest is called, then userId is persisted', async () => {
    await addOutgoingRequest('user-a');
    const result = await getOutgoingRequests();
    expect(result).toContain('user-a');
    expect(result).toHaveLength(1);
  });

  it('given userId already present, when addOutgoingRequest is called with same userId, then array length stays 1 (idempotent)', async () => {
    await addOutgoingRequest('user-a');
    await addOutgoingRequest('user-a');
    const result = await getOutgoingRequests();
    expect(result).toHaveLength(1);
  });

  it('given two different userIds, when both are added, then array length is 2', async () => {
    await addOutgoingRequest('user-a');
    await addOutgoingRequest('user-b');
    const result = await getOutgoingRequests();
    expect(result).toHaveLength(2);
    expect(result).toContain('user-a');
    expect(result).toContain('user-b');
  });
});

// ── AC (c): hasOutgoingRequest flips true after addOutgoingRequest ────────────

describe('hasOutgoingRequest', () => {
  it('given userId not present, when hasOutgoingRequest is called, then returns false', async () => {
    const result = await hasOutgoingRequest('user-a');
    expect(result).toBe(false);
  });

  it('given userId added via addOutgoingRequest, when hasOutgoingRequest is called, then returns true', async () => {
    await addOutgoingRequest('user-a');
    const result = await hasOutgoingRequest('user-a');
    expect(result).toBe(true);
  });

  it('given userId removed via removeOutgoingRequest, when hasOutgoingRequest is called, then returns false', async () => {
    await addOutgoingRequest('user-a');
    await removeOutgoingRequest('user-a');
    const result = await hasOutgoingRequest('user-a');
    expect(result).toBe(false);
  });
});

// ── AC (d): removeOutgoingRequest ────────────────────────────────────────────

describe('removeOutgoingRequest', () => {
  it('given a persisted userId, when removeOutgoingRequest is called, then userId is removed', async () => {
    await addOutgoingRequest('user-a');
    await removeOutgoingRequest('user-a');
    const result = await getOutgoingRequests();
    expect(result).not.toContain('user-a');
    expect(result).toHaveLength(0);
  });

  it('given an unknown userId, when removeOutgoingRequest is called, then array is unchanged (no-op)', async () => {
    await addOutgoingRequest('user-a');
    await removeOutgoingRequest('non-existent-uuid');
    const result = await getOutgoingRequests();
    expect(result).toHaveLength(1);
    expect(result).toContain('user-a');
  });

  it('given empty storage, when removeOutgoingRequest is called, then returns without error (idempotent)', async () => {
    await expect(removeOutgoingRequest('non-existent-uuid')).resolves.toBeUndefined();
    const result = await getOutgoingRequests();
    expect(result).toEqual([]);
  });

  it('given two persisted userIds, when one is removed, then only the other remains', async () => {
    await addOutgoingRequest('user-a');
    await addOutgoingRequest('user-b');
    await removeOutgoingRequest('user-a');
    const result = await getOutgoingRequests();
    expect(result).toHaveLength(1);
    expect(result).toContain('user-b');
    expect(result).not.toContain('user-a');
  });
});

// ── AC (e): clearOutgoingRequests ────────────────────────────────────────────

describe('clearOutgoingRequests', () => {
  it('given persisted entries, when clearOutgoingRequests is called, then subsequent getOutgoingRequests returns []', async () => {
    await addOutgoingRequest('user-a');
    await addOutgoingRequest('user-b');

    await clearOutgoingRequests();

    const result = await getOutgoingRequests();
    expect(result).toEqual([]);
  });

  it('given empty storage, when clearOutgoingRequests is called, then getOutgoingRequests still returns []', async () => {
    await clearOutgoingRequests();
    const result = await getOutgoingRequests();
    expect(result).toEqual([]);
  });
});

// ── OUTGOING_REQUESTS_STORAGE_KEY export ─────────────────────────────────────

describe('OUTGOING_REQUESTS_STORAGE_KEY', () => {
  it('is exported and equals "dummy.requests.outgoing"', () => {
    expect(OUTGOING_REQUESTS_STORAGE_KEY).toBe('dummy.requests.outgoing');
  });
});
