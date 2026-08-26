# Phase 13 brainstorm — Discover: deck (landing), friends + requests (Explore), gated full-profile view

## 2026-08-26 15:48 brainstorm

Per-phase review of `implementationplan/phase-13-discover.md`. All findings scoped to items already on the PRD — no new scope proposed.

### Blocking design gaps (recommend addressing before proceeding)

**B1. Access-guard race in Story 13.4's Accept flow.**
On `OtherProfileScreen` with `source='request'`, the mount guard says: *"if `receivedRequestFrom(userId) === false`, render EmptyState"*. But the Accept handler calls `acceptRequest(userId)` first, which flips `receivedRequestFrom → false` and `isFriend → true`, then waits 1500 ms before `goBack()`. During that 1500 ms window the screen re-renders — and the guard now matches → the user sees the "Not authorized" EmptyState under the "Accepted!" snackbar. That's the wrong UX.

Options:
- (a) Freeze the guard's decision on initial mount via `useRef<boolean>` snapshot.
- (b) Broaden the guard so `source='request'` also passes when `isFriend(userId) === true` — semantically correct (once accepted, they are a friend, so the view is still authorized). Simplest.
- (c) Call `goBack()` immediately and let the snackbar show on the previous screen. Changes the UX contract.

Recommend (b). Encode in AC as: *"Access guard for `source='request'`: allow if `receivedRequestFrom(userId) === true` OR `isFriend(userId) === true`."*

**B2. CandidateHero prop type vs `DummyDeckProfile`.**
`CandidateHero` is typed `readonly profile: DummyFemaleProfile` (see `src/features/landing/components/CandidateHero.tsx:38-44`). Story 13.1 introduces a NEW type `DummyDeckProfile` and story 13.3 says CandidateHero is "reused as-is". Without action, tsc will reject the DeckCard boundary. Story 13.3's `notes` already anticipates a cast at the DeckCard boundary for `ProfileScrollView`, but doesn't mention CandidateHero. Two options:
- (a) Cast the deck profile at CandidateHero's call site too — same pattern as ProfileScrollView, minimal churn.
- (b) Extract a narrower structural interface (`CandidateHeroProfile` = `Pick<...>` of the fields CandidateHero actually reads) and widen the prop type.

Recommend (a) for consistency with the ProfileScrollView cast already sanctioned in the PRD. Add to Story 13.3 AC/notes: *"CandidateHero cast follows the same pattern as ProfileScrollView — `deck as unknown as DummyFemaleProfile`."*

### Semantic / UX questions worth locking down

**S1. Bell unread-dot semantics.**
Story 13.3 says: *"unread-dot derived from the currently visible deck profile's `has_unread_notifications`"*. Semantically odd — the notifications bell is the *current user's* unread state, not the candidate's. Phase 12 already had this cheat (reading from `dummyfemale`). Phase 13 doubling down on it means every deck card can swing the dot on/off as the user swipes. Two paths:
- Keep as-written (mock-only fudge, matches phase 12).
- Change to derive from the *current user* (`dummyprofile.__dummy_display_only?.has_unread_notifications`) — one-line change, more semantically honest.

Recommend the current-user derivation. If keeping as-written, drop the "flicker on swipe" into `context.md`'s Before-shipping list so nobody debugs it later.

**S2. Undo revocation semantics.**
Story 13.3's Like fires a snackbar `"Friend request sent"` but does NOT (per current ACs) mutate `FriendshipProvider` — there is no acceptance criterion adding a pending-request record on Like. So Undo simply steps back the index; the "sent" snackbar was theatre. Confirm this is intended (phase 15 is where real request-write lands). If the intent is that the Like DOES create a pending request record here, we're missing a story or an AC in 13.3.

Recommend: keep Like as pure UI theatre in phase 13; add a note to Story 13.3 AC: *"Like does NOT write to FriendshipProvider — the pending-request seed used by the Explore Requests tab is the static `assets/dummyrequests.json`. Real request-create ships in phase 15."*

**S3. `CollapsingActionBar` in the deck-exhausted state.**
Story 13.3 leaves this open: *"CollapsingActionBar hides in the exhausted state (or its buttons become disabled — decide at brainstorm)"*. Recommend **hide entirely** (return `null` when `currentDeckIndex >= DECK_FIXTURES.length`) — matches EmptyState's "nothing to do here" affordance. Disabled-but-visible reads as "the action is broken", not "there's nothing left".

**S4. Scroll + tab-bar reset on deck advance.**
Story 13.3 says: *"Scroll position resets to 0 whenever `currentDeckIndex` changes"*. It doesn't mention the `marriageTabBarHidden` shared value. If the user has scrolled down (tab bar collapsed) and hits Dislike, the tab bar stays collapsed even though scrollY is now 0 on the new card — visually stuck. Add to Story 13.3 AC: *"On deck advance/undo, ALSO reset `marriageTabBarHidden.value = withTiming(0)` so the tab bar and action bar spring back into view."*

**S5. `ContactActionsSection` on `OtherProfileScreen` (request context).**
`ProfileScrollView viewer="other"` renders `ContactActionsSection` (phone row, Share row-link, disabled Favourite/Block/Report triad — see `src/features/profile-sections/ProfileScrollView.tsx:75`). Story 13.4 says the OtherProfileScreen is "pixel-identical to the 'other' viewer path already used in phase 12", so those chips WILL appear. For a friend that's fine. For a pending request (Qurat) it's semantically off — you're seeing their phone number before you've accepted the friend request. Two paths:
- Accept the leak as mock-only (they'll only see the phone number if they navigate into the request-view; the deck view stays gated).
- Add a boolean prop to `ProfileScrollView` (`contactVisible?: boolean`, defaults to `viewer === 'self' ? false : true`) so OtherProfileScreen can hide contact info when `source='request'`.

Recommend the prop path — small change, closes a real trust gap. If not, add explicit note in the phase teardown list.

### Non-blocking notes

**N1. Row-body-vs-buttons touch conflict in Explore Requests list.**
Story 13.5 AC: *"Row-body press (i.e. everything except the two buttons) → navigate"*. RN's default gesture propagation means Accept/Decline presses will bubble to a surrounding `TouchableArea` unless the row's tappable region is scoped to the left (thumbnail + text column) only, with the two Buttons rendered in a sibling `Row` outside the touchable. Straightforward but easy to get wrong. Suggest AC hint: *"TouchableArea wraps only the left (thumbnail + name/subtitle) column; the Accept/Decline buttons sit in a sibling Row outside the TouchableArea."*

**N2. In-memory `FriendshipProvider` — expected cold-start behavior.**
Story 13.2 chose in-memory only. QA implication: accept Qurat → cold-restart the emulator → Qurat's request comes back and Mehvish is the only friend again. Consistent with mock-only, but flag to the user so it doesn't get filed as a bug.

**N3. Fixture photo alternation looks repetitive.**
Story 13.1 alternates Female3/Female4 across 5 cards → Female3/Female4/Female3/Female4/Female3. All decks show at most two distinct hero images. Cosmetic; user already sanctioned this in Q2. Non-blocking.

**N4. Test symmetry gap in Story 13.4.**
AC lists an access-guard test for unknown userId with `source='friend'`. Add the symmetric case: *"unknown userId with `source='request'` → EmptyState"*.

**N5. `BackHeaderBar` vs inline header (Story 13.4).**
PRD leaves the choice to the implementer. Recommend a dedicated `BackHeaderBar` component under `src/features/profile/components/` — likely reused in phases 15 (Friend Requests standalone screen if any), 17 (Chat room), 18 (Blocks). Small upfront cost, easy consistency win.

**N6. Explore stack + tab-bar collapse.**
Sanity check: `CollapsingTabBar` in `AppTabs.tsx:169-170` only translates when `focusedRoute === 'Marriage'`. Explore now renders `ExploreStack` but the outer tab name is still `Explore`, so the collapse rule holds unchanged. No action needed.

### Drift check against phases 11–12

None of the phase-13 stories collide with, or are made stale by, changes shipped in phases 11–12:
- Phase 11's `OnboardingCompletionProvider` sits above `NavigationContainer`; Story 13.2 mounts `FriendshipProvider` "at the same level" — that's the same tier, no ordering issue (Friendship doesn't need Auth).
- Phase 12's `marriageTabBarHidden` shared value is module-scope and remains the writer/reader contract that Story 13.3 must preserve — confirmed above (S4).
- Phase 12's `MenuStack` navigation-type + inline-tab pattern is the template Story 13.5 explicitly mirrors — no drift.

### External assumptions worth naming

- `expo-secure-store` is NOT introduced in phase 13 (Q5's alternative was declined by Story 13.2's in-memory choice). No permissions or native module reinstall required. Merge = pure JS reload.
- No new native module dependencies overall. This phase can ship without a full APK reinstall on device 000323572000090.
- `lucide-react-native` icons are used throughout (already installed). PRD doesn't mention icons for the Explore sub-tabs or the BackHeader; developer should keep to lucide.

---

### Summary for the user

**Recommend addressing before proceeding:**
- B1 (Story 13.4 access-guard race on Accept).
- B2 (CandidateHero prop type — explicit cast note in Story 13.3).

**Recommend locking down at address time:**
- S1 (bell unread-dot: current-user vs candidate).
- S2 (Undo: pure UI, no FriendshipProvider write on Like — add explicit AC).
- S3 (CollapsingActionBar hides in exhausted state — pick one).
- S4 (reset `marriageTabBarHidden` on deck advance).
- S5 (ContactActionsSection visible on request view — accept or add `contactVisible` prop).

**Non-blocking (informational, or one-line AC hints):**
- N1 (Row + button touch scoping).
- N2 (In-memory cold-start reset — flag as expected).
- N4 (Test symmetry for unknown-userId + request).
- N5 (BackHeaderBar as a reusable component).

If the user chooses `proceed` without addressing B1–B2, the developer will hit them mid-implementation and either re-open the PRD or make the call themselves — cheaper to answer now.

## 2026-08-26 16:17 brainstorm (pass 2 — post-answers)

The PRD has been updated with the user's picks from brainstorm-1 (see `open_decisions_locked_by_user` Q7–Q14, and the corresponding ACs in Stories 13.2–13.5). This pass reviews the updated PRD for **new** gaps introduced by the edits, and for anything the first pass missed.

### New / freshly-exposed gaps

**NG1. How does the app resolve a `user_id` (from a pending request) to a `DummyFullProfile`?**

Story 13.2's Requests seed is `{ request_id, from_user_id, status, created_at }` — no full profile inline. But both Story 13.4 (OtherProfileScreen with `source='request'`) and Story 13.5 (Explore Requests-tab rendering Qurat's row) need to look up the *full* profile from a `from_user_id`. The PRD doesn't say where that lookup lives.

Options:
- (a) Add a `getFullProfile(userId): DummyFullProfile | undefined` method to `useFriendship()`. Internally FriendshipProvider holds a static registry `{ [mehvish_id]: mehvishJson, [qurat_id]: quratJson }` and returns from it. All request-related callers use this accessor. Clean, testable, single source of truth. **Recommend.**
- (b) Store the full profile inline on each pending-request record. Diverges from the eventual backend shape (a real `friend_requests` row won't carry the sender's whole profile).
- (c) Import the fixtures ad-hoc at every callsite. Duplicates the mapping, painful to change.

Action if accepted: add an AC to Story 13.2 for `getFullProfile()` on `useFriendship()`, and reference it in Stories 13.4 and 13.5.

**NG2. Decline flow timing — is it immediate `goBack()` or a 1500 ms delay like Accept?**

Story 13.4 says Accept fires the snackbar and waits 1500 ms before `goBack()`. For Decline, it says only: *"declineRequest → Snackbar → goBack()"* — no delay called out. Two coherent semantics:
- (a) Decline `goBack()`s immediately; the "Request declined" snackbar shows on the previous screen (Explore Requests). Simple. **Recommend.**
- (b) Decline mirrors Accept — 1500 ms delay so the toast is readable on the profile screen. Symmetrical. BUT: after `declineRequest()` runs, `receivedRequestFrom === false` AND `isFriend === false`, so the widened guard from B1 trips and paints the "Not authorized" EmptyState — same flicker bug we just fixed for Accept, back for Decline. Would need a separate "unmount-in-progress" ref to freeze the guard for Decline, which is exactly the useRef trick we rejected in B1.

Recommend option (a) explicitly in Story 13.4 AC so the developer doesn't invent (b) on the fly and reintroduce the flicker.

### Non-blocking notes on the updated PRD

**NN1. Bell-dot mirror test needs jest.mock strategy for `dummyprofile.json`.**

Story 13.3 tests: *"passing a modified `dummyprofile.__dummy_display_only.has_unread_notifications = true` propagates the dot regardless of deck-card values."* Since `dummyprofile` is a static JSON import (read at module scope), mutating it in a test won't work — jest module resolution will hand the same object to production code. The test must use `jest.mock('../../../../assets/dummyprofile.json', () => ({ ...actual, __dummy_display_only: { has_unread_notifications: true } }))` OR the AC should be reworded to "test that the HeaderBar receives the value from dummyprofile, not from the deck card." Minor test-writing hint, not a PRD gap.

**NN2. Verified: `dummyprofile.json` already contains `__dummy_display_only.has_unread_notifications: false`.**

Sanity check confirmed. No fixture change needed for Story 13.3's HeaderBar unread-dot AC.

**NN3. `receivedRequestFrom(userId)` is the guard's authorization signal, but its return semantic is not spelled out.**

Story 13.2 lists `receivedRequestFrom(userId)` as an exposed predicate but doesn't say what it returns. Implicit: `boolean` — true iff the current user has a pending request from `userId`. Explicit AC would be nicer but zero-cost drift.

### Everything else clean

- The B1 broadened guard (Story 13.4) reads correctly against the Accept flow.
- The B2 CandidateHero widening (Story 13.3) is coherent — `DummyFemaleProfile` structurally satisfies `CandidateHeroProfile` for the phase-12 caller, and `DummyDeckProfile` (from Story 13.1) is spec'd to include all the same fields.
- The S3 CollapsingActionBar hide (Story 13.3) is a simple conditional render; the test verifies its absence.
- The S4 `marriageTabBarHidden` reset (Story 13.3) is a single `useEffect` — no cross-story dependency.
- The S5 `contactVisible` prop (Story 13.4) is a straight extension of `ProfileScrollView` with a `true` default, so phase-12 callers keep working.
- Note 4 `BackHeaderBar` is a new reusable component — trivial to build, no dependency on anything not already shipped.
- Note 1 (requests-row touch scoping) is now spelled out with a sibling structure in Story 13.5 — no implementation ambiguity remains.
- No new fixture data required beyond what Stories 13.1 and 13.2 already spec.
- No new native modules → no APK reinstall required. Merge is a pure JS reload.

### Summary

**Recommend addressing before proceeding:**
- NG1 (`getFullProfile()` on FriendshipProvider — resolve user_id → DummyFullProfile).
- NG2 (Decline flow timing — pick immediate goBack).

Both are small, in-scope clarifications. If you proceed without them, the frontend developer will either invent one interpretation on the fly (likely fine but non-portable) or pause and ask.

