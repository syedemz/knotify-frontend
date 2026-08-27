# Phase 14 brainstorm — Bookmarks

## 2026-08-27 10:29 brainstorm (re-run — verifying PRD edits landed)

The user picked answers to every concern from the 10:11 brainstorm (see `QA/explanations.txt` for the full write-up and picks). All PRD edits were applied and the resolutions are recorded under `open_decisions_locked_by_user` (Q1–Q7).

Verification sweep against the current PRD:

- **B1 (tabBarHidden rename)** — RESOLVED. Story 14.2 (`tabBarHidden.value does NOT reset`) and story 14.4 (`hidden: pass tabBarHidden from src/state/ui/tabBarHidden.ts`) now reference the current name/path. Notes block also swapped.
- **B2 (label namespace)** — RESOLVED. Story 14.3 uses `explore.bookmarks` and calls out the existing `explore.friends` / `explore.requests` convention. Labels list updated.
- **B3 (LinearGradient dropped)** — RESOLVED. Story 14.3 AC now says "plain `View` with `rgba(0, 0, 0, 0.55)` scrim, no `LinearGradient`, no `expo-linear-gradient` dependency". Notes block reinforces the ban.
- **S1 (route type split)** — RESOLVED. Story 14.3 owns `ExploreStackParamList` entry + placeholder screen; 14.4 replaces the placeholder and deletes it.
- **S2 (provider tree)** — RESOLVED. Story 14.1 AC now says "insert BookmarksProvider between FriendshipProvider and NavigationContainer, keeping all existing outer providers untouched" and points at App.tsx as authoritative.
- **N1 (photo fallback)** — RESOLVED. Story 14.3 AC now specifies `theme.colors.bg.surface` fallback when `resolveDummyPhoto()` returns `undefined`.
- **N2 (testID verify)** — RESOLVED. Story 14.4 test block instructs the subagent to verify SendRequestModal testIDs before writing assertions.
- **N3 (AsyncStorage mock)** — no PRD edit needed; story 14.1 AC already handles registration.

No new drift surfaced on the re-scan. Dependency graph unchanged: 14.1 → 14.2 → 14.3 → 14.4 (serial). Proceeding to Step 1 (tracking-issue creation).

---

## 2026-08-27 10:11 brainstorm

Audit of `implementationplan/phase-14-bookmarks.md` against the current codebase before dispatch. Findings grouped by severity.

### Blockers — MUST be addressed before dispatch

**B1. `marriageTabBarHidden` was renamed to `tabBarHidden` and relocated.**
Story 14.4 AC (`hidden` prop wiring on FloatingAddRequestButton) instructs to `pass 'marriageTabBarHidden' from 'src/features/landing/shared/marriageTabBarHidden.ts'`. That file no longer exists at that path. The actual shared value lives at:

- Path: `src/state/ui/tabBarHidden.ts`
- Export: `tabBarHidden = makeMutable(0)` (the same driver, just renamed once Explore also started writing to it in phase 13 — the JSDoc explains the rename)

**Fix**: Update story 14.4 AC to read `pass 'tabBarHidden' from 'src/state/ui/tabBarHidden.ts'`. Also update the notes block that mentions "the same `marriageTabBarHidden` shared value" — say `tabBarHidden`. And update the `context_summary` reference to the shared value name.

**B2. Label key convention drift — `explore.tabs.*` is not the current namespace.**
Story 14.3 AC adds `explore.tabs.bookmarks` and asserts existing keys `explore.tabs.friends` / `explore.tabs.requests`. Neither of those two exists. The actual current keys for the Explore tab segments live under `explore.friends` and `explore.requests` (no `.tabs.` middle segment).

**Fix**: pick one:

- (a) rename the new key to `explore.bookmarks` (matches convention, minimal churn), OR
- (b) rename existing `explore.friends` / `explore.requests` to `.tabs.` variant to match the new key (broader churn, would touch phase-13 code).

Recommend (a). Update the AC accordingly and drop the "alongside the existing `explore.tabs.friends`" phrasing.

**B3. `expo-linear-gradient` is not installed.**
Story 14.3 uses `LinearGradient` for the scrim over each `BookmarkCard`. The PRD notes flag this ("verify presence before writing the import") but do not make installation an explicit AC.

**Fix**: add an explicit AC to story 14.3: `Run 'npx expo install expo-linear-gradient' if not present in package.json.` (Not a real blocker — the notes cover it — but making it an AC removes ambiguity for the subagent.)

### Meaningful risks — flag, but do not block

**R1. Story 14.3 references a route type that story 14.4 declares.**
`BookmarkCard`'s `onPress` in `ExploreHomeScreen` calls `navigation.navigate('BookmarkDeckViewScreen', { userId })`. That route is added to `ExploreStackParamList` in story 14.4. If TS is strict on the navigation types, 14.3 will fail to type-check until 14.4 lands.

**Options**:

- (a) Reorder: run 14.4 before 14.3. Currently 14.4 `depends_on: [14.1, 14.3]` — the 14.3 dep is only for the entry point (the tab that opens the screen). Since 14.3 needs to `navigate('BookmarkDeckViewScreen')`, they are actually mutually dependent unless one side stubs the other.
- (b) Split: move the `ExploreStackParamList` type addition + the route registration in `ExploreStack.tsx` into a tiny sub-step at the start of 14.4 that is executed AS PART OF 14.3. Practically this means 14.3's subagent adds the type + a placeholder screen component, then 14.4's subagent replaces the placeholder with the real `BookmarkDeckViewScreen`. Adds one file to 14.3.
- (c) Accept a TS suppression: `navigation.navigate` cast the target as `any` in 14.3 with a `TODO(14.4): remove cast` comment. Cheap, ugly.

Recommend (b). Update story 14.3 AC to include: `Register 'BookmarkDeckViewScreen: { userId: string }' on ExploreStackParamList in src/navigation/types.ts, and add a placeholder screen in ExploreStack.tsx that renders 'null'. Story 14.4 replaces the placeholder with the real screen.`

**R2. AsyncStorage jest mock is not currently registered.**
`jest.setup.ts` is empty (comment-only). Story 14.1 AC says "Use the standard preset. If not registered, add it — do NOT roll a bespoke mock." That is already correctly worded — the subagent will add it. Not a blocker, but the subagent should be reminded to verify that no other test in the suite already stubs AsyncStorage differently (there is nothing today, but the sweep is cheap).

**R3. Provider tree descriptive drift.**
Story 14.1 AC describes the current provider order as `AuthProvider > OnboardingCompletionProvider > FriendshipProvider > NavigationContainer`. The actual tree is:

```
GestureHandlerRootView > SafeAreaProvider > ThemeProvider > LanguageProvider > 
QueryProvider > AuthProvider > OnboardingCompletionProvider > FriendshipProvider > 
NavigationContainer
```

The insertion point the PRD picks (between `FriendshipProvider` and `NavigationContainer`) is still valid. This is a description bug, not a functional one, but the subagent may look at the current tree, see the mismatch, and second-guess where to insert. Update the AC to say "insert `BookmarksProvider` between `FriendshipProvider` and `NavigationContainer`" without the misleading full-tree description.

**R4. `SendRequestModal` testIDs not verified.**
The audit confirmed the `SENDING_HOLD_MS = 1000` constant and the `onCancel()`-after-`onConfirmed()` behavior at lines 114-118 exactly as the PRD claims, but did not directly verify that testIDs `send-request-card` and `send-request-no-ask` exist. Story 14.4 tests query by these IDs. If they don't exist, the tests fail without a code change to `SendRequestModal.tsx` (which the PRD forbids). Ask the 14.4 subagent to verify testIDs before writing the assertions and either use existing IDs, add new ones (a passive change to `SendRequestModal` that does not alter behavior), or query by role/text instead.

### Minor / nitpicks

**M1. `t('landing.actionUnavailable')` label is present** (value: "Available in a later phase"). Keeping it is safe. ✓

**M2. `theme.colors.status.info` exists** (palette.info = `#5B8DEF`). The optional filled-Star tint in story 14.2 is theme-legal. ✓

**M3. `BackHeaderBar` JSDoc actually says "phase 15, 17, 18"** — the PRD quote matches the file verbatim. ✓

**M4. `resolveDummyPhoto()` returns `undefined` for null/missing paths** — story 14.3's `BookmarkCard` background image must handle `undefined` gracefully (fall back to a solid-colour background or a placeholder asset). Add an AC or let the subagent pick — either is fine, but call it out so the card doesn't render a blank rectangle when a fixture has no `photos[0]` and no `photo_url`.

### Non-issues (verified match)

- `@react-native-async-storage/async-storage` v2.2.0 ✓
- `lucide-react-native` includes `UserPlus` ✓
- React Native 0.85.3 supports `columnWrapperStyle: { gap }` ✓
- `DeckCard`, `SendRequestModal`, `FloatingChatButton`, `BackHeaderBar`, `dummyPhotoRegistry`, `DummyDeckProfile`, `FriendshipProvider`, `ExploreStack.tsx`, `CollapsingActionBar`, `MarriageLandingScreen`, `DECK_FIXTURES`, all theme tokens — all exist at the paths and shapes the PRD claims ✓
- `src/features/bookmarks/` does not exist yet (as expected) ✓
- SecureStore keys `dummy.profile` / `dummy.onboarding.complete` naming convention confirmed via context.md ✓

### Recommended PRD edits before proceeding

1. B1 — swap `marriageTabBarHidden`/`src/features/landing/shared/…` → `tabBarHidden`/`src/state/ui/tabBarHidden.ts` in story 14.4 (AC + notes + context_summary).
2. B2 — rename the new label key to `explore.bookmarks` and drop the false claim that `explore.tabs.friends` / `explore.tabs.requests` already exist. Story 14.3 AC.
3. B3 — add explicit "install expo-linear-gradient if absent" AC to story 14.3.
4. R1 — split the route-type registration into story 14.3 (with a null placeholder), leaving 14.4 to swap in the real screen. Update 14.3 ACs.
5. R3 — soften the provider-tree description in story 14.1 to just say "insert between `FriendshipProvider` and `NavigationContainer`".
6. M4 — add "if `resolveDummyPhoto()` returns `undefined`, render a solid `theme.colors.bg.surface` background under the overlay" to story 14.3.

R2 and R4 are subagent-time verifications; no PRD edit required.

### Dependency graph — verified

- 14.1: `depends_on: []` — hook + provider + helper. Ships first.
- 14.2: `depends_on: [14.1]` — Star wiring needs the hook. Correct.
- 14.3: `depends_on: [14.1]` — grid needs the hook. Correct. (Adds route-type registration per R1.)
- 14.4: `depends_on: [14.1, 14.3]` — deck view needs the hook AND the tab that opens it. Correct.

Serial execution order: 14.1 → 14.2 → 14.3 → 14.4. No parallelism eligibility (each downstream needs 14.1, and 14.4 needs 14.3).

### Prompt

Address these gaps in the PRD and re-run `/implement-phase 14`, or proceed with the current PRD? [address/proceed]
