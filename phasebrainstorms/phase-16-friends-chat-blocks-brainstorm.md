# Phase 16 brainstorm — Friend requests, friends, chat backend, blocks (real backend wiring)

## 2026-11-15 12:00 brainstorm

Inputs: `implementationplan/phase-16-friends-chat-blocks.md` (context_summary + 10 stories), current on-disk state of `src/services/`, `src/state/friendship/`, `src/state/chat/`, `src/features/chat/`, `src/features/friendRequests/`, `src/navigation/`, `App.tsx`, `architecture.md` §7.3, §7.5, §8.2, §8.4, §11.2.8, `context.md`.

Findings are grouped into **BLOCKING** (would cause subagent failure or ambiguous dispatch if unaddressed) and **ADVISORY** (worth a PRD note but not strictly a dispatch blocker).

---

### BLOCKING 1 — Friend-request mutation stories are missing (the scope gap the PRD already flagged)

The PRD's `context_summary` explicitly says "the /implement-phase 16 brainstorm must add one or more stories wiring the friend-request REST endpoints ... before story 16.5 / 16.8 can reconcile the modal triggers against the real provider." No existing story owns:

- `GET /friend-requests?direction=incoming|outgoing`
- `POST /friend-requests` (callsites: `SendRequestModal.onConfirmed` in `MarriageLandingScreen` + `BookmarkDeckViewScreen`)
- `POST /friend-requests/{id}/accept` (callsite: `IncomingRequestModal.onAccept`)
- `POST /friend-requests/{id}/decline` (callsite: `IncomingRequestModal.onDecline` AND `OtherProfileScreen` Decline path)
- `DELETE /friend-requests/{id}` (cancel outgoing — no current UI, but the architecture.md §11.2.8 contract lists it; currently only AsyncStorage removal exists)
- Teardown of `FriendshipProvider`'s mock surface (`acceptRequest`/`declineRequest`/`sendRequest`/`outgoingRequestIds`/`hasOutgoingRequest`/`pendingToast`/`ALL_FULL_PROFILES` registry/seed JSONs) and of `src/features/friendRequests/storage/requestsStorage.ts` + `dummy.requests.outgoing` AsyncStorage key.

**Proposed stories to add to the PRD (user to confirm scope):**

- **NEW 16.FR1 — Friend-request endpoint helpers + REST hooks + `mockRequest` fixtures.** Adds `src/features/friendRequests/api.ts` with `useIncomingRequestsQuery()`, `useOutgoingRequestsQuery()`; endpoint helpers in `services/api/endpoints.ts`; fixtures + handlers in `services/api/mocks/mockRequest.ts` for the GET path (happy/empty/500). Query keys `['friend-requests', 'incoming']`, `['friend-requests', 'outgoing']` per §7.3. `depends_on: []`.
- **NEW 16.FR2 — Friend-request mutation hooks + cross-cache invalidation.** `useSendFriendRequestMutation`, `useAcceptFriendRequestMutation`, `useDeclineFriendRequestMutation`, `useCancelOutgoingRequestMutation`. On accept → invalidate `['friend-requests','incoming']` + `['friends']` (incoming count drops; friends row appears). On decline → invalidate `['friend-requests','incoming']` only. On send → invalidate `['friend-requests','outgoing']`. Optimistic updates for accept/decline so the modal dismisses instantly. 409 on POST surfaces as "request already sent" state per architecture.md §11.2.8, not an error banner. `depends_on: [16.FR1]`.
- **NEW 16.FR3 — Modal shape rewire + FriendshipProvider teardown.** Changes: `IncomingRequestModal.onAccept(userId, request_id)` and `.onDecline(userId, request_id)` so the host can call the real mutation (currently only `userId` is passed — request_id is lost); `RequestAcceptedModal.onSayHi(acceptorUserId)` so the host can navigate to the correct chat room (currently the mock host hardcodes `MEHVISH_USER_ID`); delete `FriendshipProvider` and `useFriendship()` in favour of direct query hooks at callsites (`FriendsListScreen`, `ChatListScreen`, `OtherProfileScreen`, both modals' hosts, `ExploreHomeScreen` Requests subtab); delete `src/features/friendRequests/storage/requestsStorage.ts` + the `dummy.requests.outgoing` AsyncStorage key; remove `pendingToast`/`setPendingToast`/`consumePendingToast` cross-screen handoff (real backend confirms Decline synchronously). Grep gate: `grep -r 'TODO(mock-only)' src/state/friendship src/features/friendRequests` returns zero hits. `depends_on: [16.FR2, 16.1]`.

Impact on existing stories after 16.FR1–16.FR3 land:

- **16.8** should gain `depends_on: [16.FR2, 16.FR3]` — its AC "wire modal triggers to real subscription events" is a null-op without real mutations behind the modals.
- **16.9** should gain `depends_on: [16.FR1]` — its cross-cache purge AC lists `['friend-requests','incoming']` and `['friend-requests','outgoing']` keys that don't exist today.
- **16.5** already has a note about the `RequestAcceptedModal.onSayHi` navigation from `MyProfileScreen`. After 16.FR3 ships, that MyProfileScreen host is gone; the AppTabs-root subscription listener (from 16.8) becomes the only host. 16.5's note can be simplified.

---

### BLOCKING 2 — Mock plumbing in the PRD doesn't match reality (MSW is dead)

Multiple stories reference `services/api/mocks/handlers.ts` and MSW-style handlers. On-disk reality:

- **No MSW** anywhere in the dependency tree. Context.md line 30: *"MSW was retired on Hermes because `msw/native` depends on browser globals that would require fragile polyfills."* The mock dispatch is a hand-rolled `src/services/api/mocks/mockRequest.ts` dispatched from `httpClient.request()` when `env.isMock === true`.
- **No `handlers.ts`** — all mock responses live in `mockRequest.ts`.
- The `env.ts` comment at line 118 still says "MSW mock mode is active" — stale leftover.

Fixup: all PRD ACs mentioning `services/api/mocks/handlers.ts` (stories 16.1 and 16.9) should say "extends `src/services/api/mocks/mockRequest.ts` with handlers for …". Same for story 16.3's "MSW-like GraphQL mocking" — see BLOCKING 3.

---

### BLOCKING 3 — AppSync mock-mode path is unowned

Architecture §8.4 says *"Realtime (AppSync) subscriptions are mocked by a `mockAppsyncClient.ts` that emits scripted events from a fixture stream."* No story owns this. Story 16.3's AC references "MSW-like GraphQL mocking" with no concrete mock client. Three questions the brainstorm must settle:

1. Is `env.isMock` on also when developing chat? If yes, `mockAppsyncClient.ts` is required (otherwise `useRoomsQuery`/`useMessagesQuery` have no data source in mock mode and on-device dev stops working).
2. Or is chat strictly real-backend-only, and `env.isMock` is scoped to REST while AppSync requires live AppSync endpoints always? That means mock mode becomes a hybrid (REST mocked, AppSync live) — needs an explicit `env.isMockAppsync` flag separate from `env.isMock`.
3. Who owns adding `mockAppsyncClient.ts` + fixture stream + per-subscription scripted emit + dedupe-event fixture? It's not in 16.3 (which ships the real client), not in 16.4 (which ships the hooks). Options: expand 16.3 to also ship the mock client, OR add a dedicated **NEW 16.M1 — Mock AppSync client + fixture stream** story with `depends_on: []`.

**Recommendation:** add 16.M1 as its own story, make 16.4's hook tests use it, and add `env.isMockAppsync` alongside `env.isMock`. Keeps the mock boundary clean.

---

### BLOCKING 4 — AppSync client path drift + Amplify.configure singleton conflict

- PRD AC 16.3(a) says `src/services/api/appsyncClient.ts`. On-disk it's `src/services/graphql/appsyncClient.ts` (a stub with `TODO(phase-17)`). Not a true blocker but needs an explicit call: keep the existing path (consistent with arch.md §7.5's `services/graphql/appsyncClient.ts` and §8.1's "GraphQL + subscriptions via AppSync: `services/graphql/appsyncClient.ts`"), update the PRD AC to match.
- `cognitoClient.ts` already calls `Amplify.configure({ Auth: { Cognito: {...} } })` idempotently via `ensureConfigured()`. Adding `API: { GraphQL: {...} }` requires either (a) merging the config into one Amplify.configure call shared between `cognitoClient` and `appsyncClient` or (b) calling `Amplify.configure` twice (second call MERGES, not overwrites, per Amplify v6 docs — but needs verification). The current `ensureConfigured()` guard (`_amplifyConfigured = true`) will **block** a second configure call. Story 16.3 needs to either:
  - Refactor `cognitoClient.ensureConfigured()` into a shared `amplifyConfig.ts` that owns the full Auth+API config and is called by both clients, OR
  - Explicitly document that `appsyncClient.getAppsyncClient()` calls `Amplify.configure` with the API block and resets the shared singleton guard.

AC 16.3 should name the chosen path.

---

### BLOCKING 5 — Route-param convention (`friendUserId` vs `roomId`) must be decided now, not at dispatch time

Current state:

- `ChatStackParamList.ChatRoomScreen: { friendUserId: string }` — phase 15's shape.
- Phase 16 brings `Room` objects with server-generated `roomId`.
- Story 16.5 AC(e) says "decide at story time and document" — but 16.6, 16.7, and `openChatRoom.ts` ALL hinge on this decision, so deferring to "story time" means 16.6/16.7 subagents will each make inconsistent independent calls.
- Story 16.7's deep-link `knotify://chat/room/:roomId` uses `roomId`. If `ChatStackParamList.ChatRoomScreen` stays `{ friendUserId }`, then the deep-link resolver needs to intercept, call `createOrGetRoom(roomId)`-reverse-lookup, resolve back to `friendUserId`, and navigate. Awkward.
- `openChatRoom.ts` (phase 15) calls `navigate('ChatRoomScreen', { friendUserId })` — currently consumed by every host that opens chat (OtherProfileScreen, MyProfileScreen via RequestAcceptedModal, future block-action-unblock path).

**Recommendation:** switch the route param to `{ roomId: string }`, and wrap the "I have a userId, give me a room" lookup inside `openChatRoom.ts` (which now calls `useCreateOrGetRoomMutation.mutateAsync({ userId })` then `navigate('ChatRoomScreen', { roomId })`). All existing callsites of `openChatRoom(userId)` keep working; only `ChatRoomScreen` and `ChatStack` types change. Deep-link resolver is trivial. Document this in story 16.5 and propagate to 16.6/16.7.

---

### BLOCKING 6 — Deep-link scaffolding is more than one route

`src/navigation/linking.ts` currently exports `{ prefixes: [], config: { screens: {} } }` — not functional. Story 16.7's AC "register `knotify://chat/room/:roomId`" implicitly requires bootstrapping the whole linking config (the `knotify://` prefix, the nested screens map through `AppTabs > Chat > ChatRoomScreen`, the universal-link https prefix if we want warm-start from a browser).

Also: `buildShareMessage.ts` already emits `knotify://profile/<user_id>` share links that nothing resolves today. 16.7 may or may not wire that too — the PRD doesn't say. Either explicitly include `knotify://profile/:userId` resolution to `AppTabs > Explore > OtherProfileScreen` in 16.7's scope, or add a note that the profile-share link stays unresolved for this phase.

**Recommendation:** 16.7 bootstraps `linking.ts` end-to-end (prefixes + nested route map) and resolves both chat and profile share links. One story, fuller scope, no half-scaffolding left behind.

---

### BLOCKING 7 — Modal callback signatures lose data the real backend needs

- `IncomingRequestModal.onAccept(userId: string)` and `.onDecline(userId: string)` pass only the sender's `user_id`. Real `POST /friend-requests/{id}/accept` is keyed on **`request_id`**, not `user_id`. The host currently has no way to recover `request_id` from `user_id` without a lookup. The modal has the full `PendingRequest` row in scope via its `profile` prop — but `PendingRequest.request_id` is on the request row, not the profile. See `FriendshipProvider.PendingRequest`.
- `RequestAcceptedModal.onSayHi()` takes NO arguments. The mock host hardcodes `MEHVISH_USER_ID`. For a real subscription-driven mount, the host must know WHICH user accepted — but the modal doesn't give it to them.

Both are addressed by 16.FR3 (see BLOCKING 1). Noting here because the mismatch is subtle and easy for a subagent to miss if it just "swaps the data source."

---

### BLOCKING 8 — Subscription scope is narrower than the PRD implies

Story 16.6 AC(d): *"Message status icons on sent bubbles (sent / delivered / read) driven by real server state, not seed constants."*

Architecture §7.5 lists four room subscriptions (`onMessageInRoom`, `onTypingInRoom`, `onReadReceipt`, non-room `onNotificationForMe` etc.). Story 16.4 only wires `useOnMessageAddedSubscription`. **Read-receipts** require `onReadReceipt(roomId)` — not scoped.

Options: (a) drop AC(d)'s "delivered / read" requirement from 16.6 and leave the status icon logic client-side-only (every sent message stays `'sent'`); (b) expand 16.4 to include `useOnReadReceiptSubscription` + cache merge; (c) add a separate story for read-receipts, explicitly out of phase 16.

**Recommendation:** go with (a) for this phase. Delivered/read receipts + typing indicators are a legitimate P1 follow-up but tripling the subscription surface of this phase will push dispatch time out significantly. Update 16.6 AC(d) to: *"Status icon on sent bubbles renders `'sent'` by default; `'delivered'`/`'read'` are stubbed pending read-receipt subscription (deferred)."*

---

### BLOCKING 9 — Teardown surface is wider than story 16.5's grep check

Story 16.5 AC: `grep -r 'TODO(mock-only)' src/features/chat` and `src/state/chat` returns zero hits. Fine for chat. But the ambient TODO(mock-only) surface in the repo is broader (grep across `src/` today). Items NOT scoped to any current phase-16 story:

- `src/state/friendship/FriendshipProvider.tsx` (~12 TODO(mock-only) hits) → covered by 16.FR3 (see BLOCKING 1).
- `src/features/friendRequests/storage/requestsStorage.ts` (file-level TODO) → covered by 16.FR3.
- `src/features/chat/navigation/openChatRoom.ts` → covered by BLOCKING 5's retrofit.
- `App.tsx` `TODO(mock-only)` comments around `FriendshipProvider`, `ChatProvider` provider mounts → covered naturally when 16.5 and 16.FR3 delete those providers.
- `OnboardingCompletionProvider` TODO → **out of phase 16 scope** (that's registration-mock teardown per context.md "Before shipping" items 1–8, which requires real Cognito wiring, not real friends/chat/blocks wiring). Explicitly park.

Add a phase-level AC to the PRD (or to story 16.FR3): after all phase 16 stories ship, `grep -r 'TODO(mock-only)' src/state/friendship src/state/chat src/features/chat src/features/friendRequests` returns zero hits. Registration-mock TODOs stay — they're the next phase's teardown.

---

### BLOCKING 10 — 16.5 and 16.6 both depend_on 16.4 but implicitly serialize via `useChatHistory` deletion

`ChatRoomScreen` imports `useChatHistory` from `ChatProvider`. Story 16.5 deletes `ChatProvider` and the storage helper. Story 16.6 rewires `ChatRoomScreen` to `useMessagesQuery` + `useOnMessageAddedSubscription`. If 16.6 runs BEFORE 16.5, the subagent has to decide whether to delete `useChatHistory` as part of 16.6 (but 16.5's AC says that deletion happens there), or leave the file in a dual-wired state. If 16.6 runs AFTER 16.5, `ChatRoomScreen` is already broken (imports a deleted module) at the start of 16.6.

**Recommendation:** either (a) merge 16.5 + 16.6 into a single story, or (b) make 16.6 `depends_on: [16.5]` so `ChatProvider` deletion happens first and 16.6's subagent walks into a clean slate. Prefer (b) — keeps stories small.

---

### ADVISORY 11 — `AppTabs` subscription-listener mount surface has no existing precedent

Story 16.8 AC: *"Mount surface — a subscription-listener at the root of `AppTabs` (or an equivalent shared root) that resolves the incoming request's sender profile and opens the modal."*

No subscription-listener component exists yet. The subagent will have to invent a new pattern. Worth adding a note to the PRD about:

- Where exactly it mounts (above `Tab.Navigator`? Inside `AppTabs` but above `Tab.Screen`? A sibling `<FriendRequestSubscriptionListener />` component?). Pick one and name it.
- Whether modal state (which profile is currently open, visibility) lives in the listener's `useState` or in a dedicated `IncomingRequestsProvider`. The current MyProfileScreen host uses local `useState` — fine for one subscription event; marginal for "multiple rapid events" per AC.
- What AppTabs does when the user is NOT authenticated (subscription-listener should be gated on `authStatus === 'authenticated'`, obvious but worth stating).

Not a blocker; a subagent can decide inline, but naming the pattern in the PRD reduces debate during review.

---

### ADVISORY 12 — Blocks block action on `ChatRoomScreen` from the triple-dot menu

Story 16.10 says "overflow-menu placeholder pending design brainstorm." `ChatRoomScreen.handleMenuPress` is currently a `console.log` no-op. Add a one-line AC: *"Triple-dot overflow menu on ChatRoomScreen opens an ActionSheet (or equivalent) with a single 'Block' item for this phase; menu scaffolding ships here but visual design beyond 'single item sheet' is deferred."* Otherwise the subagent will either (a) do nothing and leave the menu a no-op (regression vs AC), or (b) over-invest in a full menu framework.

---

### ADVISORY 13 — Context.md "Before shipping" items 1 + 9 still hang

Context.md "Before shipping" items 1 (wire `custom:profile_complete` claim decode — ALREADY done per `src/state/auth/AuthProvider.tsx` lines 117–135, but item 1 wasn't updated) and 2 (verify Cognito refresh returns a fresh ID token with the updated claim — still hangs). Not phase-16 scope, but worth updating "Before shipping" at phase-completion time so the list stops carrying outdated items. A low-effort bookkeeping fix.

Also, item 9 (YES/NO uppercase casing for backend writes) is a phase 7/8 artifact; verify before real-backend production. Not phase 16 scope.

---

### ADVISORY 14 — Stale memory to correct in-session

Auto-memory `wip_deck_backend_wiring.md` references branch `feat/real-deck-from-backend` commit `f9fa624` as broken. Recent commits `885921f` / `ce50b70` / `9f41c3f` shipped deck backend wiring via a different branch (`feat/deck-profile-marital-marriage-fields`). The WIP memory is stale and should be removed before it misleads a future session. (Not a phase-16 artefact; flagging because it came up during session-resume reconciliation.)

---

### Summary — decisions required from the user before Step 1 (issue creation)

1. **Add 16.FR1, 16.FR2, 16.FR3 stories to the PRD** (friend-request wiring + modal shape rewire + FriendshipProvider teardown) — BLOCKING 1.
2. **Add 16.M1 story (or expand 16.3)** for `mockAppsyncClient.ts` + `env.isMockAppsync` flag — BLOCKING 3.
3. **Fix PRD language** on MSW/handlers to match `mockRequest.ts` reality — BLOCKING 2.
4. **Correct 16.3's AC path** to `src/services/graphql/appsyncClient.ts` and decide whether `cognitoClient.ensureConfigured()` gets refactored into a shared Amplify config module — BLOCKING 4.
5. **Decide the route-param convention** (`roomId` vs `friendUserId`), update 16.5 to specify, and propagate to 16.6/16.7 — BLOCKING 5.
6. **Rescope 16.7** to bootstrap `linking.ts` end-to-end (both chat and profile deep links) — BLOCKING 6.
7. **Soften 16.6 AC(d)** to defer delivered/read status icons — BLOCKING 8.
8. **Make 16.6 depend_on 16.5** (or merge) — BLOCKING 10.
9. **Add explicit depends_on wiring** on 16.8 ([16.FR2, 16.FR3]) and 16.9 ([16.FR1]) — BLOCKING 1 ripple.
10. **Add a phase-level teardown grep gate** scoped to the friends/chat/friendRequests folders — BLOCKING 9.

If the user picks `proceed` without addressing these, the subagents will almost certainly either stall, invent inconsistent solutions, or ship partial scope. Strongly recommend `address`.

---

## 2026-11-15 13:00 brainstorm (re-run after PRD rewrite)

Inputs: the rewritten `implementationplan/phase-16-friends-chat-blocks.md` (14 stories after adding 16.FR1/16.FR2/16.FR3/16.CH1/16.CH2 and dropping the chat-deep-link scope to phase 17's 17.5). Grounded on current on-disk state of `architecture.md` §7.5, §11.2.8, backend-config, and `src/`.

The big items from the first brainstorm (10 BLOCKING) are resolved in the rewrite. What follows is the residual gap list — smaller items the subagents could still trip on.

---

### BLOCKING 15 — AppSync subscription names in the PRD don't match the architecture spec

The rewritten story 16.8 references `onFriendRequestReceived` and `onFriendRequestAccepted` as the two subscriptions the `FriendRequestSubscriptionListener` listens to. These names come from phase 15's label file (which was written against a planned schema), not from the real AppSync schema.

Architecture §7.5 (line 716) and §11.2.8 (line 1077) both say the real subscription is a single **`onFriendRequestUpdated`** — one subscription, with a `status` field on the payload (`'pending' | 'accepted' | 'declined' | 'cancelled'` per `db-schema → enums.friendRequestStatus`).

**Impact:** story 16.8 would either (a) try to subscribe to subscriptions that don't exist on the real schema and fail, or (b) force the subagent to invent two new subscriptions server-side (out of scope). The listener needs to switch to one `onFriendRequestUpdated` subscription with a branch on `payload.status`: `'pending'` + my user_id is the recipient → open `IncomingRequestModal`; `'accepted'` + my user_id is the sender → open `RequestAcceptedModal`; other transitions → no modal, just cache invalidation.

**Fix:** update story 16.8's AC and context_summary to use `onFriendRequestUpdated` + status-branching dispatch logic. 2-line PRD edit, high-impact.

---

### BLOCKING 16 — Backend-config placeholders still unfilled

`src/config/backendConfig.prod.json` (and the dev counterpart) still contain `<FILL_APPSYNC_API_ID>` for both `appsync.graphqlUrl` and `appsync.realtimeUrl`. `src/config/env.ts` throws at import time on any `<FILL_*>` placeholder — that's a design feature (prevents silent misconfig), but it means story 16.3's `ensureAmplifyConfigured()` call would crash the app the moment any code imports `env`.

**Impact:** story 16.3 would fail during its very first test run with a cryptic env-placeholder error. The subagent would stall, write a `BLOCKED: backend-config has <FILL_...> placeholders for appsync.graphqlUrl` note, and the dependent stories (16.4 → 16.5 → 16.6 → 16.CH1/CH2) would all skip.

**Fix options:**
- A. User provides the real AppSync URLs now (as they offered on BLOCKING 3 answer: "I can provide temporary credentials for you to check"). Updates `backendConfig.dev.json` before dispatching 16.3.
- B. Story 16.3 adds a `<FILL_...>` → `env.appsyncUrl === undefined` escape hatch so dev tests work with absent values, and the real values are populated at integration time.

**Recommendation:** A. The user explicitly offered to provide credentials. Preferable to real values in `backendConfig.dev.json` (gitignored or committed to a dev-only branch) before story 16.3 dispatches. Option B creates a broken escape hatch that can hide real misconfig later.

---

### BLOCKING 17 — `useProfileQuery` is referenced but doesn't exist

Stories 16.5 and 16.6 both reference `useProfileQuery(userId)` (for resolving the counterpart profile in a chat room header, and for resolving participant profiles in the rooms list). Grep confirms: no such hook exists today. `services/api/endpoints.ts` has `profileApi.getMe` + `matchApi.getDeck` but no `getProfileById` helper. Architecture §8.3 example code shows a `getProfileById(userId)` on `profileApi`, but it was never implemented — phase 12's `OtherProfileScreen` resolves profiles via `FriendshipProvider.getFullProfile()` (which reads the local fixture registry).

**Impact:** story 16.5 subagent hits the first `useProfileQuery` call, finds nothing, and either (a) stalls, or (b) invents the hook mid-story. Option (b) is better but still creates a story-scope creep.

**Fix:** add either (a) a new story `16.P1 — GET /profiles/:userId endpoint + useProfileQuery hook` ahead of 16.5, OR (b) explicit AC in 16.FR3 or 16.5 that ships `profileApi.getProfileById` + `useProfileQuery` as part of the teardown (since `FriendshipProvider.getFullProfile` goes away, something has to replace its resolver role).

**Recommendation:** add the hook as part of story 16.FR3's scope (since it's the story that deletes `getFullProfile`). One extra bullet under 16.FR3's AC, no new story needed. Explicitly name `profileApi.getProfileById(userId)` + `useProfileQuery(userId)` keyed on `['profile', userId]` per §7.3.

---

### BLOCKING 18 — Backgrounded-app subscription behaviour is silently different from mock

AppSync subscriptions have a 10-minute idle timeout per `backend-config → appsync.idleTimeoutMinutes` (noted in arch §7.5). When the app is backgrounded for more than the idle window, WebSocket subscriptions drop. The `FriendRequestSubscriptionListener` + chat subscriptions will NOT fire for incoming events while the app is backgrounded.

The mock dev-triggers tested the modal UX from a user explicitly in the app. In production, incoming friend requests / chat messages that arrive while the app is in the background depend on push notifications (phase 17 scope) to wake the user, and the modal / room-badge is driven by a cold-start refetch when the app returns to foreground, NOT by a stale subscription event.

**Impact:** not a code bug but a scope boundary. If the PRD is silent, the subagent may reasonably test only the foreground-active path and declare the AC met — missing the "app returns from background, modal does NOT fire retroactively, but cache is refreshed via `useQuery` refetchOnWindowFocus or an explicit `onAppStateChange`" scenario. Without that explicit refetch path, a user who backgrounds for 15 minutes then returns will see a stale friends count.

**Fix:** add a one-line AC to story 16.8: *"`FriendRequestSubscriptionListener` re-subscribes on `AppState === 'active'` after a background transition; incoming requests received during the background window are picked up by invalidating `['friend-requests','incoming']` on resume rather than replayed as modal events."* Similar one-liner for `ChatRoomScreen` in story 16.6: refetch `['messages', roomId]` on `AppState === 'active'`.

---

### BLOCKING 19 — Typing-event SEND path is not in the architecture

Story 16.CH2's AC says *"`ChatRoomScreen` composer sends a typing event on every input change (throttled to one event every ~2 seconds)"*. But architecture §11.2.8 (line 1076) lists only three AppSync mutations: `createOrGetRoom(userId)`, `sendMessage(roomId, content)`, `markAsRead(roomId)`. There is NO documented `sendTypingSignal(roomId)` mutation. `onTypingInRoom(roomId)` is a subscription, so SOMETHING on the client must emit the event, but the arch is silent on what that mutation is called or whether it exists.

**Impact:** 16.CH2 subagent either (a) invents a mutation name and hopes the server accepts it, (b) discovers the server doesn't have it and stalls, or (c) scope-cuts to subscription-only ("we receive typing events but never emit them").

**Fix:** split 16.CH2 into a smaller scope — subscribe-only, no outbound. The inbound path is still valuable (other user's typing shows). Outbound typing is deferred until the AppSync schema is confirmed to expose a send-typing primitive. Alternatively: the user confirms via credentials check whether the real schema has a typing send-mutation, and we update the AC.

**Recommendation:** split. Update 16.CH2 AC to say *"`ChatRoomScreen` subscribes to `onTypingInRoom(roomId)` and renders the typing row for incoming events. Outbound 'I am typing' events are deferred pending verification of the AppSync mutation schema."* If the user confirms the send-mutation exists, a one-line AC addition can bring it back.

---

### ADVISORY 20 — `onReadReceipt` + `markAsRead` outbound: the verbs line up this time

Unlike BLOCKING 19, architecture §11.2.8 DOES list `markAsRead(roomId)` as a mutation. Story 16.CH1's AC "on focus/visibility fires an outbound read receipt" maps cleanly to `markAsRead(roomId)`. No change needed; just worth confirming the subagent uses the arch's exact mutation name.

---

### ADVISORY 21 — Dirty working tree before dispatch

`git status` shows the PRD rewrite + the brainstorm file are uncommitted. The subagents will branch off `development` for their feature work, so the uncommitted PRD edits would NOT land in their worktree. That means the subagents would read the OLD PRD content — which is now wrong.

**Fix before Step 1:** commit the PRD-restructure changes to `development` (chore commit, direct push is fine per the pattern established in commit `5e6d2c2`). File list to commit:
- `implementationplan.md`
- `implementationplan/phase-16-friends-chat-blocks.md`
- `implementationplan/phase-17-settings.md`
- `phasebrainstorms/phase-16-friends-chat-blocks-brainstorm.md` (new file)
- `QA/explanations.txt` (user's layman walkthrough)

`QA/answers.txt` was deleted — intentional per the user's rename of that file.

---

### ADVISORY 22 — Teardown coverage: 16 source files + 17 tests touch the mock providers

Grep confirms 16 source files and 17 test files currently import `FriendshipProvider` / `ChatProvider` / `useFriendship` / `useChatHistory` / `MEHVISH_USER_ID`. Stories 16.5 and 16.FR3 implicitly touch every one of these. The subagents need to be briefed that this is a large touch-list — not a 2-file rewire. The PRD doesn't explicitly say "16 source files + 17 tests" but it should so the subagent isn't surprised mid-story.

**Fix:** add a one-liner to 16.FR3 and 16.5's notes that enumerates the callsite scope (numbers don't need to be exact; "every importer of these providers" is enough).

---

### Summary — decisions required before Step 1

1. **Fix subscription names** in story 16.8 — `onFriendRequestUpdated` with a status branch, not two separate subs. **BLOCKING 15.**
2. **User provides real AppSync URLs** so backend-config placeholders can be populated before 16.3 dispatches. **BLOCKING 16.**
3. **Add `profileApi.getProfileById` + `useProfileQuery`** to 16.FR3's AC. **BLOCKING 17.**
4. **Add AppState resubscribe + refetch AC** to 16.8 and 16.6. **BLOCKING 18.**
5. **Split 16.CH2 to subscribe-only** pending send-mutation verification. **BLOCKING 19.**
6. **Commit the PRD rewrite** before Step 1 creates tracking issues. **ADVISORY 21.**
7. **Document teardown touch-list scope** in 16.5 + 16.FR3 notes. **ADVISORY 22.**

Items 1, 3, 5 are pure PRD edits (~10 minutes). Item 2 is a user action (provide creds). Items 4, 7 are one-liners. Item 6 is a two-command commit.

If the user picks `proceed` as-is, expected failure modes: story 16.3 crashes on placeholder env values, story 16.5/16.6 stall on missing `useProfileQuery`, story 16.8 fails against unknown subscription names, story 16.CH2 invents a mutation. Recommend `address` one more time to get these cleaned up; the remaining fixes are small compared to the first-round brainstorm.

---

## 2026-11-15 23:51 brainstorm (Round 3 — dispatch-time drift audit)

Inputs: current `implementationplan/phase-16-friends-chat-blocks.md` (post-Round-2 rewrite, 14 stories), fresh on-disk audit of `src/services/`, `src/state/friendship/`, `src/state/chat/`, `src/features/chat/`, `src/features/friendRequests/`, `src/navigation/`, `App.tsx`, `src/config/backendConfig.dev.json`, `package.json`, prior two brainstorm sections.

**Purpose.** Final check before dispatch: has anything drifted on-disk since the Round-2 rewrite landed on 2026-11-15, and are any new gaps present?

**Verdict.** **Proceed.** PRD is implementable as-written. No BLOCKING items. Minor pre-condition notes below belong in the dispatch brief, not the PRD.

---

### CONFIRMED (spot-checks against the current PRD)

- `src/config/backendConfig.dev.json` has real `appsync.graphqlUrl` + `appsync.realtimeUrl` populated (subdomain `26ve3dcqxbh2zgd2hf2ylbn76q.appsync-{api,realtime-api}.eu-central-1.amazonaws.com/graphql`). Prod values still placeholder (out of phase-16 scope).
- `package.json` carries `aws-amplify ^6.18.0`, `@tanstack/react-query ^5.101.3`, `@react-native-async-storage/async-storage 2.2.0`. Amplify v6 modular imports available.
- `src/services/graphql/appsyncClient.ts` is a stub with two `TODO(phase-17)` tags (lines 22, 30). Story 16.3 owns rewriting this (notes field in PRD already corrects the phase tag to 16).
- `src/services/auth/cognitoClient.ts` still uses `ensureConfigured()` idempotent guard (line 39) — exactly the refactor target in story 16.3's shared-Amplify-config AC.
- `FriendshipProvider` surface matches the PRD's "What phase 15 already shipped" claim (friends, requests, acceptRequest, declineRequest, sendRequest, outgoingRequestIds, hasOutgoingRequest, getFullProfile).
- `ChatProvider` exports `useChatHistory()` + `MEHVISH_USER_ID` constant — matches PRD's teardown list.
- `AppTabs.tsx` has a clean insertion point directly above `<Tab.Navigator>` for the new `FriendRequestSubscriptionListener`.
- `src/navigation/linking.ts` is an empty stub (`prefixes: []`, `screens: {}`) — confirms the Round-2 decision to defer all deep-link bootstrapping to phase 17 story 17.5.
- `src/services/api/endpoints.ts` exposes `profileApi` with `getMe()` + `updateMe()` only (no `getProfileById`); story 16.FR3 adds the missing method as-planned.
- `App.tsx` still mounts `<FriendshipProvider>` + `<ChatProvider>` with `TODO(mock-only)` comments — exactly the teardown targets of 16.FR3 (friendship) and 16.5 (chat).

### DISPATCH-BRIEF NOTES (not PRD defects — pre-conditions implementers will encounter)

- **Modal signatures are still pre-rewrite.** `IncomingRequestModal.onAccept` / `.onDecline` currently receive `(userId: string) => void` and `RequestAcceptedModal.onSayHi` currently receives `() => void` (no args). Story 16.FR3's AC rewrites these to `(userId, requestId)` and `(acceptorUserId)` respectively. The subagent on 16.FR3 should expect to edit both the modal signature AND every host callsite in one go — not assume prior code already shipped the new shape.
- **Route-param is still `{ friendUserId }`.** `src/navigation/types.ts:93` declares `ChatRoomScreen: { friendUserId: string }` and `src/features/chat/navigation/openChatRoom.ts:88` navigates with `{ friendUserId: userId }`. Story 16.5's AC explicitly executes the switch to `{ roomId }`; subagent should expect to edit types.ts + openChatRoom.ts + every destructure of the route param in one commit.
- **FriendsListScreen does NOT exist on disk.** Story 16.2 creates it from scratch. (Not drift — PRD AC is phrased correctly as "renders the friend list", not "updates the existing screen".) Subagent should scaffold a new file at `src/features/friends/screens/FriendsListScreen.tsx` with a route entry in whichever stack hosts it (either Explore or a new Friends stack — the PRD does not pin the host; subagent decides based on existing navigation shape).
- **`useCancelOutgoingRequestMutation` has no obvious UI callsite today.** Story 16.FR2 ships the mutation hook, but the Explore Requests subtab in phase 15 only renders INCOMING requests. The hook can still land green (hook unit tests cover success + cache invalidation), but there's no screen that will call it this phase. Leaving it in is fine — a future phase adds the outgoing-request cancel UI and consumes it. Flag this to the 16.FR2 subagent so they don't hunt for a non-existent callsite.

### INFORMATIONAL

- Stale WIP branch `feat/real-deck-from-backend` (commit `f9fa624`) still exists on `origin`. Not blocking phase 16. User-memory already tracks it as separate work.
- 30-ish `TODO(mock-only)` hits across the four grep-gate paths (`src/state/friendship`, `src/state/chat`, `src/features/chat`, `src/features/friendRequests`). The phase-level teardown AC requires zero hits in these paths at phase-end; registration-mock TODOs elsewhere (OnboardingCompletionProvider, httpClient.ts, cognitoClient.ts) are explicitly out of scope per PRD lines 184–189.
- Last commit on `development` is `b99dcb0` "house keeping"; last non-merge PR was `#144` (plan merge). No new feature work has landed since the Round-2 rewrite — the PRD and disk are in sync.

---

### Recommendation

**proceed.** Round 1 and Round 2 already caught everything structural. Round 3 is a clean dispatch. The three dispatch-brief notes above should be included verbatim in the briefs for stories 16.FR3, 16.5, 16.2, and 16.FR2 respectively.

