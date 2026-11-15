phase: 16
title: Friend requests, friends, chat backend, blocks (real backend wiring)
last_updated: 2026-11-15 (merged from original phases 16 Friends, 17 Chat, 18 Blocks)

context_summary: |
  Phase 16 is a **thin** post-onboarding phase per §11.2.8, merged on 2026-11-15 from
  three originally-separate phases:

    - Original phase 16: Friends (GET /friends + FriendsListScreen).
    - Original phase 17: Chat - AppSync backend wiring (rooms + realtime messages).
    - Original phase 18: Blocks (GET/POST/DELETE /blocks + cross-cache purge + BlockedUsersScreen).

  They were merged because they share a single theme: wiring the real backend under
  the mock surfaces that phase 15 shipped for friend-requests + chat, and adding the
  related cross-cutting screens (friends list, blocked-users list, block entry
  points). After this phase the user can send, receive, accept, decline, cancel
  friend requests, chat in real time, and block / unblock other users — all backed
  by the real backend, no mocks.

  **What phase 15 already shipped (do NOT rebuild here):**

  - `ChatStack` in `src/navigation/ChatStack.tsx` (`ChatListScreen` + `ChatRoomScreen`).
  - `ChatListScreen` at `src/features/chat/screens/ChatListScreen.tsx` — WhatsApp-style
    friends × last-message + timestamp list.
  - `ChatRoomScreen` at `src/features/chat/screens/ChatRoomScreen.tsx` — WhatsApp-style
    thread with tiled `bgDark.jpg`, mic↔send composer toggle, header back + avatar +
    name + triple-dot no-op.
  - `MessageBubble` component + `formatChatTimestamp` helper.
  - `ChatProvider` + `useChatHistory(friendUserId)` hook — mock-only, backed by
    `src/features/chat/storage/chatHistoryStorage.ts` + `assets/dummychat/chatMehvish.json`
    seed.
  - `FriendshipProvider` + `useFriendship()` hook — mock-only, backed by
    `src/features/friendRequests/storage/requestsStorage.ts` (`dummy.requests.outgoing`
    key) and an in-memory `friends` / `requests` / `acceptRequest` /
    `declineRequest` / `sendRequest` / `outgoingRequestIds` / `hasOutgoingRequest`
    surface.
  - `IncomingRequestModal` + `RequestAcceptedModal`, dev-triggered from
    `MyProfileScreen` Edit tab via `DevTriggersPanel` (both grep-tagged
    `TODO(mock-only)`).
  - `BookmarksProvider` + star-button bookmark toggle on `MarriageLandingScreen` +
    bookmarks subtab in `ExploreHomeScreen` + `BookmarkDeckViewScreen`.

  **What phase 16 does (across all three sub-areas):**

  1. **Friends.** Wire `GET /friends`, replace the mock `FriendshipProvider.friends`
    surface, feed `FriendsListScreen` (new stub in this phase) + the Explore Friends
    subtab (already wired in phase 13 against the mock provider). (Ex-16.1, 16.2.)

  2. **Chat backend.** Wire the Amplify GraphQL / AppSync client with the JWT from
    `authStore`, add `useRoomsQuery / useMessagesQuery /
    useCreateOrGetRoomMutation / useSendMessageMutation /
    useOnMessageAddedSubscription` per §8.3, swap `useChatHistory` in `ChatProvider`
    for the real hooks via a shape adapter, delete the mock storage helper + seed
    JSON per the phase-15 teardown checklist, register the
    `knotify://chat/room/:roomId` deep-link, and wire the subscription-driven
    `IncomingRequestModal` + `RequestAcceptedModal` triggers (deleting
    `DevTriggersPanel` + its labels alongside). The `ChatListScreen`, `ChatRoomScreen`,
    `MessageBubble`, modal components, and `formatChatTimestamp` helper all stay
    visually untouched — only the data source underneath swaps. (Ex-17.1 … 17.6.)

  3. **Blocks.** Wire GET /blocks, POST /blocks, DELETE /blocks/{userId} with hooks
    `useBlockedUsersQuery / useBlockUserMutation / useUnblockUserMutation`.
    `useBlockUserMutation.onSuccess` invalidates or surgically purges `['deck']`,
    `['search']`, `['bookmarks']`, `['friends']`, `['friend-requests','incoming']`,
    `['friend-requests','outgoing']`, `['rooms']`, and any `['messages', roomId]`
    cache where the blocked user is the counterpart. `useUnblockUserMutation.onSuccess`
    invalidates `['blocked-users']` only (no cross-cache work — unblock does not
    re-populate discovery). Stub `BlockedUsersScreen` + block-action entry points on
    `OtherProfileScreen` and `ChatRoomScreen` (overflow-menu placeholder pending
    design brainstorm). (Ex-18.1, 18.2.)

  **Scope gap flagged for /implement-phase brainstorm:**

  Per architecture.md the real friend-request mutation endpoints are `GET
  /friend-requests`, `POST /friend-requests`, `POST /friend-requests/{id}/accept`,
  `POST /friend-requests/{id}/decline`, and `DELETE /friend-requests/{id}` (cancel
  outgoing). None of original phases 16/17/18 owned an explicit story for these
  mutations — phase 13 and phase 15 PRDs both forward-reference "a later phase" for
  them. The user's merge instruction explicitly called out "friend request sending,
  receiving, accepting, rejecting" as in scope for this phase, so the
  /implement-phase 16 brainstorm must add one or more stories wiring the
  friend-request REST endpoints (hooks + MSW fixtures +
  `FriendshipProvider` real wiring + `IncomingRequestModal.onAccept` /
  `.onDecline` → real mutation, `SendRequestModal` → real `POST
  /friend-requests`, dev-trigger teardown) before story 16.5 / 16.8 can reconcile
  the modal triggers against the real provider.

  **Design cross-check for the chat-shape adapter:**

  `ChatRoomScreen` and `ChatListScreen` were built against a mock data shape
  (`ChatMessage` with `sender: 'me' | 'friend'`, local ids, `status`). Phase 16 must
  reconcile that shape with the real GraphQL `Message` type. Where the shapes differ
  (e.g. `senderUserId: string` on the server vs. `sender: 'me' | 'friend'` on the
  client), add a thin adapter in `src/features/chat/shapeAdapters.ts` that maps
  server → client shape and preserves the existing screen contracts. Adapter is pure
  and unit-tested.

  Visual layout for `FriendsListScreen` and `BlockedUsersScreen` is deferred to the
  /implement-phase brainstorm. Overflow-menu UX on `OtherProfileScreen` /
  `ChatRoomScreen` for the block action is also a brainstorm concern.

stories:
  - id: 16.1
    title: Friends endpoint + hook + MSW fixtures
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `src/features/friends/api.ts` exposes `useFriendsQuery()` returning a typed friend list.
      - Query key follows the tuple convention from §7.3 (`['friends']`).
      - `services/api/mocks/handlers.ts` gains a GET /friends handler with fixtures for happy-path list, empty list, and 500.
      - Hook tests cover happy-path, empty, and error mapping.
    notes: "Ex-16.1 (original phase 16, Friends)."

  - id: 16.2
    title: FriendsListScreen thin wire
    agent: frontenddeveloper
    done: false
    depends_on: [16.1]
    acceptance_criteria:
      - `FriendsListScreen` renders the friend list via `FlatList` of `ListRow`; tapping a row navigates to `OtherProfileScreen` with `userId` typed through the ParamList.
      - Loading / ready / error / empty states use catalog `LoadingState`, `EmptyState`, `ErrorState` explicitly.
      - Screen wiring test covers each state and the row-tap navigation.
    notes: "Ex-16.2 (original phase 16, Friends). Visual layout deferred."

  - id: 16.3
    title: AppSync client + Amplify GraphQL wiring
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `src/services/api/appsyncClient.ts` exposes a configured Amplify GraphQL client using the JWT from `authStore` per §8.3.
      - Generated types for `Room`, `Message`, `RoomConnection`, `MessageConnection` live under `src/services/api/graphql/`.
      - A smoke test mounts the client under MSW-like GraphQL mocking and asserts an authenticated request carries the expected header shape.
    notes: "Ex-17.1 (original phase 17, Chat backend)."

  - id: 16.4
    title: Chat feature hooks + fixtures + shape adapter
    agent: frontenddeveloper
    done: false
    depends_on: [16.3]
    acceptance_criteria:
      - `src/features/chat/api.ts` exposes `useRoomsQuery()`, `useMessagesQuery(roomId)`, `useCreateOrGetRoomMutation()`, `useSendMessageMutation()`, and `useOnMessageAddedSubscription(roomId)`.
      - `useSendMessageMutation.onMutate` optimistically appends the pending message to `['messages', roomId]`; `onError` rolls back.
      - `useOnMessageAddedSubscription` reconciles incoming subscription events with the optimistic cache (dedupes by `messageId`).
      - Shape adapter — add `src/features/chat/shapeAdapters.ts` mapping the GraphQL `Message` type to the client-side `ChatMessage` (from `src/types/ChatMessage.ts`) so the existing `MessageBubble`, `ChatListScreen`, and `ChatRoomScreen` continue to render without prop changes. Adapter is pure and unit-tested.
      - GraphQL fixtures cover happy-path room list, room-with-messages, subscription event, and a duplicate-event dedupe case.
      - Hook tests cover optimistic append + rollback, subscription-driven cache update, and dedupe.
    notes: "Ex-17.2 (original phase 17, Chat backend)."

  - id: 16.5
    title: Wire real Rooms query into the existing ChatListScreen (replace mock)
    agent: frontenddeveloper
    done: false
    depends_on: [16.4]
    acceptance_criteria:
      - Replace `useChatHistory` in `ChatProvider` with a `useRoomsQuery`-backed data layer OR route `ChatListScreen` directly to `useRoomsQuery` if `ChatProvider` becomes redundant. Preserve the existing `ChatListScreen` API — it must continue to render friends × last-message + timestamp without visible design changes.
      - Delete `src/features/chat/storage/chatHistoryStorage.ts`, `assets/dummychat/chatMehvish.json`, and the mock hydration path in `ChatProvider` per the phase-15 teardown checklist. Grep verification — `grep -r 'TODO(mock-only)' src/features/chat` and `grep -r 'TODO(mock-only)' src/state/chat` return zero hits.
      - Last-message preview + timestamp column continue to work against the real Rooms + latest-message shape.
      - Loading / ready / error / empty states are explicit and match the mock-mode states already rendered by `ChatListScreen`.
      - Screen wiring test covers each state and the row-tap navigation to `ChatRoomScreen` with the real `roomId` (mapped from `friendUserId` via `useCreateOrGetRoomMutation` if the route param convention shifts from `friendUserId` to `roomId` — decide at story time and document).
    notes: |
      Ex-17.3 (original phase 17, Chat backend). Route param convention decision — if
      the shift from `{ friendUserId }` to `{ roomId }` breaks the phase-15
      `RequestAcceptedModal.onSayHi` navigation from `MyProfileScreen`, update the
      caller too. Otherwise keep `friendUserId` and resolve `roomId` internally via
      `createOrGetRoom`. Prefer the latter to minimise changes to non-chat callers.

  - id: 16.6
    title: Wire real messages query + subscription into the existing ChatRoomScreen
    agent: frontenddeveloper
    done: false
    depends_on: [16.4]
    acceptance_criteria:
      - Replace the `useChatHistory` data source in `ChatRoomScreen` with `useMessagesQuery(roomId)` + `useOnMessageAddedSubscription(roomId)`. `sendMessage` calls `useSendMessageMutation.mutate` (optimistic append + rollback per 16.4). Preserve the existing `ChatRoomScreen` visual design (theme-coloured bubbles, tiled background, mic↔send composer toggle, header with back + avatar + name + triple-dot).
      - Mount subscribes via `useOnMessageAddedSubscription`; unmount tears the subscription down (no leaked subscription in a mount/unmount test).
      - Composer submit calls `useSendMessageMutation` (replaces the mock `sendMessage`).
      - Message status icons on sent bubbles (sent / delivered / read) driven by real server state, not seed constants.
      - Loading / ready / error / empty states are explicit.
      - Screen wiring test covers subscription mount/unmount, optimistic send + subscription reconciliation, and error rollback.
    notes: |
      Ex-17.4 (original phase 17, Chat backend). MessageBubble component +
      formatChatTimestamp helper stay untouched — they are pure presentation and
      shape-agnostic.

  - id: 16.7
    title: Chat deep-link route registration
    agent: frontenddeveloper
    done: false
    depends_on: [16.5, 16.6]
    acceptance_criteria:
      - `knotify://chat/room/:roomId` resolves through the linking config in `AppTabs`/`ChatStack` to `ChatRoomScreen` with `roomId` typed through the `ChatStackParamList`.
      - A cold-start deep-link (link opened while app was not running) lands on `ChatRoomScreen` after the tab shell mounts.
      - Deep-link test covers cold-start and warm-start paths.
    notes: "Ex-17.5 (original phase 17, Chat backend)."

  - id: 16.8
    title: Wire subscription-driven modal triggers + teardown DevTriggersPanel
    agent: frontenddeveloper
    done: false
    depends_on: [16.4]
    acceptance_criteria:
      - Wire `IncomingRequestModal` to fire on the `onFriendRequestReceived` AppSync subscription event. Mount surface — a subscription-listener at the root of `AppTabs` (or an equivalent shared root) that resolves the incoming request's sender profile and opens the modal. Modal component (already shipped in phase 15) stays untouched.
      - Wire `RequestAcceptedModal` to fire on the `onFriendRequestAccepted` subscription. Same mount surface pattern.
      - Delete `src/features/profile/components/DevTriggersPanel.tsx` and its labels under `menu.myProfile.editTab.devTriggers.*`. Restore the `MyProfileScreen` Edit tab to a real "Coming soon" `EmptyState` (or the real edit UX if it lands concurrently). Grep verification — `grep -r 'DevTriggersPanel' src/` returns zero hits.
      - Tests cover — subscription event fires and modal opens with the correct profile; multiple rapid events queue correctly (or drop older events — pick a policy and document); modal dismissal does not leak the subscription callback.
    notes: |
      Ex-17.6 (original phase 17, Chat backend). Depends on friend-request mutation
      wiring (the brainstorm-added stories flagged in the scope-gap note above) —
      `IncomingRequestModal.onAccept` / `.onDecline` must call real mutations, not
      the mock `FriendshipProvider.acceptRequest` / `.declineRequest`.

  - id: 16.9
    title: Blocks endpoints + hooks + MSW + cross-cache purge
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `src/features/blocks/api.ts` exposes `useBlockedUsersQuery()`, `useBlockUserMutation()`, `useUnblockUserMutation()`.
      - `useBlockUserMutation.onSuccess` invalidates or surgically purges `['deck']`, `['search']`, `['bookmarks']`, `['friends']`, `['friend-requests','incoming']`, `['friend-requests','outgoing']`, `['rooms']`, and any `['messages', roomId]` cache where the blocked user is the counterpart.
      - `useUnblockUserMutation.onSuccess` invalidates `['blocked-users']` only (no cross-cache work — unblock does not re-populate discovery).
      - `services/api/mocks/handlers.ts` gains GET /blocks, POST /blocks, DELETE /blocks/{userId} handlers with fixtures.
      - Hook tests cover the cross-cache purge on block, the narrow invalidation on unblock, and error paths.
    notes: "Ex-18.1 (original phase 18, Blocks)."

  - id: 16.10
    title: BlockedUsersScreen thin wire + block toggle entry points
    agent: frontenddeveloper
    done: false
    depends_on: [16.9]
    acceptance_criteria:
      - `BlockedUsersScreen` renders blocked users via `FlatList` of `ListRow`; each row exposes an Unblock `Button`.
      - `OtherProfileScreen` and `ChatRoomScreen` gain a Block action wired to `useBlockUserMutation` (from an overflow menu placeholder pending design brainstorm).
      - Loading / ready / error / empty states on `BlockedUsersScreen` are explicit.
      - Screen wiring test covers the list states, the unblock action, and the OtherProfile/ChatRoomScreen block-action wiring.
    notes: "Ex-18.2 (original phase 18, Blocks). Visual layout deferred."
