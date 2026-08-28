/**
 * Tests for FriendshipProvider and useFriendship (stories 13.2 + 15.1).
 *
 * AC coverage (story 13.2):
 * (a) Hydration: friends list starts with Mehvish; requests list starts with
 *     one pending request from Qurat.
 * (b) isFriend(mehvishId) === true on mount; isFriend(quratId) === false on mount.
 * (c) receivedRequestFrom(quratId) === true on mount;
 *     receivedRequestFrom(mehvishId) === false on mount.
 * (d) getFullProfile(mehvishId) returns the Mehvish fixture.
 * (e) getFullProfile(quratId) returns the Qurat fixture.
 * (f) getFullProfile(unknown) returns undefined.
 * (g) acceptRequest(quratId): removes Qurat from requests, adds to friends,
 *     result equals getFullProfile(quratId).
 * (h) acceptRequest(unknownId): no-op (friends/requests unchanged), console.warn fires.
 * (i) declineRequest(quratId): removes Qurat from requests only; friends unchanged.
 * (j) registry-lookup path: profile added to friends after acceptRequest equals
 *     getFullProfile(quratId).
 *
 * AC coverage (story 15.1 — outgoing-request mirror):
 * (l) Cold hydration: outgoingRequestIds starts as [] on fresh AsyncStorage.
 * (m) sendRequest(userId) then hasOutgoingRequest(userId) returns true.
 * (n) sendRequest called twice with same userId does not duplicate outgoingRequestIds.
 * (o) outgoingRequestIds in-memory mirror updates on sendRequest (provider re-renders).
 * (p) AsyncStorage key survives provider unmount + remount (persistence check).
 *
 * TODO(mock-only): remove when real backend friendship/request endpoints ship
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  FriendshipProvider,
  useFriendship,
} from '@/state/friendship/FriendshipProvider';
import { OUTGOING_REQUESTS_STORAGE_KEY } from '@/features/friendRequests/storage/requestsStorage';
import dummyMehvish from '../../../assets/dummymehvish.json';
import dummyQurat from '../../../assets/dummyqurat.json';

// ── Helpers ───────────────────────────────────────────────────────────────────

const mehvishId = dummyMehvish.user_id;
const quratId = dummyQurat.user_id;
const unknownId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

function renderFriendshipHook() {
  return renderHook(() => useFriendship(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <FriendshipProvider>{children}</FriendshipProvider>
    ),
  });
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

// ── AC (a): hydration ─────────────────────────────────────────────────────────

describe('FriendshipProvider — AC (a): hydration', () => {
  it('given provider mounts, then friends list contains Mehvish', () => {
    const { result } = renderFriendshipHook();
    const mehvish = result.current.friends.find((f) => f.user_id === mehvishId);
    expect(mehvish).toBeDefined();
    expect(mehvish?.first_name).toBe('Mehvish');
  });

  it('given provider mounts, then requests list has one pending request from Qurat', () => {
    const { result } = renderFriendshipHook();
    expect(result.current.requests).toHaveLength(1);
    expect(result.current.requests[0]?.from_user_id).toBe(quratId);
    expect(result.current.requests[0]?.status).toBe('pending');
  });
});

// ── AC (b): isFriend ──────────────────────────────────────────────────────────

describe('FriendshipProvider — AC (b): isFriend', () => {
  it('given seed state, then isFriend(mehvishId) is true', () => {
    const { result } = renderFriendshipHook();
    expect(result.current.isFriend(mehvishId)).toBe(true);
  });

  it('given seed state, then isFriend(quratId) is false', () => {
    const { result } = renderFriendshipHook();
    expect(result.current.isFriend(quratId)).toBe(false);
  });

  it('given seed state, then isFriend(unknownId) is false', () => {
    const { result } = renderFriendshipHook();
    expect(result.current.isFriend(unknownId)).toBe(false);
  });
});

// ── AC (c): receivedRequestFrom ───────────────────────────────────────────────

describe('FriendshipProvider — AC (c): receivedRequestFrom', () => {
  it('given seed state, then receivedRequestFrom(quratId) is true', () => {
    const { result } = renderFriendshipHook();
    expect(result.current.receivedRequestFrom(quratId)).toBe(true);
  });

  it('given seed state, then receivedRequestFrom(mehvishId) is false', () => {
    const { result } = renderFriendshipHook();
    expect(result.current.receivedRequestFrom(mehvishId)).toBe(false);
  });

  it('given seed state, then receivedRequestFrom(unknownId) is false', () => {
    const { result } = renderFriendshipHook();
    expect(result.current.receivedRequestFrom(unknownId)).toBe(false);
  });
});

// ── AC (d)/(e)/(f): getFullProfile ───────────────────────────────────────────

describe('FriendshipProvider — AC (d/e/f): getFullProfile', () => {
  it('given mehvishId, then getFullProfile returns Mehvish fixture', () => {
    const { result } = renderFriendshipHook();
    const profile = result.current.getFullProfile(mehvishId);
    expect(profile).toBeDefined();
    expect(profile?.first_name).toBe('Mehvish');
    expect(profile?.last_name).toBe('Hayat');
    expect(profile?.user_id).toBe(mehvishId);
  });

  it('given quratId, then getFullProfile returns Qurat fixture', () => {
    const { result } = renderFriendshipHook();
    const profile = result.current.getFullProfile(quratId);
    expect(profile).toBeDefined();
    expect(profile?.first_name).toBe('Qurat');
    expect(profile?.last_name).toBe('Baloch');
    expect(profile?.user_id).toBe(quratId);
  });

  it('given unknownId, then getFullProfile returns undefined', () => {
    const { result } = renderFriendshipHook();
    const profile = result.current.getFullProfile(unknownId);
    expect(profile).toBeUndefined();
  });
});

// ── AC (g): acceptRequest — known user ───────────────────────────────────────

describe('FriendshipProvider — AC (g): acceptRequest moves user to friends', () => {
  it('given Qurat pending, when acceptRequest(quratId), then Qurat removed from requests', () => {
    const { result } = renderFriendshipHook();

    act(() => {
      result.current.acceptRequest(quratId);
    });

    const stillPending = result.current.requests.find(
      (r) => r.from_user_id === quratId,
    );
    expect(stillPending).toBeUndefined();
  });

  it('given Qurat pending, when acceptRequest(quratId), then Qurat added to friends', () => {
    const { result } = renderFriendshipHook();

    act(() => {
      result.current.acceptRequest(quratId);
    });

    const friend = result.current.friends.find((f) => f.user_id === quratId);
    expect(friend).toBeDefined();
    expect(friend?.first_name).toBe('Qurat');
  });

  it('given Qurat pending, when acceptRequest(quratId), then isFriend(quratId) is true', () => {
    const { result } = renderFriendshipHook();

    act(() => {
      result.current.acceptRequest(quratId);
    });

    expect(result.current.isFriend(quratId)).toBe(true);
  });

  it('given Qurat pending, when acceptRequest(quratId), then Mehvish still in friends', () => {
    const { result } = renderFriendshipHook();

    act(() => {
      result.current.acceptRequest(quratId);
    });

    expect(result.current.isFriend(mehvishId)).toBe(true);
  });
});

// ── AC (h): acceptRequest — unknown user (defensive no-op) ───────────────────

describe('FriendshipProvider — AC (h): acceptRequest with unknown userId is a no-op', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('given unknown userId, when acceptRequest, then friends list is unchanged', () => {
    const { result } = renderFriendshipHook();
    const friendsBefore = result.current.friends.length;

    act(() => {
      result.current.acceptRequest(unknownId);
    });

    expect(result.current.friends).toHaveLength(friendsBefore);
  });

  it('given unknown userId, when acceptRequest, then requests list is unchanged', () => {
    const { result } = renderFriendshipHook();
    const requestsBefore = result.current.requests.length;

    act(() => {
      result.current.acceptRequest(unknownId);
    });

    expect(result.current.requests).toHaveLength(requestsBefore);
  });

  it('given unknown userId, when acceptRequest, then console.warn is called', () => {
    const { result } = renderFriendshipHook();

    act(() => {
      result.current.acceptRequest(unknownId);
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining(unknownId),
    );
  });
});

// ── AC (i): declineRequest ────────────────────────────────────────────────────

describe('FriendshipProvider — AC (i): declineRequest removes request only', () => {
  it('given Qurat pending, when declineRequest(quratId), then Qurat removed from requests', () => {
    const { result } = renderFriendshipHook();

    act(() => {
      result.current.declineRequest(quratId);
    });

    const stillPending = result.current.requests.find(
      (r) => r.from_user_id === quratId,
    );
    expect(stillPending).toBeUndefined();
  });

  it('given Qurat pending, when declineRequest(quratId), then friends list is unchanged', () => {
    const { result } = renderFriendshipHook();
    const friendsBefore = result.current.friends.length;

    act(() => {
      result.current.declineRequest(quratId);
    });

    expect(result.current.friends).toHaveLength(friendsBefore);
    expect(result.current.isFriend(quratId)).toBe(false);
  });

  it('given Qurat pending, when declineRequest(quratId), then isFriend(quratId) remains false', () => {
    const { result } = renderFriendshipHook();

    act(() => {
      result.current.declineRequest(quratId);
    });

    expect(result.current.isFriend(quratId)).toBe(false);
  });
});

// ── AC (j): registry-lookup path — accepted profile equals getFullProfile ─────

describe('FriendshipProvider — AC (j): acceptRequest registry-lookup path', () => {
  it('given Qurat pending, when acceptRequest(quratId), then friend added equals getFullProfile(quratId)', () => {
    const { result } = renderFriendshipHook();
    const expectedProfile = result.current.getFullProfile(quratId);

    act(() => {
      result.current.acceptRequest(quratId);
    });

    const addedFriend = result.current.friends.find((f) => f.user_id === quratId);
    expect(addedFriend).toBeDefined();
    expect(addedFriend).toEqual(expectedProfile);
  });
});

// ── AC (k): pendingToast cross-screen handoff (story 13.4 option b) ──────────

describe('FriendshipProvider — AC (k): pendingToast handoff mechanism', () => {
  it('given initial state, then pendingToast is null', () => {
    const { result } = renderFriendshipHook();
    expect(result.current.pendingToast).toBeNull();
  });

  it('given setPendingToast called with a message, then pendingToast equals that message', () => {
    const { result } = renderFriendshipHook();

    act(() => {
      result.current.setPendingToast('Request declined');
    });

    expect(result.current.pendingToast).toBe('Request declined');
  });

  it('given pendingToast is set, when consumePendingToast called, then pendingToast becomes null', () => {
    const { result } = renderFriendshipHook();

    act(() => {
      result.current.setPendingToast('Request declined');
    });
    act(() => {
      result.current.consumePendingToast();
    });

    expect(result.current.pendingToast).toBeNull();
  });

  it('given setPendingToast called twice, then pendingToast reflects the last message', () => {
    const { result } = renderFriendshipHook();

    act(() => {
      result.current.setPendingToast('First message');
    });
    act(() => {
      result.current.setPendingToast('Second message');
    });

    expect(result.current.pendingToast).toBe('Second message');
  });
});

// ── AC (l): outgoing-request cold hydration ──────────────────────────────────

describe('FriendshipProvider — AC (l): outgoing-request cold hydration', () => {
  it('given empty AsyncStorage, when provider mounts, then outgoingRequestIds is []', async () => {
    const { result } = renderFriendshipHook();

    // Allow the useEffect hydration to complete.
    await act(async () => {});

    expect(result.current.outgoingRequestIds).toEqual([]);
  });
});

// ── AC (m): hasOutgoingRequest flips true after sendRequest ──────────────────

describe('FriendshipProvider — AC (m): sendRequest + hasOutgoingRequest', () => {
  it('given userId not sent, when hasOutgoingRequest is called, then returns false', async () => {
    const { result } = renderFriendshipHook();
    await act(async () => {});

    expect(result.current.hasOutgoingRequest('unknown-user')).toBe(false);
  });

  it('given sendRequest(userId) called, when hasOutgoingRequest(userId), then returns true', async () => {
    const { result } = renderFriendshipHook();
    await act(async () => {});

    await act(async () => {
      await result.current.sendRequest('user-x');
    });

    expect(result.current.hasOutgoingRequest('user-x')).toBe(true);
  });
});

// ── AC (n): sendRequest idempotency — no duplicate in outgoingRequestIds ──────

describe('FriendshipProvider — AC (n): sendRequest idempotency', () => {
  it('given sendRequest called twice with same userId, then outgoingRequestIds length stays 1', async () => {
    const { result } = renderFriendshipHook();
    await act(async () => {});

    await act(async () => {
      await result.current.sendRequest('user-x');
    });

    await act(async () => {
      await result.current.sendRequest('user-x');
    });

    expect(result.current.outgoingRequestIds).toHaveLength(1);
    expect(result.current.outgoingRequestIds[0]).toBe('user-x');
  });
});

// ── AC (o): provider re-renders on outgoingRequestIds mirror update ──────────

describe('FriendshipProvider — AC (o): provider re-renders on mirror update', () => {
  it('given sendRequest is called, then outgoingRequestIds reflects the new id', async () => {
    const { result } = renderFriendshipHook();
    await act(async () => {});

    expect(result.current.outgoingRequestIds).toHaveLength(0);

    await act(async () => {
      await result.current.sendRequest('user-y');
    });

    expect(result.current.outgoingRequestIds).toContain('user-y');
  });
});

// ── AC (p): AsyncStorage key survives unmount + remount ──────────────────────

describe('FriendshipProvider — AC (p): persistence across remount', () => {
  it('given sendRequest was called, when provider unmounts and remounts, then hasOutgoingRequest still returns true', async () => {
    // First mount — call sendRequest.
    const { result: firstResult, unmount } = renderFriendshipHook();
    await act(async () => {});

    await act(async () => {
      await firstResult.current.sendRequest('user-z');
    });

    unmount();

    // Verify AsyncStorage was written (the mock retains state across mounts).
    const raw = await AsyncStorage.getItem(OUTGOING_REQUESTS_STORAGE_KEY);
    expect(raw).not.toBeNull();

    // Second mount — hydrates from AsyncStorage.
    const { result: second } = renderFriendshipHook();
    await act(async () => {});

    expect(second.current.hasOutgoingRequest('user-z')).toBe(true);
    expect(second.current.outgoingRequestIds).toContain('user-z');
  });
});
