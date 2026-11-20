/**
 * FriendRequestSubscriptionListener — renders `null`; manages the
 * `onFriendRequestUpdated` AppSync subscription and surfaces incoming
 * friend-request lifecycle events as modals.
 *
 * Mounts both `IncomingRequestModal` and `RequestAcceptedModal` as siblings
 * so they render over the tab shell on every tab, regardless of which tab is
 * currently focused.
 *
 * **Lifecycle rules (story 16.8):**
 * - Subscription is established only when `useAuth().status === 'authenticated'`.
 *   The component renders `null` with no subscription while unauthenticated.
 * - On `AppState === 'active'` after a background transition, the subscription
 *   is re-established (via `remountKey` bump) AND `['friend-requests','incoming']`
 *   is invalidated so requests that arrived during the ~10-minute AppSync idle
 *   window are picked up by cache refetch rather than replayed as modal events.
 * - Multiple rapid subscription events replace the currently-displayed profile
 *   (latest wins); the prior modal dismisses before the new one opens.
 * - Profile hydration is async: the modal opens only once
 *   `useProfileQuery(userId).data` is defined. The listener holds
 *   `{ userId, requestId? }` in state; the profile query runs in the background;
 *   the modal is flipped visible once the profile arrives.
 *
 * **Modal host responsibilities (B1 contract):**
 * - `IncomingRequestModal.onAccept(userId, requestId)` → calls
 *   `useAcceptFriendRequestMutation.mutate({ requestId })`.
 * - `IncomingRequestModal.onDecline(userId, requestId)` → calls
 *   `useDeclineFriendRequestMutation.mutate({ requestId })`.
 * - `RequestAcceptedModal.onSayHi(acceptorUserId)` → calls
 *   `openChatRoom(acceptorUserId)`.
 *
 * @module features/friendRequests/FriendRequestSubscriptionListener
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/state/auth/AuthProvider';
import { useOwnProfile } from '@/state/ownProfile/OwnProfileProvider';
import { useProfileQuery } from '@/features/profile/api';
import { useOpenChatRoom } from '@/features/chat/navigation/openChatRoom';
import {
  useAcceptFriendRequestMutation,
  useDeclineFriendRequestMutation,
  useIncomingRequestsQuery,
  useOnFriendRequestUpdatedSubscription,
  useOnNotificationForMeSubscription,
  INCOMING_REQUESTS_QUERY_KEY,
} from './api';
import { IncomingRequestModal } from './components/IncomingRequestModal';
import { RequestAcceptedModal } from './components/RequestAcceptedModal';
import type { DummyFullProfile } from '@/types/DummyFullProfile';
import type { UserProfile } from '@/types/api/UserProfile';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Coerces a `UserProfile` to `DummyFullProfile` so it can be passed to the
 * presentation-only modals (which accept `DummyFullProfile | null`).
 *
 * `DummyFullProfile` extends `UserProfile` by adding optional `photos`,
 * `faceSelfieUri`, `siblings`, `preferences`, and `__dummy_*` fields — all
 * optional. A plain `UserProfile` from the real backend satisfies the structural
 * contract because every added field is optional. The cast via `unknown` is
 * required because TypeScript cannot prove structural assignability direction
 * on nominal types.
 */
function asDummyFullProfile(profile: UserProfile): DummyFullProfile {
  return profile as unknown as DummyFullProfile;
}

// ── Pending state shapes ──────────────────────────────────────────────────────

/**
 * Pending state for an incoming friend request event.
 *
 * We hold `{ userId, requestId }` rather than a resolved `DummyFullProfile` so
 * the modal can open the moment the profile query resolves, without having to
 * re-trigger an event.
 */
interface PendingIncoming {
  readonly userId: string;
  readonly requestId: string;
}

/**
 * Pending state for a friend-request-accepted event.
 *
 * Holds only `userId` — no `requestId` needed for the accepted flow.
 */
interface PendingAccepted {
  readonly userId: string;
}

// ── Inner hooks (profile-driven modal state) ───────────────────────────────────

/**
 * Internal hook that manages the incoming-request modal state.
 *
 * Holds the pending `{ userId, requestId }` from the subscription event.
 * The modal is flipped visible only once `useProfileQuery(userId).data` is
 * defined — this ensures the modal always has a resolved profile to display.
 *
 * Returns the state + handlers needed by the host component.
 */
function useIncomingModalState() {
  const [pending, setPending] = useState<PendingIncoming | null>(null);

  // Profile query enabled only when we have a pending userId.
  const { data: profile } = useProfileQuery(pending?.userId ?? '');

  // The modal is visible only when we have a pending event AND the profile has
  // resolved. Using `!!profile` as the gate prevents a flash of the modal with
  // no content while the query is in flight.
  const visible = pending !== null && profile !== undefined;

  const resolvedProfile: DummyFullProfile | null =
    profile !== undefined ? asDummyFullProfile(profile) : null;

  const requestId: string = pending?.requestId ?? '';

  const open = useCallback((userId: string, reqId: string) => {
    setPending({ userId, requestId: reqId });
  }, []);

  const close = useCallback(() => {
    setPending(null);
  }, []);

  return { visible, profile: resolvedProfile, requestId, open, close };
}

/**
 * Internal hook that manages the accepted-request modal state.
 *
 * Mirrors `useIncomingModalState` but for the `friend_request_accepted` branch.
 */
function useAcceptedModalState() {
  const [pending, setPending] = useState<PendingAccepted | null>(null);

  const { data: profile } = useProfileQuery(pending?.userId ?? '');

  const visible = pending !== null && profile !== undefined;

  const resolvedProfile: DummyFullProfile | null =
    profile !== undefined ? asDummyFullProfile(profile) : null;

  const open = useCallback((userId: string) => {
    setPending({ userId });
  }, []);

  const close = useCallback(() => {
    setPending(null);
  }, []);

  return { visible, profile: resolvedProfile, open, close };
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Subscription listener that renders `null` as its own output but mounts
 * `IncomingRequestModal` and `RequestAcceptedModal` as siblings so they can
 * appear over the full tab shell.
 *
 * Mount point: directly above `<Tab.Navigator>` in `AppTabs`.
 */
export function FriendRequestSubscriptionListener(): React.JSX.Element | null {
  const { status } = useAuth();
  const { profile: ownProfile } = useOwnProfile();
  const currentUserId = ownProfile?.user_id ?? '';
  const queryClient = useQueryClient();
  const openChatRoom = useOpenChatRoom();
  const acceptMutation = useAcceptFriendRequestMutation();
  const declineMutation = useDeclineFriendRequestMutation();

  const incomingModal = useIncomingModalState();
  const acceptedModal = useAcceptedModalState();

  // remountKey is bumped on AppState resume to force subscription teardown +
  // re-establish. Combined with incoming-cache invalidation this ensures
  // requests received during the ~10-minute AppSync idle window are surfaced.
  const [remountKey, setRemountKey] = useState(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current !== 'active' && nextState === 'active') {
        // Coming back from background — re-subscribe and invalidate incoming cache.
        setRemountKey((k) => k + 1);
        void queryClient.invalidateQueries({ queryKey: INCOMING_REQUESTS_QUERY_KEY });
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [queryClient]);

  // Subscription event handler — parse AWSJSON payload and branch on type.
  const handleNotification = useCallback(
    (notification: { type: string; payload: string }) => {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(notification.payload) as Record<string, unknown>;
      } catch {
        console.warn(
          '[FriendRequestSubscriptionListener] failed to parse notification payload',
          notification.payload,
        );
        return;
      }

      if (notification.type === 'friend_request_received') {
        const requestId = typeof parsed['request_id'] === 'string' ? parsed['request_id'] : null;
        const fromUserId = typeof parsed['from_user_id'] === 'string' ? parsed['from_user_id'] : null;
        if (requestId === null || fromUserId === null) {
          console.warn(
            '[FriendRequestSubscriptionListener] friend_request_received payload missing required fields',
            parsed,
          );
          return;
        }
        // Defense-in-depth: drop self-originated events. The backend's
        // AppSync setSubscriptionFilter (userId == identity.sub, registered
        // on the subscription resolver response templates) is the primary
        // guard — AppSync will not send these events to the originator at
        // all. This client-side check protects against a regression on the
        // backend filter AND against the on-device case where an event
        // delivered before the filter was deployed (or from a replay)
        // could otherwise misfire a modal naming the current user as the
        // sender. Matches the same from_user_id !== currentUserId guard
        // useIncomingRequestsQuery applies to the REST payload.
        if (currentUserId !== '' && fromUserId === currentUserId) {
          return;
        }
        // Latest wins: replace any currently displayed incoming request.
        // The backend dual-publishes this type to both onFriendRequestUpdated
        // AND onNotificationForMe, so this handler may fire twice per request.
        // close()→open() with the same {userId, requestId} is a visual no-op.
        incomingModal.close();
        incomingModal.open(fromUserId, requestId);
      } else if (notification.type === 'friend_request_accepted') {
        const fromUserId = typeof parsed['from_user_id'] === 'string' ? parsed['from_user_id'] : null;
        if (fromUserId === null) {
          console.warn(
            '[FriendRequestSubscriptionListener] friend_request_accepted payload missing from_user_id',
            parsed,
          );
          return;
        }
        // Defense-in-depth: drop self-originated events (acceptor == self).
        // See rationale on the friend_request_received branch above.
        if (currentUserId !== '' && fromUserId === currentUserId) {
          return;
        }
        // Latest wins: replace any currently displayed accepted modal.
        acceptedModal.close();
        acceptedModal.open(fromUserId);
      } else {
        // Unknown type — invalidate caches so the query layer can catch up.
        void queryClient.invalidateQueries({ queryKey: INCOMING_REQUESTS_QUERY_KEY });
        void queryClient.invalidateQueries({ queryKey: ['friends'] });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [incomingModal.close, incomingModal.open, acceptedModal.close, acceptedModal.open, queryClient, currentUserId],
  );

  // Both subscription hooks are called unconditionally to satisfy Rules of
  // Hooks. The actual subscriptions are established inside each hook's
  // useEffect, guarded by the remountKey. The listener component is NOT
  // mounted when unauthenticated (see the return null below), so these hooks
  // only run when auth.status === 'authenticated'.
  //
  // Two independent AppSync channels for defense in depth:
  //  - onFriendRequestUpdated receives `friend_request_accepted` and (via the
  //    backend dual-publish) `friend_request_received`.
  //  - onNotificationForMe receives `friend_request_received` (generic
  //    channel), plus bookmark/match/etc. that this listener ignores.
  // handleNotification is the same function for both — latest-wins modal
  // semantics ensure a double delivery is a visual no-op.
  useOnFriendRequestUpdatedSubscription(handleNotification, remountKey);
  useOnNotificationForMeSubscription(handleNotification, remountKey);

  // ── Poll-based incoming-request detection ─────────────────────────────────
  //
  // Historically the AppSync subscriptions above did not deliver
  // `friend_request_received` events (backend wrote no Notifications row,
  // then wrote one but on a channel this listener didn't subscribe to), and
  // this diff-the-cache fallback was the only path. Both gaps are now fixed:
  // the backend writes the row (FR-5) and the publisher dual-publishes to
  // onFriendRequestUpdated AND onNotificationForMe, both of which this
  // listener subscribes to. This fallback stays as defense-in-depth for
  // scenarios where push fails (e.g. AppSync idle disconnect, publisher
  // outage) — the poll still catches new requests on cache refresh.
  //
  // Mechanism: diff successive `['friend-requests','incoming']` query data
  // against the previous snapshot. Any `request_id` that appears in the new
  // snapshot but was NOT in the previous one = a brand-new incoming request
  // → open `IncomingRequestModal` for the newest one.
  //
  // First-render safety: on the first fetch (when `seenRequestIdsRef` is
  // null), seed the set from the current data but DO NOT fire the modal —
  // any rows present at that point are pre-existing and the user already
  // knows about them from the Requests tab.
  //
  // De-dupe with the AppSync path: once the backend FR-5 story lands,
  // both this poll and the subscription may fire for the same request.
  // `incomingModal.open` already uses latest-wins semantics (closes any
  // prior modal before opening a new one), and the modal would just
  // re-open with the same `{userId, requestId}` → visually a no-op.
  const incomingQuery = useIncomingRequestsQuery();
  const seenRequestIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    const data = incomingQuery.data;
    if (data === undefined) return;

    // Seed-only on first fetch — don't fire modal for pre-existing rows.
    if (seenRequestIdsRef.current === null) {
      seenRequestIdsRef.current = new Set(data.map((r) => r.request_id));
      return;
    }

    // Collect new request_ids. Open the modal for the newest (highest
    // created_at) so repeated polls don't flood the user with modals.
    const seen = seenRequestIdsRef.current;
    const freshlyNew = data.filter((r) => !seen.has(r.request_id));
    if (freshlyNew.length === 0) return;

    for (const r of freshlyNew) {
      seen.add(r.request_id);
    }

    // Pick the most recent as the one to surface (ISO strings sort lex =
    // chronological).
    const newest = freshlyNew.reduce((a, b) =>
      a.created_at > b.created_at ? a : b,
    );

    // Latest-wins — close any currently-displayed modal before opening.
    incomingModal.close();
    incomingModal.open(newest.from_user_id, newest.request_id);
  }, [incomingQuery.data, incomingModal]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleAccept = useCallback(
    (_userId: string, requestId: string) => {
      acceptMutation.mutate({ requestId });
    },
    [acceptMutation],
  );

  const handleDecline = useCallback(
    (_userId: string, requestId: string) => {
      declineMutation.mutate({ requestId });
    },
    [declineMutation],
  );

  const handleSayHi = useCallback(
    (acceptorUserId: string) => {
      void openChatRoom(acceptorUserId);
    },
    [openChatRoom],
  );

  // Render nothing when not authenticated — no subscription is running in
  // this case because the component is not mounted by AppTabs' parent.
  // The check here is a safety guard for cases where the auth state races
  // (e.g. a sign-out races with AppState resume).
  if (status !== 'authenticated') {
    return null;
  }

  return (
    <>
      <IncomingRequestModal
        visible={incomingModal.visible}
        profile={incomingModal.profile}
        requestId={incomingModal.requestId}
        onClose={incomingModal.close}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
      <RequestAcceptedModal
        visible={acceptedModal.visible}
        profile={acceptedModal.profile}
        onClose={acceptedModal.close}
        onSayHi={handleSayHi}
      />
    </>
  );
}
