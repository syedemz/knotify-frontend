phase: 13
title: Discover — deck (landing), friends + requests (Explore), gated full-profile view
last_updated: 2026-08-26 (brainstorm-2 answers incorporated)

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
  - Q3 (deck action buttons): Dislike → advance; Like → advance + Snackbar "Friend request sent" (mock theatre — no state write, see Q10); Undo → step back; Star → Snackbar "Available in a later phase".
  - Q4 (Requests list): inline Accept / Decline buttons on each row; tapping the row body opens the full profile.
  - Q5 (Accept behavior): removes user from Requests list, adds to Friends list, Snackbar "Friend added"; Decline removes from Requests, Snackbar "Request declined". State is in-memory only for phase 13 — cold-start resets are expected (see Story 13.2 Note 2). Real persistence ships in phase 15.
  - Q6 (Aisha): stays as the first deck card.
  # ── Answers from brainstorm-1 (2026-08-26 15:48) ──
  - Q7 (B1 — Accept-guard race): broaden the OtherProfileScreen guard so `source='request'` is also authorized when `isFriend(userId) === true`. See Story 13.4 access-guard AC.
  - Q8 (B2 — CandidateHero type mismatch): widen `CandidateHero`'s prop type to a new narrower structural interface `CandidateHeroProfile`; both `DummyFemaleProfile` and `DummyDeckProfile` satisfy it without a cast. See Story 13.3 first AC.
  - Q9 (S1 — bell unread-dot): derive the dot from the CURRENT user (`dummyprofile.__dummy_display_only?.has_unread_notifications`), NOT the currently visible deck card. See Story 13.3 HeaderBar AC.
  - Q10 (S2 — Like semantics): Like is mock theatre only — it advances the index and fires the "Friend request sent" snackbar. It does NOT write to `FriendshipProvider` or any fixture. Real request-create ships in phase 15. See Story 13.3 Like semantics AC.
  - Q11 (S3 — exhausted state): CollapsingActionBar hides entirely (returns null) when the deck is exhausted — no disabled or greyed-out buttons remain visible.
  - Q12 (S4 — tab-bar reset on advance): on every deck-index change (Dislike, Like, Undo) reset `marriageTabBarHidden.value = withTiming(0)` alongside the scroll reset, so the tab bar and action bar spring back into view on every new card.
  - Q13 (S5 — request-view phone leak): add an optional `contactVisible?: boolean` prop (defaults to `true`) to `ProfileScrollView`; OtherProfileScreen passes `contactVisible={source === 'friend'}` so `ContactActionsSection` is hidden on request-view. See Story 13.4 ProfileScrollView AC.
  - Q14 (Note 4 — BackHeaderBar): build a reusable `BackHeaderBar` component under `src/features/profile/components/` (not inline) — anticipates reuse in phases 15, 17, 18.
  # ── Answers from brainstorm-2 (2026-08-26 16:17) ──
  - Q15 (NG1 — user_id → DummyFullProfile lookup): add `getFullProfile(userId): DummyFullProfile | undefined` to `useFriendship()`, backed by a module-scope `ALL_FULL_PROFILES` registry inside `FriendshipProvider` that pairs Mehvish's + Qurat's `user_id`s to their JSON fixtures. Story 13.4 (OtherProfileScreen) and Story 13.5 (Explore Requests list) both call it — no ad-hoc fixture imports at the callsite.
  - Q16 (NG2 — Decline flow timing): Decline calls `navigation.goBack()` IMMEDIATELY (no 1500 ms delay). The "Request declined" snackbar is handed off to `ExploreHomeScreen` via a pending-toast mechanism (route param OR provider field — implementer's pick). Rationale: after `declineRequest()` runs, the user is neither friend nor pending-request-sender, so any delay would trip the broadened access guard and paint the "Not authorized" EmptyState on top of the toast — the same class of bug B1 fixed for Accept.

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
        - **Internal profile registry (NG1).** Holds a module-scope map `ALL_FULL_PROFILES: Record<string, DummyFullProfile>` that pairs Mehvish's and Qurat's `user_id`s to their respective JSON fixtures. Both known "other" users (friends and pending-request senders) are keyed here so a `user_id` alone can be resolved to a full profile without the caller re-importing fixtures. Grep-tag: `TODO(mock-only)` next to the registry — teardown replaces it with a real `GET /profiles/{userId}` query.
        - Exposes `useFriendship()` returning `{ friends: DummyFullProfile[], requests: PendingRequest[], acceptRequest(userId), declineRequest(userId), isFriend(userId): boolean, receivedRequestFrom(userId): boolean, getFullProfile(userId): DummyFullProfile | undefined }`.
        - `acceptRequest(userId)` removes the pending request AND adds the user (looked up via `ALL_FULL_PROFILES[userId]`) to `friends`. If the user_id isn't in the registry (defensive), no-op with a `console.warn` — should never happen in the seed state.
        - `declineRequest(userId)` removes the pending request only.
        - `isFriend(userId)` returns `true` iff `userId` is in the friends list.
        - `receivedRequestFrom(userId)` returns `true` iff there is a pending request whose `from_user_id === userId`.
        - `getFullProfile(userId)` returns `ALL_FULL_PROFILES[userId]` (or `undefined` if unknown). This is the single source of truth for both the OtherProfileScreen (Story 13.4) and the Explore Requests list (Story 13.5) when resolving a `from_user_id` → `DummyFullProfile`.
        - State is in-memory for phase 13 (resets on cold start) — flag `TODO(mock-only)` next to the in-memory store; teardown will swap for real GraphQL/REST queries.
      - `FriendshipProvider` mounted in `App.tsx` at the same level as `OnboardingCompletionProvider`.
      - Tests:
        - `__tests__/state/friendship/FriendshipProvider.test.tsx` — hydration, `acceptRequest`, `declineRequest`, `isFriend`, `receivedRequestFrom`, `getFullProfile` (returns Mehvish for Mehvish's id, Qurat for Qurat's id, `undefined` for unknown ids), acceptRequest's registry-lookup path (accepting Qurat adds a DummyFullProfile equal to `getFullProfile(quratId)`).
        - `__tests__/assets/friendFixtures.test.ts` — Mehvish + Qurat parse cleanly, `dummyfriendships.json` references Mehvish's `user_id`, `dummyrequests.json` references Qurat's `user_id`.
    notes: |
      Naming: keep `DummyOwnProfile` semantics (the logged-in "me" is still Adnan). Mehvish + Qurat are OTHER users whose profiles the current user views — extract a shared `DummyFullProfile` shape and let both `DummyOwnProfile` and Mehvish/Qurat fixtures satisfy it.

      **Note 2 — cold-start reset is EXPECTED behavior.** The in-memory `FriendshipProvider` intentionally resets on every cold start. If a QA session Accepts Qurat and then relaunches the app, Qurat's request will reappear and Mehvish will be the only friend again. Real persistence ships in phase 15 alongside the request-create backend wiring. Do NOT file this as a bug and do NOT add a workaround in phase 13.

  - id: 13.3
    title: MarriageLandingScreen → deck-of-condensed-cards refactor
    agent: frontenddeveloper
    done: false
    depends_on: [13.1]
    acceptance_criteria:
      - **CandidateHero prop widening (B2, answer b).** Widen `CandidateHero`'s `profile` prop type from `DummyFemaleProfile` to a new narrower structural interface `CandidateHeroProfile` extracted into `src/features/landing/components/CandidateHero.tsx` (co-located with the component). `CandidateHeroProfile` must include exactly the fields CandidateHero reads today — `first_name`, `age`, `current_residence_city`, `current_residence_country`, `resident_country_code`, `job_title`, `photos` (nullable string array), `photo_url` (nullable string), `faceSelfieUri` (nullable string), and an optional `__dummy_display_only` block with `is_active_today?` + `membership_tier?` fields. Both `DummyFemaleProfile` and `DummyDeckProfile` must be assignable to `CandidateHeroProfile` structurally without any cast. Re-run the phase-12 CandidateHero test suite to confirm no regression. Do NOT edit `MarriageLandingScreen`'s existing `dummyfemale as unknown as DummyFemaleProfile` cast — that is orthogonal to this widening.
      - New component `src/features/landing/components/DeckCard.tsx` that renders, for a single `DummyDeckProfile`:
        - `CandidateHero` (now accepting the wider `CandidateHeroProfile` — no cast required) for the top block.
        - `AboutMeSection`, `MarriageIntentionsSection`, `EducationSection`, `ProfessionalCareerSection` (reused as-is) stacked below.
        - Nothing else — no photos-block, faith, personality, address, parents, siblings, verified-profile, or contact-actions sections on the deck card.
      - `MarriageLandingScreen` refactored:
        - Holds `currentDeckIndex: number` state (starts at 0).
        - Renders the current deck card via `DeckCard` inside the existing `Animated.ScrollView` (tab-bar collapse behavior preserved unchanged).
        - `CollapsingActionBar` wired:
          - **Dislike (X)** → `currentDeckIndex + 1`, no snackbar.
          - **Like (✓)** → `currentDeckIndex + 1` + Snackbar `t('landing.likeSent')` ("Friend request sent").
          - **Undo (↺)** → `Math.max(0, currentDeckIndex - 1)`; disabled visual state when at index 0.
          - **Star (⭐)** → Snackbar `t('landing.actionUnavailable')` (existing key, unchanged).
        - **Like semantics (S2, answer a — mock theatre).** The Like handler does NOT write to `FriendshipProvider`, does NOT create a pending-request record anywhere, and does NOT mutate any static fixture. It only advances the index and fires the snackbar. Real pending-request creation ships in phase 15. Add a code comment `// TODO(mock-only): real request-create ships in phase 15` on the Like handler.
        - When `currentDeckIndex >= DECK_FIXTURES.length`, the scroll content is replaced by an `EmptyState` with `title = t('landing.deckExhausted.title')` and `description = t('landing.deckExhausted.description')`. **CollapsingActionBar hides entirely in the exhausted state (S3, answer a)** — the screen returns `null` in place of the bar so no greyed-out buttons remain visible.
        - **Deck-advance/undo also resets `marriageTabBarHidden` (S4, answer a).** Whenever `currentDeckIndex` changes (via Dislike, Like, or Undo), set `marriageTabBarHidden.value = withTiming(0, { duration: 220 })` from a `useEffect` keyed on `currentDeckIndex`, alongside the `scrollTo({ y: 0, animated: false })` reset — so both the tab bar and the action bar spring back into view when the user lands on a new card at the top.
      - **HeaderBar unread-dot (S1, answer a).** `HeaderBar`'s `hasUnreadNotifications` prop is derived from the **current user** (`dummyprofile.__dummy_display_only?.has_unread_notifications`), NOT from the currently visible deck profile. Import `dummyprofile.json` directly at the top of `MarriageLandingScreen` (already imported inside `AppTabs` for the Menu tab icon — module-level cache means no cost) and read the field once at module scope. Do NOT thread the deck profile into HeaderBar.
      - Scroll position resets to 0 whenever `currentDeckIndex` changes (via `Animated.ScrollView` `ref.scrollTo({ y: 0, animated: false })` in the same `useEffect` used for the tab-bar-hidden reset above).
      - Labels added to `labels.en.json` and `labels.ur.json` (full parity):
        - `landing.likeSent`
        - `landing.deckExhausted.title`
        - `landing.deckExhausted.description`
      - Tests:
        - `__tests__/features/landing/DeckCard.test.tsx` — renders CandidateHero + 4 sections, hides the extra sections.
        - `__tests__/features/landing/MarriageLandingScreen.deck.test.tsx` — index starts at 0; Dislike advances index; Like advances index + fires Snackbar; Undo decrements (bounded at 0); Star fires Snackbar; empty state renders after last card; CollapsingActionBar is NOT in the tree when index >= DECK_FIXTURES.length.
        - `__tests__/features/landing/MarriageLandingScreen.deck.test.tsx` — bell-dot mirror: passing a modified `dummyprofile.__dummy_display_only.has_unread_notifications = true` propagates the dot regardless of deck-card values; toggling deck-card values does NOT change the dot.
        - `__tests__/features/landing/MarriageLandingScreen.deck.test.tsx` — assert that Like does NOT call `useFriendship()` mutators (spy on `acceptRequest`/`declineRequest` and assert not called).
        - `__tests__/features/landing/CandidateHero.deck.test.tsx` — CandidateHero accepts a minimal `CandidateHeroProfile` literal (only the required fields) without any cast at the call site, and renders correctly.
    notes: |
      DeckCard sections must NOT be duplicated — import from `@/features/profile-sections/sections/*`. The narrower `DummyDeckProfile` shape still won't structurally satisfy `UserProfile & DummyOverlay` (the profile-section components' contract), so the existing PRD-blessed cast pattern still applies at the DeckCard boundary for those four sections: `deck as unknown as UserProfile & DummyOverlay`. CandidateHero is the exception — it now accepts the widened `CandidateHeroProfile` directly with no cast.

  - id: 13.4
    title: OtherProfileScreen — full profile behind back-arrow header + access gate
    agent: frontenddeveloper
    done: false
    depends_on: [13.2]
    acceptance_criteria:
      - **`ProfileScrollView` gains a `contactVisible?: boolean` prop (S5, answer a).** Extend `ProfileScrollViewProps` in `src/features/profile-sections/ProfileScrollView.tsx` with an optional `contactVisible?: boolean` (defaults to `true` so phase-12 callers — `MarriageLandingScreen` and `MyProfileScreen`'s Preview tab — continue to render `ContactActionsSection` unchanged). When `contactVisible === false`, `ContactActionsSection` is skipped entirely (not rendered → no phone row, no share button, no disabled Favourite/Block/Report triad). Add a phase-12-callers regression test asserting the section still renders by default when the prop is omitted.
      - **New reusable `BackHeaderBar` component (Note 4).** Create `src/features/profile/components/BackHeaderBar.tsx` — a back-arrow-only header visually consistent with phase-12's `HeaderBar` (same paddings, same `useSafeAreaInsets` handling, same `bg.primary` background, same subtle shadow, same 40×40 icon-button hit target). Props: `onBack: () => void` and `accessibilityLabel: string`. Icon: lucide `ArrowLeft`. Not inlined — this component is expected to be reused in phases 15, 17, and 18 (add a JSDoc note stating so). Test: renders, calls `onBack` on press, uses the passed accessibility label.
      - New screen `src/features/profile/screens/OtherProfileScreen.tsx`:
        - Route param: `{ userId: string, source: 'friend' | 'request' }` typed through the ExploreStack ParamList.
        - **Profile resolution (NG1).** Regardless of `source`, resolves the target `DummyFullProfile` via `useFriendship().getFullProfile(userId)`. Do NOT re-import the Mehvish/Qurat fixtures at the screen. If `getFullProfile()` returns `undefined`, render the access-guard EmptyState.
        - Renders `BackHeaderBar` (created above) at the top with `accessibilityLabel={t('otherProfile.back')}` and `onBack={() => navigation.goBack()}`.
        - Renders `<ProfileScrollView profile={profile} viewer="other" contactVisible={source === 'friend'} />` — reuses the existing 14-section catalog exactly as it appears when viewed from the landing page. The `contactVisible={source === 'friend'}` binding closes the pending-request phone-number leak (S5, answer a).
        - When `source === 'request'`, an **inline request-action bar** appears at the top of the scrollable content (below the header, above the hero) with two buttons: **Accept** (primary variant) and **Decline** (ghost/outline variant).
          - **Accept** calls `useFriendship().acceptRequest(userId)` → shows Snackbar `t('otherProfile.acceptedToast')` → after 1500 ms calls `navigation.goBack()`. (The widened guard from B1 keeps the profile visible during the 1500 ms window because `isFriend(userId)` is now `true`.)
          - **Decline (NG2 — immediate goBack).** Calls `useFriendship().declineRequest(userId)` and IMMEDIATELY calls `navigation.goBack()` (no 1500 ms delay). The Decline snackbar `t('otherProfile.declinedToast')` fires from the previous screen (Explore Requests) — the `ExploreHomeScreen` snackbar surface catches it. Do NOT hold the profile screen open for 1500 ms after Decline, because after `declineRequest()` runs the user is neither a friend nor a pending-request-sender, so the broadened access guard would trip and paint the "Not authorized" EmptyState on top of the toast — the same class of bug that B1 fixed for Accept, in reverse.
        - **Access guard (B1, answer a — broaden the guard).** On mount AND on re-render, apply this rule:
          - If `source === 'friend'` and `isFriend(userId) === false` → EmptyState.
          - If `source === 'request'` and `receivedRequestFrom(userId) === false` AND `isFriend(userId) === false` → EmptyState.
          The second rule intentionally allows the screen to remain in the "authorized" state during the 1500 ms window between `acceptRequest()` firing and `goBack()` returning, because once Accept has run the user IS a friend and viewing their profile is still authorized. Render `EmptyState` with `t('otherProfile.notAuthorized.title')` and `t('otherProfile.notAuthorized.description')` when the guard trips.
      - Labels added to `labels.en.json` + `labels.ur.json` (full parity):
        - `otherProfile.acceptedToast`
        - `otherProfile.declinedToast`
        - `otherProfile.notAuthorized.title`
        - `otherProfile.notAuthorized.description`
        - `otherProfile.actions.accept`
        - `otherProfile.actions.decline`
        - `otherProfile.back` (accessibility label for the back button)
      - Tests:
        - Renders with `source='friend'` for Mehvish's userId → shows ProfileScrollView with `ContactActionsSection` (phone row present), no action bar.
        - Renders with `source='request'` for Qurat's userId → shows ProfileScrollView WITHOUT `ContactActionsSection` (phone row absent) + action bar with Accept + Decline.
        - Access-guard: unknown userId with `source='friend'` → EmptyState.
        - Access-guard: unknown userId with `source='request'` → EmptyState. (Note 3 — symmetric case.)
        - **Accept-flow no-flicker test (B1, answer a).** Render with `source='request'` for Qurat's userId. Fire Accept. Assert that during the 1500 ms window BEFORE `goBack()` is called, the screen still renders the ProfileScrollView (not the EmptyState) — because `isFriend(Qurat)` is now `true`, the widened guard passes. Assert the "accepted" snackbar is visible in the same window. Use `jest.useFakeTimers()` and step forward 1499 ms before asserting; then step past 1500 ms and assert `navigation.goBack()` was called.
        - Accept press → calls `acceptRequest` → after 1500 ms navigates back.
        - **Decline press → calls `declineRequest` → IMMEDIATELY calls `navigation.goBack()` in the SAME tick (assert with `jest.useFakeTimers()` and NO `advanceTimersByTime` call before the `goBack` assertion).** The Decline snackbar is NOT rendered on this screen — only the `t('otherProfile.declinedToast')` handoff to Explore is fired (assert by spying on the `ExploreHomeScreen` snackbar surface OR by asserting the toast text is NOT present on OtherProfileScreen).
        - Back button press (`BackHeaderBar.onBack`) → navigates back.
        - **Missing profile → EmptyState.** Render with a `userId` that `getFullProfile()` returns `undefined` for — screen shows the access-guard EmptyState (covers the NG1 defensive path).
    notes: |
      No new profile-section components. The full-profile view is pixel-identical to the "other" viewer path already used in phase 12, with two differences: (a) the header is a back-arrow-only `BackHeaderBar` instead of the landing `HeaderBar`, and (b) `ContactActionsSection` is hidden when `source='request'` per the `contactVisible` prop. The `contactVisible` prop is threaded ALL the way through `ProfileScrollView` into a simple conditional render — no lifting into `ContactActionsSection`'s own logic.

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
          - Reads `requests` from `useFriendship()` — resolves each `from_user_id` to the corresponding `DummyFullProfile` via `useFriendship().getFullProfile(from_user_id)` (NG1). If a lookup returns `undefined` (defensive), skip that row.
          - **Snackbar surface for cross-screen Decline handoff (NG2).** The `ExploreHomeScreen` renders its own local `Snackbar` (same pattern as `MarriageLandingScreen`) which serves BOTH the row-level Accept/Decline button toasts AND the toast forwarded from `OtherProfileScreen`'s Decline flow. When `OtherProfileScreen` fires Decline and immediately `goBack()`s, the `ExploreHomeScreen` receives focus and shows the "Request declined" snackbar via a small pending-toast mechanism: either (a) route param `pendingToast?: string` on `ExploreHomeScreen` set by `OtherProfileScreen` before `goBack()`, cleared on read; or (b) a `pendingToast: string | null` field on `FriendshipProvider` set by `declineRequest`'s call site and consumed by `ExploreHomeScreen` on focus. Either is acceptable — pick one and document the choice in a code comment.
          - Renders `FlatList` of requests; each row is a **`Row` (sibling structure — NOT nested — see Note 1 below)** with:
            - Left: a `TouchableArea` wrapping ONLY the (`ProfileThumbnailCircle` size 48 + `Column` with full name `Heading heading.sm` + subtitle `Text label.sm` reading `t('explore.requests.sentYou')`) group. Its `onPress` → `navigation.navigate('OtherProfileScreen', { userId: from_user_id, source: 'request' })`.
            - Right: a sibling `Row` (OUTSIDE the TouchableArea) with two small buttons: `Button variant="primary" size="sm" label={t('explore.requests.accept')}` and `Button variant="ghost" size="sm" label={t('explore.requests.decline')}`.
          - **Note 1 (touch-scoping).** Do NOT wrap the outer row in a single `TouchableArea` with the two `Button`s as children — RN's default touch propagation will fire BOTH the row press AND the button press when a button is tapped, causing simultaneous navigate + accept/decline. The sibling structure above (TouchableArea on the left column + buttons in a sibling Row) avoids this cleanly with zero `stopPropagation` needed.
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
