phase: 18
title: Blocks
last_updated: 2026-07-19

context_summary: |
  Phase 18 is a **thin** post-onboarding phase per §11.2.8. Wires GET/POST/DELETE /blocks with cross-cache purge (blocking a user must evict them from deck, search, bookmarks, friends, friend-requests, and chat caches). Stubs `BlockedUsersScreen`. Block toggle entry points from OtherProfile and RoomScreen are wired here. Visual layout is deferred to /implement-phase brainstorm.

stories:
  - id: 18.1
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
    notes: ""

  - id: 18.2
    title: BlockedUsersScreen thin wire + block toggle entry points
    agent: frontenddeveloper
    done: false
    depends_on: [18.1]
    acceptance_criteria:
      - `BlockedUsersScreen` renders blocked users via `FlatList` of `ListRow`; each row exposes an Unblock `Button`.
      - `OtherProfileScreen` and `RoomScreen` gain a Block action wired to `useBlockUserMutation` (from an overflow menu placeholder pending design brainstorm).
      - Loading / ready / error / empty states on `BlockedUsersScreen` are explicit.
      - Screen wiring test covers the list states, the unblock action, and the OtherProfile/RoomScreen block-action wiring.
    notes: "Visual layout deferred."
