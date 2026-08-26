phase: 13
title: Discover — deck (landing), friends + requests (Explore), gated full-profile view
last_updated: 2026-08-26

context_summary: |
  Phase 13 replaces the single-candidate MarriageLandingScreen (Aisha as a full profile) with a **deck of condensed profiles** and introduces the **friendship gate** on full-profile visibility. Two users only see each other's *full* profile when they are already friends, OR when one has sent the other a pending friend request (the recipient can then view the sender's full profile as part of the accept/decline decision).

  Explore tab gains two subtabs — **Friends** and **Requests** — each a scroll-list of thumbnails + names. Tapping any row opens the full profile behind a back-arrow-only header (distinct from the Marriage-tab landing header which keeps the filter + bell icons).

  **Mock-only, no backend calls.** MSW was retired on 2026-08-04 (see context.md); all fixtures dispatch through the `env.isMock` branch in `src/services/api/httpClient.ts` + `src/services/api/mocks/mockRequest.ts`. Every new mock surface is marked `TODO(mock-only)` and enumerated in the `context.md → Before shipping` teardown list.

  **Extended deck shape (frontend-only divergence from backend `deck_view`).** The real backend `deck_view` today exposes 16 columns (see `knotify-backend/db-schema.json` → `views.deck_view.columns`). Phase 13 fixtures intentionally carry **more** — the extra fields power the About Me / Marriage Intentions / Education / Professional Career blocks the user wants visible on each deck card. Backend `deck_view` will be extended in a later backend migration to match; **do not** treat this as the final backend shape.

  **Theme + reuse rule.** The visual language established in phase 12 is authoritative. Use existing theme tokens (`bg.chip`, `bg.surface`, `bg.primary`, `theme.spacing.*`, `theme.radii.*`, chip contrast rule, section-title styles including the emoji prefixes), existing catalog primitives (`Row`, `Column`, `Text`, `Heading`, `Button`, `TouchableArea`, `EmptyState`, `Snackbar`, `Avatar`, `ProfileThumbnailCircle`, `Icon`), and — critically — **reuse the existing profile-section components** (`AboutMeSection`, `MarriageIntentionsSection`, `EducationSection`, `ProfessionalCareerSection`, plus `CandidateHero` for the deck-card hero). No new colors, radii, or duplicate section components. Match the Muzz-inspired feel; no gratuitous visual departures.

  **Fixture photo reuse (per user 2026-08-26).** No new photo assets are required. Deck cards, Mehvish, and Qurat all reuse `assets/female/Female3.png` and `assets/female/Female4.png` across profiles. When real photo assets arrive, drop them into `assets/female/` and update the `dummyPhotoRegistry` — no other code changes required.

open_decisions_locked_by_user:
  - Q1 (deck size): 5 profiles (Aisha reused + 4 new).
  - Q2 (photos): reuse Female3 / Female4 across all fixtures.
  - Q3 (deck action buttons): Dislike → advance; Like → advance + Snackbar "Friend request sent"; Undo → step back; Star → Snackbar "Available in a later phase".
  - Q4 (Requests list): inline Accept / Decline buttons on each row; tapping the row body opens the full profile.
  - Q5 (Accept behavior): removes user from Requests list, adds to Friends list, Snackbar "Friend added"; Decline removes from Requests, Snackbar "Request declined". State persists via a `FriendshipProvider` backed by `expo-secure-store` (or in-memory during the session for the first pass — see story 13.5 acceptance criteria).
  - Q6 (Aisha): stays as the first deck card.

stories:

  - id: 13.1
    title: Deck fixtures + DummyDeckProfile type + photo-registry entries
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - New type `src/types/DummyDeckProfile.ts` that mirrors the backend `deck_view` shape (`user_id`, `first_name`, `last_name`, `sex`, `age`, `chosen_profile_avatar`, `photo_url`, `current_residence_city`, `current_residence_country`, `resident_country_code`, `religion`, `job_title`, `username`, `profile_complete_verified`) **plus** the frontend-only extensions needed by the deck card sections — `photos[]`, `faceSelfieUri`, `marital_status`, `has_children`, `marriage_time`, `meet_time` (as introduced in batch C), `professional_category`, `employer_name`, `employment_type`, `office_address`, `salary_range`, `highest_degree`, `education_level`, `college_name`, `graduation_year`, `higher_secondary`, `higher_secondary_passing_year`, `high_school`, `high_school_passing_year`, and `__dummy_display_only` (`is_active_today`, `membership_tier`, `has_unread_notifications`). All frontend-only fields tagged with a JSDoc `@frontend-extension` comment so the divergence from backend `deck_view` is grep-able.
      - Fixture files under `assets/dummydeck/`:
        - `deckFemale1.json` — Aisha Khan (reuse the current `dummyfemale.json` values verbatim so nothing regresses).
        - `deckFemale2.json` — new female #1 (distinct name, city, employer, degree, marriage_time, meet_time, marital_status, has_children).
        - `deckFemale3.json` — new female #2 (distinct).
        - `deckFemale4.json` — new female #3 (distinct).
        - `deckFemale5.json` — new female #4 (distinct).
      - Each fixture uses `Female3.png` OR `Female4.png` for both `photo_url` and `photos[0]` (alternate across cards).
      - `src/assets/dummyPhotoRegistry.ts` is unchanged (Female3 + Female4 already registered; no new entries needed).
      - `src/features/discover/data/deckFixtures.ts` exports `DECK_FIXTURES: ReadonlyArray<DummyDeckProfile>` in order — Aisha first, then the four new profiles.
      - New tests under `__tests__/features/discover/deckFixtures.test.ts`:
        - Each fixture parses as a valid `DummyDeckProfile`.
        - No two fixtures share a `user_id`.
        - All `photos[0]` and `photo_url` values resolve via `resolveDummyPhoto()` (i.e. registered).
        - Every fixture has non-null values for the four extended blocks (About Me, Marriage Intentions, Education, Professional Career) so the deck-card sections render populated on every card.
    notes: |
      Do NOT copy `dummyfemale.json` into the deck folder — import and re-export it as `deckFemale1` so a single source of truth remains for Aisha.

  - id: 13.2
    title: Full-profile fixtures + friendship/request state seed (Mehvish, Qurat)
    agent: frontenddeveloper
    done: false
    depends_on: [13.1]
    acceptance_criteria:
      - `assets/dummymehvish.json` — full profile of **Mehvish Hayat** (female, sex=Female, all `requiredForCompletion` fields populated per `knotify-backend/db-schema.json`, includes `siblings[]`, `faceSelfieUri`, `preferences.personalityTraits[]`). Uses `Female3.png` or `Female4.png` for `photo_url` + `photos[]`. `__dummy_display_only` block present.
      - `assets/dummyqurat.json` — full profile of **Qurat Baloch** (female, same shape as Mehvish, all fields populated). Uses the other of Female3/Female4.
      - Both files share `DummyOwnProfile`-compatible shape (rename the type to `DummyFullProfile` if `DummyOwnProfile` is too self-viewer-flavoured, keeping `DummyOwnProfile` as an alias for backwards compatibility).
      - `assets/dummyfriendships.json` — an array of `{ user_id }` objects: seed with Mehvish's `user_id` only (the current user is already friends with her). Represents `friendships` rows scoped to the current user.
      - `assets/dummyrequests.json` — an array of `{ request_id, from_user_id, status, created_at }` objects: seed with a single pending request from Qurat → current user.
      - New `FriendshipProvider` at `src/state/friendship/FriendshipProvider.tsx` that:
        - On mount, hydrates its state from the two seed fixtures.
        - Exposes `useFriendship()` returning `{ friends: DummyFullProfile[], requests: PendingRequest[], acceptRequest(userId), declineRequest(userId), isFriend(userId), receivedRequestFrom(userId) }`.
        - `acceptRequest(userId)` removes the pending request AND adds the user to `friends`.
        - `declineRequest(userId)` removes the pending request only.
        - State is in-memory for phase 13 (resets on cold start) — flag `TODO(mock-only)` next to the in-memory store; teardown will swap for real GraphQL/REST queries.
      - `FriendshipProvider` mounted in `App.tsx` at the same level as `OnboardingCompletionProvider`.
      - Tests:
        - `__tests__/state/friendship/FriendshipProvider.test.tsx` — hydration, `acceptRequest`, `declineRequest`, `isFriend`, `receivedRequestFrom` predicates.
        - `__tests__/assets/friendFixtures.test.ts` — Mehvish + Qurat parse cleanly, `dummyfriendships.json` references Mehvish's `user_id`, `dummyrequests.json` references Qurat's `user_id`.
    notes: |
      Naming: keep `DummyOwnProfile` semantics (the logged-in "me" is still Adnan). Mehvish + Qurat are OTHER users whose profiles the current user views — extract a shared `DummyFullProfile` shape and let both `DummyOwnProfile` and Mehvish/Qurat fixtures satisfy it.

  - id: 13.3
    title: MarriageLandingScreen → deck-of-condensed-cards refactor
    agent: frontenddeveloper
    done: false
    depends_on: [13.1]
    acceptance_criteria:
      - New component `src/features/landing/components/DeckCard.tsx` that renders, for a single `DummyDeckProfile`:
        - `CandidateHero` (reused as-is) for the top block.
        - `AboutMeSection`, `MarriageIntentionsSection`, `EducationSection`, `ProfessionalCareerSection` (reused as-is) stacked below.
        - Nothing else — no photos-block, faith, personality, address, parents, siblings, verified-profile, or contact-actions sections on the deck card.
      - `MarriageLandingScreen` refactored:
        - Holds `currentDeckIndex: number` state (starts at 0).
        - Renders the current deck card via `DeckCard` inside the existing `Animated.ScrollView` (tab-bar collapse behavior preserved unchanged).
        - `CollapsingActionBar` wired:
          - **Dislike (X)** → `currentDeckIndex + 1`, no snackbar (or a subtle "Skipped" toast, TBD at brainstorm — default: no snackbar).
          - **Like (✓)** → `currentDeckIndex + 1` + Snackbar `t('landing.likeSent')` ("Friend request sent").
          - **Undo (↺)** → `Math.max(0, currentDeckIndex - 1)`; disabled visual state when at index 0.
          - **Star (⭐)** → Snackbar `t('landing.actionUnavailable')` (existing key, unchanged).
        - When `currentDeckIndex >= DECK_FIXTURES.length`, the scroll content is replaced by an `EmptyState` with `title = t('landing.deckExhausted.title')` and `description = t('landing.deckExhausted.description')`. `CollapsingActionBar` hides in the exhausted state (or its buttons become disabled — decide at brainstorm).
      - `HeaderBar` unchanged (filter icon left, bell right, unread-dot derived from the currently visible deck profile's `has_unread_notifications`).
      - Scroll position resets to 0 whenever `currentDeckIndex` changes.
      - Labels added to `labels.en.json` and `labels.ur.json` (full parity):
        - `landing.likeSent`
        - `landing.deckExhausted.title`
        - `landing.deckExhausted.description`
      - Tests:
        - `__tests__/features/landing/DeckCard.test.tsx` — renders CandidateHero + 4 sections, hides the extra sections.
        - `__tests__/features/landing/MarriageLandingScreen.deck.test.tsx` — index starts at 0; Dislike advances index; Like advances index + fires Snackbar; Undo decrements (bounded at 0); Star fires Snackbar; empty state renders after last card.
    notes: |
      DeckCard sections must NOT be duplicated — import from `@/features/profile-sections/sections/*`. If TypeScript flags a shape mismatch because `DummyDeckProfile` is narrower than `UserProfile & DummyOverlay`, cast `deck as unknown as UserProfile & DummyOverlay` at the DeckCard boundary (documented cast, not a fix).

  - id: 13.4
    title: OtherProfileScreen — full profile behind back-arrow header + access gate
    agent: frontenddeveloper
    done: false
    depends_on: [13.2]
    acceptance_criteria:
      - New screen `src/features/profile/screens/OtherProfileScreen.tsx`:
        - Route param: `{ userId: string, source: 'friend' | 'request' }` typed through the ExploreStack ParamList.
        - Resolves the target profile from `useFriendship()` (friends list) or the pending-requests list depending on `source`.
        - Renders a **back-arrow-only header** (no filter, no bell, no share) — either a new `BackHeaderBar` component in `features/profile/components/` OR an inline header rendered directly in the screen. Whichever pattern is chosen, the header is visually consistent with the phase-12 `HeaderBar` (same paddings, same safe-area handling, same background, same subtle shadow).
        - Renders `ProfileScrollView profile={profile} viewer="other"` — reuses the existing 14-section catalog exactly as it appears when viewed from the landing page (before the deck refactor).
        - When `source === 'request'`, an **inline request-action bar** appears at the top of the scrollable content (below the header, above the hero) with two buttons: **Accept** (primary variant) and **Decline** (ghost/outline variant). Accept calls `useFriendship().acceptRequest(userId)` → shows Snackbar `t('otherProfile.acceptedToast')` → after 1500 ms calls `navigation.goBack()`. Decline calls `declineRequest(userId)` → Snackbar `t('otherProfile.declinedToast')` → `goBack()`.
        - Access guard: on mount, if `source === 'friend'` and `isFriend(userId) === false`, OR `source === 'request'` and `receivedRequestFrom(userId) === false`, render an `EmptyState` with `t('otherProfile.notAuthorized.title')` and hide the ProfileScrollView.
      - Labels added to `labels.en.json` + `labels.ur.json` (full parity):
        - `otherProfile.acceptedToast`
        - `otherProfile.declinedToast`
        - `otherProfile.notAuthorized.title`
        - `otherProfile.notAuthorized.description`
        - `otherProfile.actions.accept`
        - `otherProfile.actions.decline`
        - `otherProfile.back` (accessibility label for the back button)
      - Tests:
        - Renders with `source='friend'` for Mehvish's userId → shows ProfileScrollView, no action bar.
        - Renders with `source='request'` for Qurat's userId → shows ProfileScrollView + action bar with Accept + Decline.
        - Access-guard: unknown userId with `source='friend'` → EmptyState.
        - Accept press → calls `acceptRequest` → navigates back.
        - Decline press → calls `declineRequest` → navigates back.
        - Back button press → navigates back.
    notes: |
      No new profile-section components. The full-profile view must be pixel-identical to the "other" viewer path already used in phase 12 — the only difference is the header (back-arrow-only) and the optional request-action bar.

  - id: 13.5
    title: ExploreScreen — Friends + Requests subtabs + ExploreStack wiring
    agent: frontenddeveloper
    done: false
    depends_on: [13.2, 13.4]
    acceptance_criteria:
      - Replace the current Explore-tab `EmptyState` with an `ExploreStack` — a new `createNativeStackNavigator` at `src/navigation/ExploreStack.tsx`:
        - `ExploreHomeScreen` (initial route)
        - `OtherProfileScreen` (pushed from list rows)
        - Update `src/navigation/types.ts` with `ExploreStackParamList` mirroring the `MenuStackParamList` pattern from phase 12.
        - Update `src/navigation/AppTabs.tsx` so the Explore tab renders `ExploreStack` (mirror the Menu-tab pattern).
      - `ExploreHomeScreen` at `src/features/explore/screens/ExploreHomeScreen.tsx`:
        - Header at the top with page title `t('explore.title')` centered, safe-area padded (visually consistent with phase-12 headers).
        - Two-segment tab control below the header: **Friends** | **Requests** — mirror the Preview/Edit tab pattern from `MyProfileScreen` (local `activeTab` state, brand color on active, secondary color on inactive).
        - When `activeTab === 'friends'`:
          - Reads `friends` from `useFriendship()`.
          - Renders `FlatList` of friends; each row uses catalog primitives — `ProfileThumbnailCircle` (size 48) on the left, `Heading variant="heading.sm"` with full name (`first_name last_name`) to the right, whole row is a `TouchableArea`.
          - Row press: `navigation.navigate('OtherProfileScreen', { userId, source: 'friend' })`.
          - Empty state: `EmptyState` with `t('explore.friends.emptyTitle')` / `t('explore.friends.emptyDescription')`.
        - When `activeTab === 'requests'`:
          - Reads `requests` from `useFriendship()` — resolves each `from_user_id` to the corresponding `DummyFullProfile` (Qurat in the seed).
          - Renders `FlatList` of requests; each row is a `Row` with:
            - `ProfileThumbnailCircle` (size 48) left,
            - `Column` (flex) with full name (`Heading heading.sm`) + a subtitle `Text label.sm` reading `t('explore.requests.sentYou')` ("sent you a request"),
            - `Row` with two small buttons on the right: `Button variant="primary" size="sm" label={t('explore.requests.accept')}` and `Button variant="ghost" size="sm" label={t('explore.requests.decline')}`.
          - Row-body press (i.e. everything except the two buttons): `navigation.navigate('OtherProfileScreen', { userId: from_user_id, source: 'request' })`.
          - Accept button press: `acceptRequest(from_user_id)` + Snackbar `t('explore.requests.acceptedToast')`. Row disappears from Requests + reappears in Friends list.
          - Decline button press: `declineRequest(from_user_id)` + Snackbar `t('explore.requests.declinedToast')`.
          - Empty state: `EmptyState` with `t('explore.requests.emptyTitle')` / `t('explore.requests.emptyDescription')`.
      - Labels added to `labels.en.json` + `labels.ur.json` (full parity):
        - `explore.title`
        - `explore.tabs.friends`, `explore.tabs.requests`
        - `explore.friends.emptyTitle`, `explore.friends.emptyDescription`
        - `explore.requests.sentYou`, `explore.requests.accept`, `explore.requests.decline`
        - `explore.requests.acceptedToast`, `explore.requests.declinedToast`
        - `explore.requests.emptyTitle`, `explore.requests.emptyDescription`
      - Tests:
        - `__tests__/features/explore/ExploreHomeScreen.test.tsx`:
          - Friends tab renders Mehvish in the seed state.
          - Requests tab renders Qurat in the seed state.
          - Tapping Mehvish row → navigates to OtherProfileScreen with `{ userId, source: 'friend' }`.
          - Tapping Qurat's row body (not the buttons) → navigates with `{ userId, source: 'request' }`.
          - Tapping Accept on Qurat's row: Qurat disappears from Requests + appears in Friends + Snackbar fires.
          - Tapping Decline on Qurat's row: Qurat disappears from Requests + Snackbar fires.
        - `__tests__/navigation/ExploreStack.test.tsx` — three E2E wiring tests mirroring the phase-12 `MenuStack.test.tsx` pattern: initial route is ExploreHomeScreen, row tap pushes OtherProfileScreen, goBack restores ExploreHomeScreen.
    notes: |
      Mirror the MenuStack + MyProfileScreen patterns from phase 12 as closely as possible — same navigation types style, same tab-segment pattern, same header handling. Consistency here is deliberately valued over cleverness. Do not introduce a bottom-sheet or drawer for the sub-tabs; use the same inline two-segment row pattern that `MyProfileScreen` uses for Preview / Edit.

teardown_additions:
  # Add to context.md → Before shipping → Mock-only pipeline after phase 13 ships.
  - Wipe `assets/dummydeck/deckFemale*.json`, `assets/dummymehvish.json`, `assets/dummyqurat.json`, `assets/dummyfriendships.json`, `assets/dummyrequests.json`.
  - Delete `src/features/discover/data/deckFixtures.ts`.
  - Replace `useFriendship()`'s in-memory store with real REST/AppSync-backed queries (`GET /friends`, `GET /friend-requests`, `POST /friend-requests`, `POST /friend-requests/{id}/accept`, `POST /friend-requests/{id}/decline` — endpoints TBD).
  - Rewire `MarriageLandingScreen`'s `DECK_FIXTURES` to `useDeckQuery()` (backend `GET /match/deck`).
  - When backend `deck_view` is extended to include the About Me / Marriage Intentions / Education / Professional Career columns, drop the `@frontend-extension`-tagged fields from `DummyDeckProfile` and re-derive the type from the real deck response.
  - Verify `grep -r 'TODO(mock-only)' src/` returns zero hits after all above steps are complete.

open_items:
  # None — all Qs answered by user on 2026-08-26.
