phase: 14
title: Bookmarks
last_updated: 2026-07-19

context_summary: |
  Phase 14 is a **thin** post-onboarding phase per §11.2.8. Wires GET/POST/DELETE /bookmarks with optimistic toggling; stubs `BookmarksScreen`. Bookmark-toggle entry points from Deck / OtherProfile are wired here so the discover phase's screens gain a functional icon. Visual layout of the list is deferred to /implement-phase brainstorm.

stories:
  - id: 14.1
    title: Bookmarks endpoints + hooks + MSW + optimistic toggle
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `src/features/bookmarks/api.ts` exposes `useBookmarksQuery()`, `useToggleBookmarkMutation()` with optimistic flip on `onMutate` and rollback in `onError`.
      - `services/api/mocks/handlers.ts` gains handlers for GET /bookmarks, POST /bookmarks, DELETE /bookmarks/{userId} with fixtures.
      - Hook tests cover optimistic flip, rollback on server error, and happy-path invalidation of `['bookmarks']` on success.
    notes: ""

  - id: 14.2
    title: BookmarksScreen thin wire + toggle wiring in Deck / OtherProfile
    agent: frontenddeveloper
    done: false
    depends_on: [14.1]
    acceptance_criteria:
      - `BookmarksScreen` renders bookmarked profiles via `FlatList` of `Card`; empty state is explicit.
      - `DeckScreen` and `OtherProfileScreen` gain a bookmark toggle `IconButton` that calls `useToggleBookmarkMutation`.
      - Screen wiring test covers empty state, happy-path list render, and toggle rollback on error.
    notes: "Visual layout deferred."
