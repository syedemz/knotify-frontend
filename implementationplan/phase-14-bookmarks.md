phase: 14
title: Bookmarks
last_updated: 2026-08-27

context_summary: |
  Phase 14 turns the currently-inert **Star (⭐) button** on the Marriage-tab deck into a real
  bookmarking action, and introduces a third subtab on the Explore tab — **Bookmarks** —
  where saved deck profiles appear as a 2-column grid of image-backed cards. Tapping a card
  opens a new full-screen **BookmarkDeckView** that renders the same DeckCard body used on
  the landing page, plus a floating "send request" action button. Confirming the request
  through the existing phase-13 `SendRequestModal` dismisses the modal AND pops back to the
  Bookmarks tab.

  **Storage is AsyncStorage-only, no backend calls.** Bookmarks are keyed under a single
  `@react-native-async-storage/async-storage` (v2.2.0, already installed) key
  `dummy.bookmarks` and hold an array of full `DummyDeckProfile` records (not just user_ids)
  so BookmarkDeckView can render the full deck body without any secondary lookup. All
  storage access goes through a **helper module** (`bookmarksStorage.ts`) — no inline
  `AsyncStorage.getItem` / `setItem` calls in screens, hooks, or components. A thin
  `BookmarksProvider` sits on top of the helper to (a) keep an in-memory mirror of the
  persisted state, (b) publish `useBookmarks()` for UI reads/writes with instant re-renders,
  and (c) hydrate once on cold start. Every mock-only surface is grep-tagged `TODO(mock-only)`
  per the workspace convention and enumerated in `context.md → Before shipping → Mock-only
  pipeline` teardown list.

  **Reuse rule (from phase 13 — restated here so it does not get lost).** The visual
  language established in phases 12–13 is authoritative. Use existing theme tokens
  (`bg.primary`, `bg.surface`, `accent.primary`, `theme.spacing.*`, `theme.radii.*`,
  `theme.shadows.*`, text colours), existing catalog primitives (`Row`, `Column`, `Text`,
  `Heading`, `Button`, `TouchableArea`, `EmptyState`, `Snackbar`, `Avatar`,
  `ProfileThumbnailCircle`, `Icon`), and — critically — **reuse existing composite
  components**:
    - `DeckCard` (`src/features/landing/components/DeckCard.tsx`) — the CandidateHero +
      AboutMe + MarriageIntentions + Education + ProfessionalCareer stack. Rendered on
      the BookmarkDeckView body **as-is**, no fork.
    - `SendRequestModal` (`src/features/landing/components/SendRequestModal.tsx`) — the
      two-step ask → confirm → sending Lottie flow shipped in phase 13. Reused unchanged
      for the BookmarkDeckView "send request" FAB.
    - `FloatingChatButton` (`src/features/profile/components/FloatingChatButton.tsx`) —
      **pattern reference** for a scroll-coupled round FAB anchored bottom-right above
      the tab bar. Phase 14 introduces a sibling `FloatingAddRequestButton` following the
      same geometry, animation contract, and JSDoc structure — with a `UserPlus` icon
      instead of `MessageCircle`.
    - `BackHeaderBar` (`src/features/profile/components/BackHeaderBar.tsx`) — reused on
      BookmarkDeckView per its phase-13 JSDoc "expected to be reused in phases 15, 17,
      18" note.
    - `ExploreHomeScreen`'s two-segment tab-bar pattern — extended in place to
      **three segments** (Friends | Requests | Bookmarks), same segment control style,
      same brand/inactive colour tokens.
    - `ExploreStack` — extended with the new `BookmarkDeckViewScreen` route alongside
      the existing `ExploreHomeScreen` + `OtherProfileScreen` routes.
  No new colour tokens, no new radii, no duplicate section components, no bespoke tab-bar
  control. The bookmark card is a new visual atom (image-backed with a thick raised border);
  everything else composes existing primitives.

  **Star button semantics change.** In phase 13 the Star button on `CollapsingActionBar`
  fires `Snackbar t('landing.actionUnavailable')`. Phase 14 replaces that handler with a
  toggle:
    - If the current deck card is NOT bookmarked → add it, fire Snackbar
      `t('landing.bookmark.added')`, and (optionally, subagent picks) briefly swap the
      Star's stroke color to accent to reflect the new state. Deck index does NOT
      advance — bookmarking is a save action, not a swipe.
    - If the current deck card IS already bookmarked → remove it, fire Snackbar
      `t('landing.bookmark.removed')`. Deck index does NOT advance.
  The `t('landing.actionUnavailable')` label key stays in the label files (still used
  by any future disabled surface); only its Star wiring is retired.

  **Access from where.** Bookmarks are accessible ONLY through the new Explore →
  Bookmarks subtab in phase 14. No home-screen shortcut, no menu-tab surface, no deep
  link. Bookmarks persist across app restarts (that is the whole point of using
  AsyncStorage over the in-memory `FriendshipProvider` pattern) — so re-opening the
  app after Star-tapping Aisha and Nadia will still show them on the Bookmarks tab.

open_decisions_locked_by_user:
  # Resolved during /implement-phase 14 brainstorm on 2026-08-27. See
  # phasebrainstorms/phase-14-bookmarks-brainstorm.md and QA/explanations.txt.
  - Q1 (Blocker 1): `marriageTabBarHidden` was renamed to `tabBarHidden` and moved
    to `src/state/ui/tabBarHidden.ts` during phase 13. All references in this PRD
    have been swapped. Story 14.4 AC + notes now use `tabBarHidden`.
  - Q2 (Blocker 2): New tab label key is `explore.bookmarks` (NOT `explore.tabs.bookmarks`)
    to match the existing `explore.friends` / `explore.requests` convention. Story 14.3
    AC + labels list updated.
  - Q3 (Blocker 3): DO NOT install `expo-linear-gradient`. `BookmarkCard` uses a plain
    `View` with a flat `rgba(0, 0, 0, 0.55)` scrim at the bottom band. Revisit with a
    real gradient in a follow-up if the flat scrim reads harshly on device.
  - Q4 (Sharpen 1): Story 14.3 owns the route-type registration for
    `BookmarkDeckViewScreen` + a placeholder screen; story 14.4 replaces the
    placeholder with the real component and deletes the placeholder file. This
    splits the type/screen ownership cleanly and lets 14.3's tests compile.
  - Q5 (Sharpen 2): Story 14.1's provider-tree AC now says "insert between
    FriendshipProvider and NavigationContainer" without listing the outer providers
    (which have grown to 9 total). Read App.tsx as authoritative.
  - Q6 (Note 1): BookmarkCard falls back to a `theme.colors.bg.surface` solid
    background if `resolveDummyPhoto()` returns `undefined`.
  - Q7 (Note 2): Story 14.4 tests verify the exact SendRequestModal testID strings
    before writing assertions; if missing from the phase-13 modal, add them as a
    passive change.

stories:

  - id: 14.1
    title: BookmarksStorage helper + BookmarksProvider + useBookmarks hook
    agent: frontenddeveloper
    done: true
    depends_on: []
    tracking_issue: 122
    acceptance_criteria:
      - New helper module `src/features/bookmarks/storage/bookmarksStorage.ts` exposing a
        thin, side-effect-free API around `@react-native-async-storage/async-storage`
        (already installed, v2.2.0 — see package.json). Public surface (all async):
          - `getBookmarks(): Promise<DummyDeckProfile[]>` — reads the `dummy.bookmarks`
            key, JSON-parses, returns the array. On a missing key returns `[]`. On a
            parse error logs `console.warn` and returns `[]` (fail-open, never throws).
          - `saveBookmarks(bookmarks: DummyDeckProfile[]): Promise<void>` — JSON-stringifies
            and writes. Called by `addBookmark` / `removeBookmark`; not typically invoked
            directly by UI code.
          - `addBookmark(profile: DummyDeckProfile): Promise<DummyDeckProfile[]>` — reads,
            dedupes on `user_id` (if the profile is already stored, returns the existing
            array unchanged — idempotent), otherwise appends and writes. Returns the new
            array so callers can update in-memory state without a second read.
          - `removeBookmark(userId: string): Promise<DummyDeckProfile[]>` — reads, filters
            out matching `user_id`, writes. Idempotent (removing a non-bookmarked user
            is a no-op returning the unchanged array).
          - `isBookmarked(userId: string): Promise<boolean>` — thin convenience wrapper
            over `getBookmarks().then(b => b.some(...))`. Provided for one-shot checks
            where the caller does not want to subscribe via `useBookmarks()`.
          - `clearBookmarks(): Promise<void>` — removes the `dummy.bookmarks` key
            entirely. Exposed for tests + the teardown checklist; not called by UI code.
        Constants:
          - Exported `BOOKMARKS_STORAGE_KEY = 'dummy.bookmarks'` (dummy-prefix matches
            the existing SecureStore convention `dummy.profile` / `dummy.onboarding.complete`
            and makes teardown grep-able).
        Grep-tag: place `TODO(mock-only): swap for real GET/POST/DELETE /bookmarks in
        phase-14 backend integration` at the top of the helper module.
        The helper module has ZERO React imports and can be imported from non-React
        code (tests, migration scripts). No components, no hooks, no side effects at
        import time.

      - New provider + hook `src/state/bookmarks/BookmarksProvider.tsx`:
          - `BookmarksProvider` React component, mounted in `App.tsx`. Insert
            `BookmarksProvider` between `FriendshipProvider` and `NavigationContainer`,
            keeping all existing outer providers untouched (do NOT delete or reorder
            `GestureHandlerRootView`, `SafeAreaProvider`, `ThemeProvider`,
            `LanguageProvider`, `QueryProvider`, `AuthProvider`,
            `OnboardingCompletionProvider`, or `FriendshipProvider`). The full current
            tree is longer than any prior phase's PRD lists — read App.tsx as
            authoritative.
          - On mount, calls `getBookmarks()` once and populates internal `useState<
            DummyDeckProfile[]>` seed. Exposes a `loading: boolean` flag that starts
            `true` and flips to `false` after the initial hydration resolves. Consumers
            that do not care about the initial-load flicker can ignore it.
          - `useBookmarks()` hook returns:
            ```
            {
              bookmarks: DummyDeckProfile[];
              loading: boolean;
              addBookmark: (profile: DummyDeckProfile) => Promise<void>;
              removeBookmark: (userId: string) => Promise<void>;
              isBookmarked: (userId: string) => boolean;   // synchronous read from in-memory mirror
              getBookmark: (userId: string) => DummyDeckProfile | undefined;
            }
            ```
          - `addBookmark(profile)` calls `bookmarksStorage.addBookmark(profile)`, then
            updates the in-memory state to the returned array. `removeBookmark(userId)`
            mirrors the same pattern with `bookmarksStorage.removeBookmark`. Both are
            fire-and-forget from the UI's perspective — the internal state flips
            synchronously as soon as the promise resolves, so any component reading via
            `useBookmarks()` re-renders on the next tick.
          - `isBookmarked` and `getBookmark` read from the in-memory mirror (NOT
            AsyncStorage) so they are synchronous and safe to use in render bodies /
            memo dependency arrays. Freshness is guaranteed because every mutation goes
            through `addBookmark` / `removeBookmark`, which update the mirror in the
            same tick as the storage write resolves.
          - Grep-tag: `TODO(mock-only): replace in-memory mirror with real
            useQuery(['bookmarks'])` inside the provider body next to the state seed.

      - Tests:
          - `__tests__/features/bookmarks/storage/bookmarksStorage.test.ts`:
            - `getBookmarks` on empty storage returns `[]`.
            - `getBookmarks` on corrupt JSON returns `[]` and logs `console.warn`.
            - `addBookmark` writes the profile then a second `addBookmark` with the
              same `user_id` is idempotent (array length stays 1).
            - `removeBookmark` removes by `user_id`; removing an unknown id is a no-op.
            - `isBookmarked` returns `true` after add, `false` after remove.
            - `clearBookmarks` wipes the key (subsequent `getBookmarks` returns `[]`).
          - Use the standard `@react-native-async-storage/async-storage/jest/async-storage-mock`
            preset (or the equivalent already registered in `jest.setup.ts`). If not
            registered, add it — do NOT roll a bespoke mock.
          - `__tests__/state/bookmarks/BookmarksProvider.test.tsx`:
            - Renders with an empty seed; `bookmarks` is `[]`, `loading` starts `true`
              then flips to `false`.
            - `addBookmark(mehvish)` mutates the in-memory state; a sibling component
              reading via `useBookmarks()` re-renders with the new array on the next tick.
            - `removeBookmark(mehvish.user_id)` mirrors the reverse.
            - `isBookmarked(mehvish.user_id)` returns `true` after add, `false` after remove.
            - Idempotency: calling `addBookmark(mehvish)` twice leaves array length 1.
            - Cold-start hydration: seed AsyncStorage with a fixture array before mount;
              `bookmarks` reflects the seed after the initial `loading` flip.
    notes: |
      **Why AsyncStorage instead of SecureStore?** SecureStore is intended for secrets
      (auth tokens, phone number in some flows). Bookmarks are non-sensitive
      user-preference data at a size that can grow past the SecureStore per-key limits
      (2048 bytes on iOS) once we have 20+ bookmarks — a `DummyDeckProfile` is ~2 KB on
      its own. AsyncStorage has no size cap per key (only a per-database soft cap that
      easily accommodates thousands of bookmarks).

      **Why store the full profile, not just user_id?** BookmarkDeckView needs the
      About Me / Marriage Intentions / Education / Professional Career blocks to render.
      In the mock world, the only place those fields live is the `DECK_FIXTURES` array;
      but relying on that array as a lookup after the user has bookmarked a profile
      couples the bookmark UX to the deck fixture identity. Persisting the full profile
      snapshot at Star-tap time also means bookmarks survive across a hypothetical deck
      fixture reshuffle and — more importantly — this is exactly how a real backend
      `GET /bookmarks` response will shape it, so no data-model migration is needed at
      teardown. (Teardown replaces the storage helper's guts; the hook's public shape
      stays identical.)

      **Provider order matters.** `BookmarksProvider` sits AFTER `FriendshipProvider`
      because a future `BookmarkDeckView` may want to display the bookmarked user's
      friendship state (e.g. hiding the "send request" FAB if already a friend). Phase
      14 does NOT wire that dependency yet — but the tree order costs nothing and
      forward-compatibility is free.

  - id: 14.2
    title: Wire Star (⭐) button on MarriageLandingScreen → bookmark toggle
    agent: frontenddeveloper
    done: false
    depends_on: [14.1]
    tracking_issue: 123
    acceptance_criteria:
      - `MarriageLandingScreen.handleSuperLike` (currently `setSnackbarMsg(t('landing.actionUnavailable'))`
        + `setSnackbarVisible(true)`) is replaced with a bookmark toggle:
          - Read the current deck card: `const currentDeck = DECK_FIXTURES[currentDeckIndex]`
            (guarded by the existing `!isExhausted` check — the Star button is hidden in
            the exhausted state per phase-13 story 13.3 anyway, so the guard is a
            defensive `if (!currentDeck) return;`).
          - Read `isBookmarked` from `useBookmarks()`.
          - If `isBookmarked(currentDeck.user_id) === false`:
            - `await addBookmark(currentDeck)` (or fire-and-forget `.catch(console.warn)`,
              subagent picks — either is acceptable since the in-memory state flips
              synchronously on resolve).
            - `setSnackbarMsg(t('landing.bookmark.added'))` + `setSnackbarVisible(true)`.
          - Else (already bookmarked):
            - `await removeBookmark(currentDeck.user_id)`.
            - `setSnackbarMsg(t('landing.bookmark.removed'))` + `setSnackbarVisible(true)`.
          - Deck index does NOT change. `tabBarHidden.value` (the shared collapse
            driver at `src/state/ui/tabBarHidden.ts`) does NOT reset. The card stays
            on-screen after Star-tap; only the snackbar surfaces.

      - **Star icon visual state (optional but recommended).** In
        `CollapsingActionBar.tsx`, accept an optional `isSuperLikeActive?: boolean` prop
        (defaults to `false`). When `true`, the `Star` icon renders with `fill={theme.colors.status.info}`
        (or `theme.colors.accent.primary` — subagent picks the tone that reads best on
        the existing bg) alongside the current stroke; when `false`, the current
        stroke-only rendering is preserved unchanged. `MarriageLandingScreen` passes
        `isSuperLikeActive={isBookmarked(DECK_FIXTURES[currentDeckIndex]?.user_id ?? '')}`.
        If subagent decides the visual filled-state adds noise, they may skip this prop
        entirely and leave the icon appearance untouched — the state is still
        distinguishable from the snackbar text.

      - `t('landing.actionUnavailable')` — the label key stays in `labels.en.json` /
        `labels.ur.json`. Only its Star wiring is retired. Any future disabled surface
        can keep reusing it.

      - New labels added to `labels.en.json` + `labels.ur.json` (full parity):
          - `landing.bookmark.added` — "Added to bookmarks"
          - `landing.bookmark.removed` — "Removed from bookmarks"

      - Tests:
          - `__tests__/features/landing/MarriageLandingScreen.deck.test.tsx` (existing file
            — extend, do NOT create a new one):
            - Star-tap on an unbookmarked deck card calls `useBookmarks().addBookmark`
              with the current deck fixture AND fires the `landing.bookmark.added` snackbar.
              Assert deck index does NOT advance (still `DECK_FIXTURES[0]` after tap).
            - Star-tap on an already-bookmarked deck card calls `removeBookmark` with the
              current deck user_id AND fires the `landing.bookmark.removed` snackbar.
              Assert deck index does NOT advance.
            - Assert `useBookmarks` is called (mock via `jest.mock` at the file top;
              default mock returns `bookmarks: [], isBookmarked: () => false,
              addBookmark: jest.fn(), removeBookmark: jest.fn(), getBookmark: () =>
              undefined, loading: false`).
          - The existing phase-13 assertion "Star fires Snackbar with actionUnavailable"
            should be REMOVED — the behavior has changed. Do not attempt to keep both
            paths.
    notes: |
      Do NOT touch the Dislike / Like / Undo handlers — this story is scoped to Star
      only. In particular, do not remove the phase-13 `TODO(mock-only): real
      request-create ships in phase 15` comment on the Like handler; it is still
      accurate.

      The choice to keep `t('landing.actionUnavailable')` in the label files (rather than
      deleting) is deliberate. Grep hits on that key will still surface if a future
      screen wires it to a disabled action, which is fine — deletion would only save
      ~30 bytes and would break any git-history diff searching for it.

  - id: 14.3
    title: Bookmarks subtab in ExploreHomeScreen + BookmarkCard 2-column grid
    agent: frontenddeveloper
    done: false
    depends_on: [14.1]
    tracking_issue: 124
    acceptance_criteria:
      - `ExploreHomeScreen` gains a **third subtab** labelled `t('explore.bookmarks')`
        alongside the existing Friends and Requests segments (whose current label keys
        are `explore.friends` and `explore.requests` — no `.tabs.` middle segment;
        the new key follows the same convention). Segment control style (brand colour
        on active, secondary on inactive, same padding/spacing) is preserved unchanged
        from the phase-13 two-segment implementation. The tab order left→right is:
        **Friends | Requests | Bookmarks**.

      - When `activeTab === 'bookmarks'`:
          - Reads `bookmarks` from `useBookmarks()`.
          - Renders a `FlatList` with `numColumns={2}`, `keyExtractor={(b) => b.user_id}`,
            row gap and column gap of `theme.spacing.md`, horizontal `contentContainerStyle`
            padding of `theme.spacing.md`.
          - Each cell renders a new `BookmarkCard` component (see below).
          - Empty state: `EmptyState` with `t('explore.bookmarks.emptyTitle')` /
            `t('explore.bookmarks.emptyDescription')` — a short "Star a profile from the
            Marriage tab to save it here" pitch.

      - New component `src/features/bookmarks/components/BookmarkCard.tsx`. This is the
        one new visual atom introduced by phase 14. Requirements:
          - Aspect ratio: portrait, `aspectRatio: 3/4` (a card taller than it is wide, so
            two-across on a typical phone width reads as ~180×240dp).
          - Full-bleed background image: `photos[0]` if present, else `photo_url`. Use
            `resolveDummyPhoto()` from `src/assets/dummyPhotoRegistry.ts` to get a
            React Native `ImageSourcePropType`. Wrap in `Image` with `resizeMode="cover"`.
            **Do NOT** use `Avatar` — Avatar is circle-cropped and constrains the aspect.
            **Fallback:** if `resolveDummyPhoto()` returns `undefined` (fixture has
            neither `photos[0]` nor `photo_url`, or the asset isn't registered), render
            a solid `theme.colors.bg.surface` background under the overlay so text still
            has contrast rather than floating over a transparent void.
          - Overlay text at the bottom of the card, inside a plain `View` with a
            semi-opaque dark scrim (`backgroundColor: 'rgba(0, 0, 0, 0.55)'`) that
            spans the bottom band of the card (subagent picks a height that fits the
            two overlay lines with `theme.spacing.md` internal padding — roughly
            `~28%` of the card's height is a reasonable starting point). No
            `LinearGradient` and no `expo-linear-gradient` dependency for phase 14 —
            the flat scrim is the intentional MVP. If, on-device, the flat scrim reads
            harshly over some photos, we revisit with a real gradient in a follow-up.
            Overlay contents (stacked in a `Column` with `theme.spacing.xs` gap):
              - Line 1: `Heading variant="heading.sm"` — full name in the form
                `${first_name} ${last_name}` (both truncated with `numberOfLines={1}`).
              - Line 2: `Text variant="label.sm"` — `${age} · ${job_title}` (single line,
                truncated). If `job_title` is null, drop the ` · ` separator and render
                only the age; if `age` is null (shouldn't happen in fixtures but defend
                anyway), render only the job title. Neither can be missing without the
                other in the fixture invariants, but keep the guard.
              - Both text elements use `color={theme.colors.text.inverse}` (light on dark
                scrim). Do NOT hard-code `#FFFFFF` — the token accommodates future
                dark-mode inversion.
          - **Rounded edges + thick raised border.** `borderRadius: theme.radii.lg`,
            `borderWidth: 3`, `borderColor: theme.colors.border.default` (or
            `theme.colors.accent.primary` — subagent picks whichever reads as "thick +
            raised" in-app; both are theme-legal). Elevation via `...theme.shadows.md`
            (or `sm` if the visual weight is too heavy — subagent tunes). The border
            + shadow combo is what gives the "raised" impression per the user's brief.
          - `Pressable` wrapping the whole card (the whole card is the touch target).
            `onPress` → the caller-provided callback. `accessibilityRole="button"`,
            `accessibilityLabel={`${first_name} ${last_name}, ${age}, ${job_title}`}`.
            Pressed-state opacity `0.85`.
          - **No unbookmark affordance on the card itself** — removal happens either by
            re-tapping Star on the Marriage tab (from-source symmetry) or from a future
            long-press / swipe gesture (deferred). This story does not add an unbookmark
            button on the card.

      - `BookmarkCard`'s `onPress` in `ExploreHomeScreen` navigates:
        `navigation.navigate('BookmarkDeckViewScreen', { userId: bookmark.user_id })`.

      - **Route type registration + placeholder screen** (this story owns the type so
        14.3's `navigation.navigate` compiles):
          - In `src/navigation/types.ts`, add
            `BookmarkDeckViewScreen: { userId: string }` to `ExploreStackParamList`.
          - In `src/navigation/ExploreStack.tsx`, register the route with a temporary
            placeholder component that renders `null` (or a small centered `Text` with
            `TODO(14.4): real screen ships next`), `headerShown: false`. Story 14.4
            replaces this placeholder with the real `BookmarkDeckViewScreen` component
            and drops the placeholder file. Keep the placeholder in a co-located file
            (e.g. `src/features/bookmarks/screens/BookmarkDeckViewScreenPlaceholder.tsx`)
            so 14.4's delete step is a clean removal.

      - Grid layout details:
          - Use the standard `FlatList numColumns={2}` two-column pattern. Do NOT use
            `Row wrap`. FlatList gives free virtualisation and matches how Friends /
            Requests already render.
          - Each row uses `columnWrapperStyle={{ gap: theme.spacing.md }}` (RN 0.71+
            supports this). If the RN version in use does not support `columnWrapperStyle`
            gap, fall back to a `wrapperMargin: theme.spacing.md / 2` on each cell.
            Verify by running one screen render first.
          - Between rows: rely on the cell's own `marginBottom: theme.spacing.md` (set on
            the `BookmarkCard` container) — do NOT use `ItemSeparatorComponent`, which
            behaves oddly with `numColumns`.

      - New labels added to `labels.en.json` + `labels.ur.json` (full parity):
          - `explore.bookmarks` — tab label (matches existing `explore.friends` /
            `explore.requests` convention)
          - `explore.bookmarks.emptyTitle`
          - `explore.bookmarks.emptyDescription`

      - Tests:
          - `__tests__/features/bookmarks/components/BookmarkCard.test.tsx`:
            - Renders the background image via `resolveDummyPhoto()` (assert `Image`
              source prop).
            - Renders `${first_name} ${last_name}` and `${age} · ${job_title}` in the
              overlay.
            - `onPress` fires when the card is pressed.
            - Accessibility label composes name + age + job title.
            - Missing `job_title` (null) → renders age only, no ` · ` separator.
          - `__tests__/features/explore/ExploreHomeScreen.test.tsx` (existing file — extend):
            - New "Bookmarks" tab appears alongside Friends and Requests.
            - Bookmarks tab with seed `[Aisha]` renders one `BookmarkCard` in the grid.
            - Empty seed renders the EmptyState with `explore.bookmarks.emptyTitle`.
            - Tapping a BookmarkCard calls `navigation.navigate('BookmarkDeckViewScreen',
              { userId: <the card's user_id> })`.
            - Assert the tab order left→right is Friends | Requests | Bookmarks (query
              rendered order of the segment labels).
    notes: |
      **On the "thick raised border" phrasing.** The user's brief calls for cards that
      "look good" with the theme. The safest interpretation is a `3px` border in
      `border.default` with a soft `shadows.md`. If the subagent's eye says a `2px`
      accent-primary border reads better against the fixture photos, they may pick that
      instead — both are theme-legal, and the intent (visually raised, tactile) is what
      matters. Ship whichever reads best in-app; do not agonize over pixel-perfection at
      the PRD level.

      **Do NOT introduce a new theme token for the border.** Use `theme.colors.border.default`
      or `theme.colors.accent.primary` — both exist today.

      **Flat scrim, not a gradient — deliberate.** The user picked the flat
      `rgba(0, 0, 0, 0.55)` scrim over installing `expo-linear-gradient`. Do NOT
      install `expo-linear-gradient` in this phase; do NOT import it; do NOT add it
      to `package.json`. If the flat scrim reads harsh over some fixture photos on
      device, we revisit with a real gradient in a follow-up — but that decision is
      out of scope for phase 14.

  - id: 14.4
    title: BookmarkDeckViewScreen + FloatingAddRequestButton + SendRequestModal wiring
    agent: frontenddeveloper
    done: false
    depends_on: [14.1, 14.3]
    tracking_issue: 125
    acceptance_criteria:
      - **Route registration was completed in story 14.3** — `ExploreStackParamList`
        already has `BookmarkDeckViewScreen: { userId: string }` and `ExploreStack.tsx`
        already registers a placeholder (`headerShown: false`). This story replaces the
        placeholder component with the real screen defined below and deletes the
        placeholder file (`src/features/bookmarks/screens/BookmarkDeckViewScreenPlaceholder.tsx`).

      - New screen `src/features/bookmarks/screens/BookmarkDeckViewScreen.tsx`:
          - Route param resolved via `useRoute<RouteProp<ExploreStackParamList,
            'BookmarkDeckViewScreen'>>()`.
          - Reads the target deck profile via `useBookmarks().getBookmark(userId)`. If
            the bookmark has been removed underneath us (e.g. concurrent removal from
            another surface), render an `EmptyState` with `t('bookmarks.deckView.missingTitle')`
            + `t('bookmarks.deckView.missingDescription')`, plus a Back button. Do not
            crash, do not attempt to fetch, do not fall back to `DECK_FIXTURES` — the
            source of truth on this screen is AsyncStorage-via-useBookmarks.
          - Renders `BackHeaderBar` at the top (reuse `src/features/profile/components/
            BackHeaderBar.tsx`), `onBack={() => navigation.goBack()}`,
            `accessibilityLabel={t('bookmarks.deckView.back')}`.
          - Body is an `Animated.ScrollView` (matches the landing / other-profile scroll
            pattern) whose child is `<DeckCard deck={profile} />`. **Reuse `DeckCard`
            unchanged** — no fork, no wrapper, no prop additions. The scrollview handles
            top / bottom padding; the FAB overlays it.
          - **New `FloatingAddRequestButton` component** at
            `src/features/bookmarks/components/FloatingAddRequestButton.tsx`. Copy the
            geometry, animation contract, and JSDoc structure of
            `src/features/profile/components/FloatingChatButton.tsx` **exactly**:
            - Same `TAB_BAR_HEIGHT = 49`, same `BUTTON_SIZE = 60`, same round shape,
              same `bg.accent.primary` background, same `theme.shadows.md`.
            - Same `hidden: SharedValue<number>` prop and `useAnimatedStyle` mapping to
              `translateY: hidden.value * TAB_BAR_HEIGHT`.
            - Same `onPress`, `accessibilityLabel` prop contract.
            - Icon: `UserPlus` from `lucide-react-native` (not `MessageCircle`),
              `size={28}`, `strokeWidth={2.2}`, `color={theme.colors.text.inverse}`.
            - Same JSDoc pattern — a header comment explaining the scroll-coupled motion
              and pointing at `FloatingChatButton` as the sibling / pattern source.
          - `BookmarkDeckViewScreen` wires the FAB with:
            - `onPress`: opens the `SendRequestModal` by flipping a local
              `modalVisible: boolean` state.
            - `accessibilityLabel`: `t('bookmarks.deckView.sendRequestAccessibility')`
              (name interpolated if the label calls for it — subagent tunes).
            - `hidden`: pass `tabBarHidden` from `src/state/ui/tabBarHidden.ts` (the
              shared collapse driver — renamed from `marriageTabBarHidden` in phase 13
              when Explore also started writing to it; JSDoc at the top of the file
              explains the rename). Wire the same `scrollHandler` pattern used on
              `OtherProfileScreen` so scrolling on this screen ALSO drives the tab bar
              down (feature parity across all stack-detail screens — the tab bar's
              collapse behaviour should feel continuous regardless of which screen the
              user is on).

      - **SendRequestModal reuse** — no code changes to `SendRequestModal.tsx`. The screen:
          - Renders `<SendRequestModal visible={modalVisible} targetName={`${profile.first_name}
            ${profile.last_name}`} onCancel={handleCancel} onConfirmed={handleConfirmed}
            />` at the root of the screen tree (inside the outer `View`, sibling to the
            scrollview and the FAB).
          - `handleCancel = () => setModalVisible(false)`.
          - `handleConfirmed = () => { setModalVisible(false); navigation.goBack(); }`.
            After `onConfirmed()` fires (the phase-13 modal already fires `onCancel()`
            IMMEDIATELY AFTER `onConfirmed()` in the same frame — see
            `SendRequestModal.tsx:114-118`), the `goBack()` pops back to `ExploreHomeScreen`
            on the Bookmarks tab. **No snackbar on `BookmarkDeckViewScreen`** — the request
            is fire-and-forget mock theatre, matching the phase-13 Like semantics
            (`TODO(mock-only): real request-create ships in phase 15`). Do NOT wire this
            to `FriendshipProvider`; do NOT create a pending-request record. Add a
            `// TODO(mock-only): real request-create ships in phase 15` comment on
            `handleConfirmed`.

      - **Bookmarks tab stickiness on return.** The pop-back after `goBack()` should
        land on the `Bookmarks` segment specifically — not on Friends or Requests.
        `ExploreHomeScreen`'s current implementation stores `activeTab` in local state,
        so a `navigation.goBack()` that leaves the ExploreHomeScreen mounted will
        preserve the last-selected segment automatically (React Navigation preserves
        route state across a push/pop). Verify this behaviour empirically — if the
        bookmarks tab is NOT preserved (e.g. because `ExploreHomeScreen` unmounts on
        route change under `native-stack`), the fix is to lift `activeTab` into an
        `ExploreStack`-level context or a route param — subagent's pick, but the
        contract is: after confirming a request from `BookmarkDeckViewScreen`, the user
        MUST land back on `ExploreHomeScreen` with `activeTab === 'bookmarks'`.

      - **Bookmark persistence on this screen.** The bookmark that opened this screen
        is NOT removed by confirming the request. The user's mental model is
        "bookmarks are a persistent save list, separate from requests" — a bookmarked
        profile stays bookmarked until the user unbookmarks it (Star on the Marriage
        tab OR a future gesture on `BookmarkCard`). Do NOT call `removeBookmark` in
        `handleConfirmed`. If a future story wants "auto-remove after request confirmed",
        that is a separate ask.

      - New labels added to `labels.en.json` + `labels.ur.json` (full parity):
          - `bookmarks.deckView.back` — back-button accessibility label
          - `bookmarks.deckView.sendRequest` — FAB visible label (if any) / accessibility
          - `bookmarks.deckView.sendRequestAccessibility` — verbose accessibility form
            with `{name}` placeholder if the subagent chooses to interpolate
          - `bookmarks.deckView.missingTitle` — "This bookmark is no longer available"
          - `bookmarks.deckView.missingDescription` — "It may have been removed from your
            bookmarks."

      - Tests:
          - `__tests__/features/bookmarks/components/FloatingAddRequestButton.test.tsx`:
            - Renders a `UserPlus` icon inside a round pressable.
            - `onPress` fires when tapped.
            - Applies `translateY: hidden.value * TAB_BAR_HEIGHT` to the container
              (mirror the assertions used in the phase-13 `FloatingChatButton` test if
              any exist — check first; if none exist, write a minimal transform-style
              assertion via `getByTestId('floating-add-request-button-container')` and
              inspect the animated style).
          - `__tests__/features/bookmarks/screens/BookmarkDeckViewScreen.test.tsx`:
            - **Verify SendRequestModal testIDs BEFORE writing assertions.** Open
              `src/features/landing/components/SendRequestModal.tsx` and confirm the
              exact testID strings for (a) the modal card container and (b) the "No"
              button on the ask step. The PRD assumes `send-request-card` and
              `send-request-no-ask` but they were not directly verified in the pre-flight
              audit — if the real IDs differ, use the real ones. If SendRequestModal
              has NO testIDs, add them as a passive change (no behavior change) rather
              than querying by role/text (which is fragile against label edits).
            - Renders `BackHeaderBar` + `DeckCard` for a bookmarked profile.
            - Tapping the FAB opens `SendRequestModal` (assert modal visible via the
              verified testID).
            - Full ask → confirm → sending flow calls `navigation.goBack()` after the
              modal's `SENDING_HOLD_MS` (use `jest.useFakeTimers()` + `advanceTimersByTime(1000)`).
            - Cancelling on the ask step (press the verified "No" testID) closes the
              modal WITHOUT calling `navigation.goBack()`.
            - Missing bookmark (`getBookmark` returns `undefined`) → EmptyState is
              rendered, DeckCard is NOT.
            - The bookmark is NOT removed after confirming (assert `removeBookmark` mock
              was never called).
          - `__tests__/navigation/ExploreStack.test.tsx` (existing file — extend):
            - `BookmarkDeckViewScreen` is registered as a route (assert by pushing to
              it from an ExploreHomeScreen stub and verifying render).
            - `goBack()` from `BookmarkDeckViewScreen` lands on `ExploreHomeScreen`.
            - After push→goBack cycle, `activeTab` remains `'bookmarks'` on
              `ExploreHomeScreen` (verify tab-stickiness). If this test cannot pass
              without lifting `activeTab` to a route param, treat that as the story's
              scope creep and lift it — the tab-stickiness AC is non-negotiable.
    notes: |
      **Reuse discipline.** Do NOT copy code from `FloatingChatButton.tsx` into
      `FloatingAddRequestButton.tsx`. Import shared constants (`TAB_BAR_HEIGHT`,
      `BUTTON_SIZE`) from a co-located `src/features/profile/components/floatingButtonConstants.ts`
      if the subagent decides to factor them out, OR mirror them verbatim as a copy — the
      trade-off is minor and either is acceptable. Choose the option that requires the
      smaller diff on `FloatingChatButton.tsx` (which is production phase-13 code and
      should stay untouched unless the extraction is a clean drop-in).

      **On the tab-stickiness AC.** The failure mode here is: user Star-taps three deck
      cards, opens Bookmarks tab, taps a card, sends a request, lands back on Friends
      tab. That is a bad UX and the test catches it. If the fix requires lifting
      `activeTab` to a route param or context, do so — the ExploreStack is small enough
      that the refactor is a few lines.

      **On `hidden` propagation to the FAB.** Phase-13 `OtherProfileScreen` uses the
      same `tabBarHidden` shared value for its `FloatingChatButton`. Reusing
      the same shared value here means the tab bar's collapse state feels continuous
      across screens — the user sees no "reset" jump on push. This is the deliberate
      pattern; do not introduce a per-screen shared value.

teardown_additions:
  # Add to context.md → Before shipping → Mock-only pipeline after phase 14 ships.
  - Delete `src/features/bookmarks/storage/bookmarksStorage.ts` and its `TODO(mock-only)`
    tag. Replace with real REST/GraphQL-backed queries: `useBookmarksQuery()` fed by
    `GET /bookmarks`, `useToggleBookmarkMutation()` doing optimistic `POST /bookmarks` /
    `DELETE /bookmarks/{userId}` with rollback on error.
  - Delete the AsyncStorage key `dummy.bookmarks` on next launch via a one-shot
    migration (mirror the `dummy.profile` / `dummy.onboarding.complete` teardown pattern
    from phase 11). Add the migration entry to context.md → Before shipping → step 8.
  - Delete the module-scope `TODO(mock-only)` on the in-memory mirror inside
    `src/state/bookmarks/BookmarksProvider.tsx`; replace the mirror with the React Query
    cache backing `useBookmarksQuery()`. The public shape of `useBookmarks()` stays
    identical — consumers do not need to change.
  - Delete the `// TODO(mock-only): real request-create ships in phase 15` comment on
    `BookmarkDeckViewScreen.handleConfirmed` once phase 15's request-create wiring lands;
    wire `handleConfirmed` to call `useCreateFriendRequestMutation()` before `goBack()`.
  - Verify `grep -r 'TODO(mock-only)' src/` returns zero hits across the phase-11+12+13+14
    surfaces after all above steps are complete.

open_items:
  # None — the user's initial description locks the whole shape. Anything that surfaces
  # during /implement-phase 14 brainstorm gets promoted into open_decisions_locked_by_user
  # above with a Q-numbered answer, per the phase-13 convention.
