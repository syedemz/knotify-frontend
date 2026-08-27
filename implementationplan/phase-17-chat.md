phase: 17
title: Chat - AppSync backend wiring (rooms + realtime messages)
last_updated: 2026-08-27 (patched — chat UI shell moved to phase 15)

context_summary: |
  Phase 17 is a **thin** post-onboarding phase per §11.2.8. It wires AppSync GraphQL +
  subscriptions to feed the chat UI shell that shipped in phase 15.

  **What phase 15 already shipped (do NOT rebuild here):**

  - `ChatStack` in `src/navigation/ChatStack.tsx` (native-stack, `ChatListScreen`
    initial + `ChatRoomScreen`), replacing the old Chat-tab `EmptyState` in `AppTabs`.
  - `ChatListScreen` at `src/features/chat/screens/ChatListScreen.tsx` — WhatsApp-style
    list of friends × last-message + timestamp; row tap navigates to `ChatRoomScreen`.
  - `ChatRoomScreen` at `src/features/chat/screens/ChatRoomScreen.tsx` — WhatsApp-style
    thread: tiled `bgDark.jpg` background, theme-coloured `MessageBubble` (sent right /
    received left), header with back + avatar + name + triple-dot no-op, composer with
    mic↔send toggle on non-empty input, no camera icon.
  - `MessageBubble` component + `formatChatTimestamp` helper.
  - `ChatProvider` + `useChatHistory(friendUserId)` hook — mock-only, backed by
    `chatHistoryStorage` (AsyncStorage) + `assets/dummychat/chatMehvish.json` seed.
  - `IncomingRequestModal` + `RequestAcceptedModal` (dev-triggered from
    `MyProfileScreen` Edit tab in phase 15).

  **What phase 17 does:**

  1. Wire the AppSync GraphQL client with the JWT from `authStore`.
  2. Add `useRoomsQuery()`, `useMessagesQuery(roomId)`, `useCreateOrGetRoomMutation()`,
     `useSendMessageMutation()`, `useOnMessageAddedSubscription(roomId)` per §8.3.
  3. **Replace the `useChatHistory` mock in `ChatProvider`** with the real hooks. The
     `ChatListScreen` and `ChatRoomScreen` components stay untouched — only the data
     source underneath swaps. Delete the mock storage helper + seed JSON per the
     phase-15 teardown checklist.
  4. Wire the two subscription-driven modals: `IncomingRequestModal` fires on
     `onFriendRequestReceived`; `RequestAcceptedModal` fires on
     `onFriendRequestAccepted`. Delete the phase-15 `DevTriggersPanel` on the
     `MyProfileScreen` Edit tab.
  5. Register the chat deep-link route: `knotify://chat/room/:roomId` resolves to
     `ChatRoomScreen`.

  Design cross-check: `ChatRoomScreen` and `ChatListScreen` were built against a mock
  data shape (`ChatMessage` with `sender: 'me' | 'friend'`, local ids, `status`). Phase
  17 must reconcile that shape with the real GraphQL `Message` type. Where the shapes
  differ (e.g. `senderUserId: string` on the server vs. `sender: 'me' | 'friend'` on
  the client), add a thin adapter in `ChatProvider` that maps server → client shape
  and preserves the existing screen contracts.

stories:
  - id: 17.1
    title: AppSync client + Amplify GraphQL wiring
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `src/services/api/appsyncClient.ts` exposes a configured Amplify GraphQL client using the JWT from `authStore` per §8.3.
      - Generated types for `Room`, `Message`, `RoomConnection`, `MessageConnection` live under `src/services/api/graphql/`.
      - A smoke test mounts the client under MSW-like GraphQL mocking and asserts an authenticated request carries the expected header shape.
    notes: ""

  - id: 17.2
    title: Chat feature hooks + fixtures + shape adapter
    agent: frontenddeveloper
    done: false
    depends_on: [17.1]
    acceptance_criteria:
      - `src/features/chat/api.ts` exposes `useRoomsQuery()`, `useMessagesQuery(roomId)`, `useCreateOrGetRoomMutation()`, `useSendMessageMutation()`, and `useOnMessageAddedSubscription(roomId)`.
      - `useSendMessageMutation.onMutate` optimistically appends the pending message to `['messages', roomId]`; `onError` rolls back.
      - `useOnMessageAddedSubscription` reconciles incoming subscription events with the optimistic cache (dedupes by `messageId`).
      - Shape adapter - add `src/features/chat/shapeAdapters.ts` mapping the GraphQL `Message` type to the client-side `ChatMessage` (from `src/types/ChatMessage.ts`) so the existing `MessageBubble`, `ChatListScreen`, and `ChatRoomScreen` continue to render without prop changes. Adapter is pure and unit-tested.
      - GraphQL fixtures cover happy-path room list, room-with-messages, subscription event, and a duplicate-event dedupe case.
      - Hook tests cover optimistic append + rollback, subscription-driven cache update, and dedupe.
    notes: ""

  - id: 17.3
    title: Wire real Rooms query into the existing ChatListScreen (replace mock)
    agent: frontenddeveloper
    done: false
    depends_on: [17.2]
    acceptance_criteria:
      - Replace `useChatHistory` in `ChatProvider` with a `useRoomsQuery`-backed data layer OR route `ChatListScreen` directly to `useRoomsQuery` if `ChatProvider` becomes redundant. Preserve the existing `ChatListScreen` API - it must continue to render friends × last-message + timestamp without visible design changes.
      - Delete `src/features/chat/storage/chatHistoryStorage.ts`, `assets/dummychat/chatMehvish.json`, and the mock hydration path in `ChatProvider` per the phase-15 teardown checklist. Grep verification - `grep -r 'TODO(mock-only)' src/features/chat` and `grep -r 'TODO(mock-only)' src/state/chat` return zero hits.
      - Last-message preview + timestamp column continue to work against the real Rooms + latest-message shape.
      - Loading / ready / error / empty states are explicit and match the mock-mode states already rendered by `ChatListScreen`.
      - Screen wiring test covers each state and the row-tap navigation to `ChatRoomScreen` with the real `roomId` (mapped from `friendUserId` via `useCreateOrGetRoomMutation` if the route param convention shifts from `friendUserId` to `roomId` — decide at story time and document).
    notes: |
      Route param convention decision - if the shift from `{ friendUserId }` to
      `{ roomId }` breaks the phase-15 `RequestAcceptedModal.onSayHi` navigation from
      `MyProfileScreen`, update the caller too. Otherwise keep `friendUserId` and
      resolve `roomId` internally via `createOrGetRoom`. Prefer the latter to minimise
      changes to non-chat callers.

  - id: 17.4
    title: Wire real messages query + subscription into the existing ChatRoomScreen
    agent: frontenddeveloper
    done: false
    depends_on: [17.2]
    acceptance_criteria:
      - Replace the `useChatHistory` data source in `ChatRoomScreen` with `useMessagesQuery(roomId)` + `useOnMessageAddedSubscription(roomId)`. `sendMessage` calls `useSendMessageMutation.mutate` (optimistic append + rollback per 17.2). Preserve the existing `ChatRoomScreen` visual design (theme-coloured bubbles, tiled background, mic↔send composer toggle, header with back + avatar + name + triple-dot).
      - Mount subscribes via `useOnMessageAddedSubscription`; unmount tears the subscription down (no leaked subscription in a mount/unmount test).
      - Composer submit calls `useSendMessageMutation` (replaces the mock `sendMessage`).
      - Message status icons on sent bubbles (sent / delivered / read) driven by real server state, not seed constants.
      - Loading / ready / error / empty states are explicit.
      - Screen wiring test covers subscription mount/unmount, optimistic send + subscription reconciliation, and error rollback.
    notes: |
      MessageBubble component + formatChatTimestamp helper stay untouched — they are
      pure presentation and shape-agnostic.

  - id: 17.5
    title: Chat deep-link route registration
    agent: frontenddeveloper
    done: false
    depends_on: [17.3, 17.4]
    acceptance_criteria:
      - `knotify://chat/room/:roomId` resolves through the linking config in `AppTabs`/`ChatStack` to `ChatRoomScreen` with `roomId` typed through the `ChatStackParamList`.
      - A cold-start deep-link (link opened while app was not running) lands on `ChatRoomScreen` after the tab shell mounts.
      - Deep-link test covers cold-start and warm-start paths.
    notes: ""

  - id: 17.6
    title: Wire subscription-driven modal triggers + teardown DevTriggersPanel
    agent: frontenddeveloper
    done: false
    depends_on: [17.2]
    acceptance_criteria:
      - Wire `IncomingRequestModal` to fire on the `onFriendRequestReceived` AppSync subscription event. Mount surface - a subscription-listener at the root of `AppTabs` (or an equivalent shared root) that resolves the incoming request's sender profile and opens the modal. Modal component (already shipped in phase 15) stays untouched.
      - Wire `RequestAcceptedModal` to fire on the `onFriendRequestAccepted` subscription. Same mount surface pattern.
      - Delete `src/features/profile/components/DevTriggersPanel.tsx` and its labels under `menu.myProfile.editTab.devTriggers.*`. Restore the `MyProfileScreen` Edit tab to a real "Coming soon" `EmptyState` (or the real edit UX if it lands concurrently). Grep verification - `grep -r 'DevTriggersPanel' src/` returns zero hits.
      - Tests cover - subscription event fires and modal opens with the correct profile; multiple rapid events queue correctly (or drop older events — pick a policy and document); modal dismissal does not leak the subscription callback.
    notes: |
      Splitting subscription wiring out of 17.6 keeps the phase-15 tear-down concerns
      (delete DevTriggersPanel, restore Edit-tab placeholder) grouped with the
      subscription enablement that supersedes them.
