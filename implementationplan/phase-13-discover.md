phase: 13
title: Discover - deck, other-profile, filters, search
last_updated: 2026-07-19

context_summary: |
  Phase 13 is a **thin** post-onboarding phase per §11.2.8 - it wires the match/deck, profile-detail, and search endpoints and stubs `DeckScreen`, `OtherProfileScreen`, `FiltersScreen`, `SearchScreen` with catalog composition. Visual and interaction design (card stack vs list vs grid, gestures, filter sheet facets, empty-deck state) is delivered at /implement-phase brainstorm time.

stories:
  - id: 13.1
    title: Discover endpoints + hooks + MSW fixtures
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `src/features/discover/api.ts` exposes typed hooks `useDeckQuery()`, `useProfileByIdQuery(userId)`, `useSearchProfilesMutation()` wrapping `profileApi.listProfiles`, `profileApi.getProfileById`, and a match/search endpoint helper.
      - Query keys follow the tuple convention from §7.3.
      - `services/api/mocks/handlers.ts` gains handlers for GET /match/deck, GET /profiles/{userId}, POST /match/search with fixtures.
      - A 403-from-match fixture triggers the "onboarding redirect" behavior wired in the `httpClient` per §8.2.
      - Hook tests cover the 403-redirect path and the happy path for each hook.
    notes: ""

  - id: 13.2
    title: DeckScreen thin wire (list of deck entries)
    agent: frontenddeveloper
    done: false
    depends_on: [13.1]
    acceptance_criteria:
      - `DeckScreen` renders the deck via `FlatList` of catalog `Card`s pending the design brainstorm.
      - Loading / ready / error / empty states use catalog `LoadingState`, `EmptyState`, `ErrorState` explicitly.
      - A 15-minute stale-freshness indicator surfaces via a catalog `Badge` (per §11.4 domain rule).
      - Screen wiring test covers each of the four states.
    notes: "Visual layout deferred."

  - id: 13.3
    title: OtherProfileScreen thin wire (profile-of-another display)
    agent: frontenddeveloper
    done: false
    depends_on: [13.1]
    acceptance_criteria:
      - `OtherProfileScreen` renders the fetched profile via catalog `Section` / `ListRow`; navigation from `DeckScreen` passes `userId` typed through the ParamList.
      - Loading / ready / error states are explicit.
      - Screen wiring test covers navigation param typing and the three async states.
    notes: "Visual layout deferred."

  - id: 13.4
    title: FiltersScreen thin wire (open sheet, apply, persist)
    agent: frontenddeveloper
    done: false
    depends_on: [13.1]
    acceptance_criteria:
      - `FiltersScreen` opens as a `BottomSheet` from `DeckScreen`; the facet list is a placeholder pending the design brainstorm (age range, religion, distance).
      - Apply persists filter state to `AsyncStorage` under `discover.filters` and invalidates the deck query.
      - Screen wiring test covers Apply persistence and invalidation.
    notes: "Facet list + visual layout deferred."

  - id: 13.5
    title: SearchScreen thin wire
    agent: frontenddeveloper
    done: false
    depends_on: [13.1]
    acceptance_criteria:
      - `SearchScreen` renders `SearchInput` from the catalog and calls `useSearchProfilesMutation` on submit.
      - Results render as `FlatList` of `Card`; empty results show `EmptyState`.
      - Screen wiring test covers submit and empty-results path.
    notes: "Visual layout deferred."
