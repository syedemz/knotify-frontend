/**
 * Mock-only friendship and friend-request context for phases 13–15.
 *
 * Hydrates in-memory state from two seed fixtures on mount:
 * - `assets/dummyfriendships.json` — one row: Mehvish is already a friend.
 * - `assets/dummyrequests.json` — one row: Qurat has sent a pending request.
 *
 * Also hydrates the outgoing-request mirror from AsyncStorage on mount
 * (story 15.1). This mirror persists across cold starts so a sent request
 * is not forgotten on relaunch.
 *
 * Exposes `useFriendship()` for reading and mutating friendship state.
 *
 * **Cold-start reset (incoming side only).** The friends list and incoming
 * requests are in-memory only — they reset on cold start. Outgoing request IDs
 * are persisted via AsyncStorage and survive relaunches. Do NOT treat the
 * friends/requests cold-start reset as a bug for phase 13–14.
 *
 * TODO(mock-only): replace in-memory store with real REST/AppSync-backed
 * queries (`GET /friends`, `GET /friend-requests`, etc.) when real backend ships.
 *
 * @module state/friendship/FriendshipProvider
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  addOutgoingRequest,
  getOutgoingRequests,
} from '@/features/friendRequests/storage/requestsStorage';

import type { DummyFullProfile } from '@/types/DummyFullProfile';
import dummyMehvishJson from '../../../assets/dummymehvish.json';
import dummyQuratJson from '../../../assets/dummyqurat.json';
import seedFriendships from '../../../assets/dummyfriendships.json';
import seedRequests from '../../../assets/dummyrequests.json';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * A pending friend request sent from another user to the current user.
 *
 * Mirrors the shape of `dummyrequests.json` rows, which in turn mirrors the
 * `friend_requests` table columns visible to the recipient.
 */
export interface PendingRequest {
  /** UUID primary key of the friend-request row. */
  readonly request_id: string;
  /** `user_id` of the user who sent the request. */
  readonly from_user_id: string;
  /** Always `'pending'` in the seed fixture; set to other values post-accept/decline. */
  readonly status: 'pending';
  /** ISO 8601 timestamp of when the request was created. */
  readonly created_at: string;
}

/**
 * The value exposed by `useFriendship()`.
 *
 * TODO(mock-only): retire when real REST/AppSync friendship endpoints ship
 */
export interface FriendshipContextValue {
  /** List of current friends (each a full profile resolved from the registry). */
  readonly friends: DummyFullProfile[];

  /** List of pending incoming friend requests. */
  readonly requests: PendingRequest[];

  /**
   * Accept a pending friend request.
   *
   * Looks up the sender's `DummyFullProfile` in `ALL_FULL_PROFILES`. If found,
   * removes the request and adds the profile to `friends`. If not found
   * (defensive — should never happen in seed state), no-ops with `console.warn`.
   */
  readonly acceptRequest: (userId: string) => void;

  /**
   * Decline a pending friend request.
   *
   * Removes the request row only. The sender is NOT added to friends.
   */
  readonly declineRequest: (userId: string) => void;

  /**
   * Returns `true` if `userId` is currently in the friends list.
   */
  readonly isFriend: (userId: string) => boolean;

  /**
   * Returns `true` if there is a pending incoming request whose
   * `from_user_id === userId`.
   */
  readonly receivedRequestFrom: (userId: string) => boolean;

  /**
   * Returns the `DummyFullProfile` for `userId`, or `undefined` if unknown.
   *
   * Single source of truth for `user_id → DummyFullProfile` resolution.
   * Stories 13.4 (OtherProfileScreen) and 13.5 (Explore Requests) call this —
   * neither re-imports the fixture JSONs directly.
   *
   * TODO(mock-only): replace with real `GET /profiles/{userId}` query
   */
  readonly getFullProfile: (userId: string) => DummyFullProfile | undefined;

  /**
   * A toast message to be shown by the receiving screen (ExploreHomeScreen)
   * after `OtherProfileScreen` fires Decline and calls `goBack()`.
   *
   * **Handoff mechanism (option b — story 13.4):** When `OtherProfileScreen`
   * handles Decline it calls `declineRequest(userId)` and IMMEDIATELY calls
   * `navigation.goBack()`. Since the screen unmounts before it can show a
   * snackbar, the "Request declined" toast is deferred here. `ExploreHomeScreen`
   * (story 13.5) reads this field on focus, shows the snackbar, then calls
   * `consumePendingToast()` to clear it.
   *
   * `null` when no toast is pending.
   *
   * TODO(mock-only): remove when real backend friendship endpoints ship;
   * real Decline confirmation will arrive via server push / mutation result.
   */
  readonly pendingToast: string | null;

  /**
   * Sets a pending toast message to be consumed by the next screen that gains
   * focus (typically `ExploreHomeScreen`).
   *
   * Called by `OtherProfileScreen` before `navigation.goBack()` on Decline.
   */
  readonly setPendingToast: (message: string) => void;

  /**
   * Clears the pending toast after the receiving screen has shown it.
   *
   * Called by `ExploreHomeScreen` (story 13.5) inside a `useFocusEffect`
   * after displaying the snackbar.
   */
  readonly consumePendingToast: () => void;

  // ── Outgoing-request mirror (story 15.1) ─────────────────────────────────

  /**
   * The set of user IDs to whom the current user has sent a friend request.
   *
   * Hydrated from AsyncStorage on provider mount and updated in-memory on
   * every `sendRequest` call. Survives cold start.
   *
   * TODO(mock-only): remove when real send-request endpoint ships
   */
  readonly outgoingRequestIds: readonly string[];

  /**
   * Persists a friend-request send to AsyncStorage and updates the
   * in-memory `outgoingRequestIds` mirror.
   *
   * Idempotent: if `userId` is already in the mirror, the AsyncStorage write
   * is a no-op (deduplicated inside `addOutgoingRequest`).
   *
   * TODO(mock-only): replace with real `POST /friend-requests` mutation
   *
   * @param userId - The `user_id` of the profile the request is being sent to.
   */
  readonly sendRequest: (userId: string) => Promise<void>;

  /**
   * Synchronous check: returns `true` if the current user has already sent a
   * friend request to `userId`.
   *
   * Reads from the in-memory mirror, not AsyncStorage — O(n) scan but always
   * synchronous. For one-shot async checks outside React, use
   * `hasOutgoingRequest(userId)` from `requestsStorage.ts` directly.
   *
   * TODO(mock-only): remove when real endpoint ships
   *
   * @param userId - The `user_id` to check.
   */
  readonly hasOutgoingRequest: (userId: string) => boolean;
}

// ── ALL_FULL_PROFILES registry ────────────────────────────────────────────────

/**
 * Module-scope registry mapping `user_id → DummyFullProfile` for all known
 * "other" users in phase 13 (Mehvish + Qurat).
 *
 * Stories 13.4 and 13.5 resolve full profiles exclusively through
 * `getFullProfile(userId)` — they do NOT re-import fixture JSONs.
 *
 * TODO(mock-only): remove registry; replace with real `GET /profiles/{userId}`
 * query when the backend ships real profile lookup.
 */
// TODO(mock-only): replace ALL_FULL_PROFILES with real profile API calls
const ALL_FULL_PROFILES: Record<string, DummyFullProfile> = {
  [dummyMehvishJson.user_id]: dummyMehvishJson as unknown as DummyFullProfile,
  [dummyQuratJson.user_id]: dummyQuratJson as unknown as DummyFullProfile,
};

// ── Seed data hydration ───────────────────────────────────────────────────────

/**
 * Converts the raw `dummyfriendships.json` array into a `DummyFullProfile[]`
 * by looking each `user_id` up in `ALL_FULL_PROFILES`.
 *
 * Rows whose `user_id` is not in the registry are silently skipped — this is
 * a defensive guard that should never fire in the current seed data.
 */
function hydrateFriends(): DummyFullProfile[] {
  return (seedFriendships as Array<{ user_id: string }>).flatMap((row) => {
    const profile = ALL_FULL_PROFILES[row.user_id];
    return profile !== undefined ? [profile] : [];
  });
}

/**
 * Converts the raw `dummyrequests.json` array into a `PendingRequest[]`.
 *
 * The cast is safe because the seed JSON matches the `PendingRequest` shape.
 */
function hydrateRequests(): PendingRequest[] {
  return seedRequests as unknown as PendingRequest[];
}

// ── Context ───────────────────────────────────────────────────────────────────

const FriendshipContext = createContext<FriendshipContextValue | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

interface FriendshipProviderProps {
  /** React subtree that can call `useFriendship()`. */
  readonly children?: React.ReactNode;
}

/**
 * Provider for the mock-only friendship + friend-request state.
 *
 * Hydrates from seed fixtures synchronously on mount (no async needed for
 * in-memory JSON data). State resets on every cold start — this is expected
 * behavior in phase 13 (see module-level JSDoc).
 *
 * TODO(mock-only): remove when real friendship backend ships
 *
 * @param props - {@link FriendshipProviderProps}
 */
// TODO(mock-only): remove when real friendship/request endpoints ship
export function FriendshipProvider({ children }: FriendshipProviderProps): React.JSX.Element {
  // TODO(mock-only): in-memory store resets on cold start; persistence ships in phase 15
  const [friends, setFriends] = useState<DummyFullProfile[]>(hydrateFriends);
  const [requests, setRequests] = useState<PendingRequest[]>(hydrateRequests);

  // ── Outgoing-request mirror (story 15.1) ───────────────────────────────────
  // Hydrated once from AsyncStorage on mount; updated in-memory on every
  // sendRequest call. Unlike friends/requests, this mirror survives cold start
  // because it is backed by AsyncStorage.
  // TODO(mock-only): remove when real send-request endpoint ships
  const [outgoingRequestIds, setOutgoingRequestIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const ids = await getOutgoingRequests();
      if (!cancelled) {
        setOutgoingRequestIds(ids);
      }
    };
    hydrate().catch((e) => console.warn('[FriendshipProvider] outgoing-requests hydration failed', e));
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Pending-toast cross-screen handoff (option b — story 13.4) ─────────────
  // OtherProfileScreen sets this before calling goBack() on Decline so that
  // ExploreHomeScreen (story 13.5) can show the "Request declined" snackbar
  // when it gains focus. ExploreHomeScreen calls consumePendingToast() after
  // displaying the message.
  // TODO(mock-only): remove when real backend Decline confirmation ships
  const [pendingToast, setPendingToastState] = useState<string | null>(null);

  const acceptRequest = useCallback((userId: string): void => {
    const profile = ALL_FULL_PROFILES[userId];
    if (profile === undefined) {
      // Defensive: should never happen with the current seed data.
      console.warn(
        `[FriendshipProvider] acceptRequest: userId "${userId}" not found in ALL_FULL_PROFILES registry — no-op`,
      );
      return;
    }
    setRequests((prev) => prev.filter((r) => r.from_user_id !== userId));
    setFriends((prev) => {
      // Guard against double-add if acceptRequest is called twice.
      if (prev.some((f) => f.user_id === userId)) {
        return prev;
      }
      return [...prev, profile];
    });
  }, []);

  const declineRequest = useCallback((userId: string): void => {
    setRequests((prev) => prev.filter((r) => r.from_user_id !== userId));
  }, []);

  const isFriend = useCallback(
    (userId: string): boolean => friends.some((f) => f.user_id === userId),
    [friends],
  );

  const receivedRequestFrom = useCallback(
    (userId: string): boolean =>
      requests.some((r) => r.from_user_id === userId),
    [requests],
  );

  const getFullProfile = useCallback(
    (userId: string): DummyFullProfile | undefined => ALL_FULL_PROFILES[userId],
    [],
  );

  const setPendingToast = useCallback((message: string): void => {
    setPendingToastState(message);
  }, []);

  const consumePendingToast = useCallback((): void => {
    setPendingToastState(null);
  }, []);

  // ── Outgoing-request actions (story 15.1) ──────────────────────────────────

  const sendRequest = useCallback(async (userId: string): Promise<void> => {
    await addOutgoingRequest(userId);
    setOutgoingRequestIds((prev) => {
      if (prev.includes(userId)) {
        return prev;
      }
      return [...prev, userId];
    });
  }, []);

  const hasOutgoingRequest = useCallback(
    (userId: string): boolean => outgoingRequestIds.includes(userId),
    [outgoingRequestIds],
  );

  const value: FriendshipContextValue = {
    friends,
    requests,
    acceptRequest,
    declineRequest,
    isFriend,
    receivedRequestFrom,
    getFullProfile,
    pendingToast,
    setPendingToast,
    consumePendingToast,
    outgoingRequestIds,
    sendRequest,
    hasOutgoingRequest,
  };

  return (
    <FriendshipContext.Provider value={value}>
      {children}
    </FriendshipContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Returns the mock-only friendship state and actions.
 *
 * Includes the outgoing-request mirror added in story 15.1:
 * `outgoingRequestIds`, `sendRequest`, and `hasOutgoingRequest`.
 *
 * Must be called within a {@link FriendshipProvider}.
 *
 * @returns The current {@link FriendshipContextValue}.
 * @throws {Error} When called outside `FriendshipProvider`.
 *
 * TODO(mock-only): remove when real friendship backend ships
 */
// TODO(mock-only): remove when real friendship/request endpoints ship
export function useFriendship(): FriendshipContextValue {
  const ctx = useContext(FriendshipContext);
  if (ctx === undefined) {
    throw new Error('useFriendship must be used within FriendshipProvider');
  }
  return ctx;
}
