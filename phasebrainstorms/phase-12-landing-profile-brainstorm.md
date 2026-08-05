# Phase 12 brainstorm — Landing page + profile page + profile edit shell

## 2026-08-04 12:00 brainstorm

Targeted audit of `implementationplan/phase-12-landing-profile.md` against the
5 /implement-phase criteria: (a) missing/non-testable AC, (b) scope smuggled
from siblings or future phases, (c) wrong depends_on, (d) drift since the PRD
was written, (e) unvalidated external dependencies. Codebase state was probed
before writing.

---

### 1. Blocker — `siblings` is NOT a field of `UserProfile`

**Where**: story 12.1 (fixtures require `siblings` populated with 2 entries and
`siblings: []` respectively) and story 12.2 (`SiblingsSection` reads
`siblings[]`, harness asserts `siblings.length`).

**Reality**: `src/types/api/UserProfile.ts` has NO `siblings` key. The DB
`users` row does not carry siblings — the onboarding wizard writes them into
a **draft** (`SiblingDraft` in `src/features/onboarding/draftSchema.ts`), and
the phase-11 PATCH-builder submits them separately from the users table via
mock-only handlers.

**Consequence**: as written, `dummyfemale.json.siblings.length === 2` /
`dummyprofile.json.siblings === []` fixtures are not valid overlays of
`UserProfileWritable` — they add a field that doesn't exist in the API type.
The type declarations in story 12.1 (`DummyFemaleProfile`, `DummyOwnProfile`)
only extend `UserProfile` with `photos`, `faceSelfieUri`, and
`__dummy_display_only`. `siblings?: SiblingDraft[]` (or a new fixture-local
`Sibling` shape) is missing from the extension.

**Fix**: story 12.1 must add `siblings?: SiblingDraft[]` (or a
fixture-local equivalent shape) to both `DummyFemaleProfile` and
`DummyOwnProfile`. The parse-time test in 12.1 needs to import the shape.
Story 12.1 AC line "both fixtures satisfy every non-nullable field in
`UserProfileWritable`" should be softened to "satisfy every non-nullable
field of `UserProfileWritable` and additionally carry `siblings`, `photos`,
`faceSelfieUri`, and the two `__dummy_*` namespaces".

---

### 2. Blocker — `__mocks__/react-native-reanimated` does NOT exist

**Where**: story 12.4 acceptance line "Animation is NOT tested (Reanimated
worklets are mocked to no-op per the existing `__mocks__/react-native-reanimated`
setup)".

**Reality**: `__mocks__/` contains only `react-native-vision-camera.ts`,
`react-native-vision-camera-face-detector.ts`, and
`react-native-worklets-core.ts`. There is NO `react-native-reanimated` mock.

**Consequence**: any test that mounts `MarriageLandingScreen` will hit real
Reanimated worklet code and either crash under Jest (worklets require the
babel plugin at runtime) or produce noisy errors. The claim "animation is not
tested" is fine, but the underlying mock has to actually be there.

**Fix**: story 12.4 must include adding the standard Reanimated Jest mock as
part of the story: `jest.mock('react-native-reanimated', () =>
require('react-native-reanimated/mock'))` in `jest.setup.ts` (or a
`__mocks__/react-native-reanimated.ts` shim). Add an AC line for the mock.

---

### 3. Blocker — no `showSnackbar()` imperative helper exists

**Where**: stories 12.4 (four round buttons `onPress` calls
`showSnackbar(t('landing.actionUnavailable'))`) and 12.4 test (c) (asserts
"the `showSnackbar` mock").

**Reality**: `src/components/Snackbar.tsx` is a state-driven React component
(`<Snackbar visible ... onDismiss ... />`). All existing callers
(Page25PersonalityTraitsScreen, Page30FaceIntroScreen) use local `useState`
+ conditional render. No imperative `showSnackbar(...)` helper, no
`SnackbarProvider` context is present in the codebase.

**Consequence**: implementing 12.4 as written requires either (a) introducing
a Snackbar provider + imperative `showSnackbar` API from scratch — which is a
new cross-cutting concern that belongs in its own story, not smuggled inside
a landing-screen story — or (b) using the local-state pattern used elsewhere
(useState + `<Snackbar visible={snackbar} ...>` on the screen).

**Fix**: rewrite the 12.4 AC to use the existing local-state Snackbar
pattern: MarriageLandingScreen holds a `snackbar: string | null` state, each
action button setter opens it, `<Snackbar>` renders when non-null. Update
test (c) to assert the toast text appears (via `queryByText(
t('landing.actionUnavailable'))`) instead of asserting on an imperative mock.
Alternative: split "introduce global Snackbar provider" into its own story
(likely belongs in a UX-plumbing phase, not this one).

---

### 4. Scope confusion — `CandidateHero` duplicates `HeroBlock`

**Where**: story 12.4 defines `components/CandidateHero.tsx` as "full-bleed
hero image (first photo), the two overlay bubbles ('Active today' / 'Gold'
— guarded), and the name / age / green-tick / city-and-country / country-flag
/ profession chip strip beneath. Delegates to `HeroBlock` in the section
catalog for the actual chip strip." Meanwhile story 12.2's `HeroBlock` reads
the same fields (photo, name, age, chips, dummy overlay bubbles) with the
`'other'` variant handling the exact same landing layout.

**Reality**: `MarriageLandingScreen` uses `<ProfileScrollView
profile={dummyfemale} viewer="other" />` which already renders `HeroBlock` at
the top of the scroll. If `MarriageLandingScreen` ALSO renders
`<CandidateHero>` separately, the hero renders twice. If it doesn't,
`CandidateHero.tsx` is dead code.

**Fix**: DELETE `components/CandidateHero.tsx` from story 12.4 AC. The
landing screen composes `<HeaderBar />` + `<ProfileScrollView
viewer="other">` + `<CollapsingActionBar />`. HeroBlock handles the hero in
both viewer variants. Story 12.4 is thinner and less redundant.

---

### 5. Under-specified — `dummyprofile.json` name/email/handle literals

**Where**: story 12.5 test (a) asserts
`dummyprofile.first_name + " " + last_name` visible on `MenuHomeScreen`, and
the story prose says the row shows "Adnan Malik" — but story 12.1 nowhere
pins `first_name: "Adnan"`, `last_name: "Malik"`. Same problem for
`dummyfemale.json`'s hero name and age.

**Fix**: story 12.1 must pin concrete literal values for at least the
identity fields that appear in 12.5 / 12.4 assertions:
`dummyfemale.first_name`, `dummyfemale.age`, `dummyfemale.job_title`,
`dummyfemale.current_residence_city`, `dummyfemale.current_residence_country`,
`dummyprofile.first_name`, `dummyprofile.last_name`, `dummyprofile.age`,
`dummyprofile.current_residence_city`, `dummyprofile.current_residence_country`,
`dummyprofile.job_title`. Reference the Muzz screenshots in `QA/` if needed
for the female fixture. Without literal pins, 12.5 test (a) and the 12.4
hero-rendering test become underspecified.

---

### 6. Missing test coverage — `AppTabs.test.tsx` also references old labels

**Where**: story 12.6 AC line "Auth-gate wiring test at
`__tests__/navigation/RootNavigator.authGate.test.tsx` (or whatever
equivalent exists) is updated so its positive-identify assertion looks for
`nav.tabs.marriage` instead of `nav.tabs.discover`."

**Reality**: two test files reference `nav.tabs.discover`, not just
auth-gate: `__tests__/navigation/AppTabs.test.tsx:127-128` and
`__tests__/navigation/auth-gate.test.tsx:248,272,275,287,290-291,319,348`.

**Fix**: story 12.6 already has the catch-all "Any existing test that
references `AppTabsParamList` members ... is updated in-place" — but the
called-out test name is wrong. Rename to
`__tests__/navigation/auth-gate.test.tsx` explicitly, and add
`__tests__/navigation/AppTabs.test.tsx` to the AC as another required
update. Otherwise the grep-verify AC ("Grep confirms zero remaining
references after the rename") will fail if the subagent focuses only on the
one named file.

---

### 7. Under-specified — `preferences.personalityTraits` shape not typed

**Where**: story 12.1 (fixtures carry `preferences.personalityTraits`
populated with 5 / 1 entries) and story 12.2 `PersonalitySection` reads
`preferences.personalityTraits[]`.

**Reality**: `UserProfile.preferences` is `Record<string, unknown> | null`
in `src/types/api/UserProfile.ts`. The existing Page25 screen already casts:
`(savedPreferences as { personalityTraits: string[] }).personalityTraits`.
The dummy types in story 12.1 don't narrow `preferences` — reading
`profile.preferences?.personalityTraits` will hit `unknown` and require a
cast every time inside PersonalitySection.

**Fix**: story 12.1's `DummyFemaleProfile` / `DummyOwnProfile` types should
narrow `preferences` to `{ personalityTraits?: string[] } &
Record<string, unknown>` (or a more explicit `DummyPreferences` shape) so
PersonalitySection doesn't need internal casts. Small typing addition, no
behavioral change.

---

### 8. Under-specified — `CollapsingActionBar` row 2 semantics vs. `AppTabs`

**Where**: story 12.4 defines `CollapsingActionBar` row 2 as "the bottom
tab bar navigation. Both rows use colors matching the reference screenshot.
Only row 2 collapses on scroll."

**Reality**: the bottom tab bar is owned by React Navigation's
`createBottomTabNavigator` in `src/navigation/AppTabs.tsx` (story 12.6
renames it). Rendering "the bottom tab bar navigation" as row 2 of an
in-screen overlay would either duplicate the tab bar (two tab bars stacked)
or require intercepting React Navigation's tab bar via a custom
`tabBar` prop, which is a bigger touch and belongs to 12.6.

**Fix**: clarify the intent. Two viable interpretations:
- (a) `CollapsingActionBar` is JUST the four round action buttons (X /
  undo / star / ✓). The tab-bar collapse is achieved via
  `Tab.Navigator screenOptions={{ tabBarStyle: <animated> }}` in the
  `Marriage` tab's `screenOptions` — which is a 12.6 concern, not 12.4.
- (b) MarriageLandingScreen hides the native tab bar
  (`Tab.Screen options={{ tabBarStyle: { display: 'none' } }}`) and renders
  its OWN tab-bar-lookalike as row 2. This is heavier and gives more
  control but is a stylistic choice that should be explicit.

Pick one, spell it out. My recommendation: (a) — leave the native
`AppTabs` tab bar in place, animate it via `tabBarStyle` in the Marriage
tab options; `CollapsingActionBar` reduces to the row-1 action buttons only.

---

### 9. Minor — story 12.5 introduces `ProfileThumbnailCircle` when `Avatar` exists

**Where**: story 12.5 adds
`components/ProfileThumbnailCircle.tsx` — "reusable round avatar with
optional small edit-pencil dot in the corner".

**Reality**: `src/components/Avatar.tsx` already exists (index.ts:109). The
"edit-pencil dot" is the new capability. Reuse: `Avatar` prop expansion or
compose `Avatar` inside `ProfileThumbnailCircle` — either is fine but the
story shouldn't spec a whole new avatar primitive from scratch.

**Fix**: reword to "New wrapper `components/ProfileThumbnailCircle.tsx` that
composes `<Avatar />` and layers an optional edit-pencil dot overlay".
Cosmetic; not a blocker.

---

### 10. Minor — 12.5 wording: "no-op that navigates"

**Where**: story 12.5 says "Edit pill — Edit press is a no-op that
navigates to `MyProfileScreen` (Edit tab)".

**Reality**: a press that navigates is not a no-op. The intended meaning is
"the Edit tab itself is a no-op (renders `EmptyState`), but the Edit pill
DOES navigate to it". Reword for clarity to avoid a subagent misreading it
as "do nothing on press".

**Fix**: "Edit pill — press navigates to `MyProfileScreen` with
`{ initialTab: 'edit' }`; the Edit tab itself renders a `Coming soon`
`EmptyState` and does not mutate profile state."

---

### depends_on validity (survey)

- 12.1 → `[]` — OK, first story.
- 12.2 → `[12.1]` — OK, needs the types + fixtures.
- 12.3 → `[]` — OK, pure helper + button, no upstream. Reasonable given
  12.5 depends on it.
- 12.4 → `[12.2]` — OK. Does NOT depend on 12.3 (landing screen doesn't use
  ShareProfileButton). Correct.
- 12.5 → `[12.2, 12.3]` — OK. Preview tab uses ProfileScrollView (from 12.2)
  and Share buttons (from 12.3).
- 12.6 → `[12.4, 12.5]` — OK. Nav rename can't ship until the screens exist.

No unnecessary or missing edges detected.

---

### External dependency check (drift audit)

- **`assets/female/Female3.png`, `Female4.png`, `assets/male/Male1.png`**:
  present. ✓
- **`resolveJsonModule` in `tsconfig.json`**: NOT set. Story 12.1's "confirm
  this is set; if missing, add it" handles this correctly.
- **`react-native-reanimated`**: installed (already used elsewhere per PRD).
  Not verified in this audit but the PRD says "already installed" — trusting
  that. Real gap is the Jest mock (see finding #2), not the runtime dep.
- **`@expo/vector-icons`**: heavily used across the codebase already.
  Icon-name assumptions (Ionicons/options-outline, Ionicons/notifications-outline,
  MaterialCommunityIcons/ring, Ionicons/heart-outline, Ionicons/chatbubble-outline,
  Ionicons/menu) are all standard and available in the current Ionicons /
  MaterialCommunityIcons sets.
- **`Share` from `react-native`**: React Native core API, always available.
  No install step.
- **`EmptyState` component**: exists at `src/components/EmptyState.tsx`. ✓
- **Existing labels `nav.tabs.chat`, `nav.tabs.menu`**: story 12.6 says these
  "already exist and are reused" — verified via grep. ✓

---

### Summary — what to fix before proceeding

**Blockers (must address before Step 1)**:
1. Story 12.1: add `siblings?` to both dummy types and pin literal values
   for identity fields used by later stories' assertions.
2. Story 12.4: replace the imperative `showSnackbar()` with local-state
   Snackbar wiring, OR split "add Snackbar provider" into a separate story.
3. Story 12.4: add the Reanimated Jest mock as an explicit AC (either
   `jest.setup.ts` line or `__mocks__/react-native-reanimated.ts` shim).
4. Story 12.4: delete `CandidateHero.tsx` from the AC — HeroBlock inside
   `ProfileScrollView` handles the landing hero.
5. Story 12.4: clarify `CollapsingActionBar` row-2 intent (recommend option
   (a): animate the native tab bar, not overlay a custom one).

**Sharpen (nice to do but non-blocking)**:
6. Story 12.6: add `AppTabs.test.tsx` alongside `auth-gate.test.tsx` in the
   update list.
7. Story 12.1: narrow `preferences.personalityTraits` in the dummy types.
8. Story 12.5: reword `ProfileThumbnailCircle` to compose `Avatar` instead
   of inventing a new primitive.
9. Story 12.5: reword "Edit press is a no-op that navigates" to avoid a
   contradictory reading.

**Verdict**: 5 real blockers. Recommend `address` — flip `ready: false`,
edit the PRD, then re-run `/implement-phase 12`. If you `proceed` anyway,
stories 12.1, 12.4, and 12.6 will produce work that has to be reworked
(the siblings-type gap and the missing Reanimated mock will both surface
during test runs; the imperative `showSnackbar` will surface at
implementation time; `CandidateHero` will produce dead / duplicated hero
markup that needs a cleanup PR).

## 2026-08-04 14:20 brainstorm — re-audit of amended PRD

Targeted re-audit of `implementationplan/phase-12-landing-profile.md` after
the amendments. Same 5 /implement-phase criteria. Codebase probed with
`grep` before writing.

---

### Resolution of prior blockers + sharpens

- **Blocker 1 — `siblings` type gap.** RESOLVED. PRD 12.1 now defines a
  new exported `DummySibling` shape (`{ name, age, marital_status,
  gender, profession }`, all nullable) and adds `siblings?: DummySibling[]`
  to both `DummyFemaleProfile` and `DummyOwnProfile`. TSDoc note on the
  field documents the future backend `siblings` table. Chose to
  intentionally diverge from the existing onboarding `SiblingDraft` shape
  — client-fixture-only, replaced when the backend ships. Coherent.
- **Blocker 2 — Reanimated Jest mock.** RESOLVED. PRD 12.4 has an
  explicit AC line requiring `jest.setup.ts` be created (currently
  missing — verified) with
  `jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'))`
  and registered in `jest.config.js`. Jest preset is `jest-expo`; the
  subagent will need to add `setupFilesAfterEach: ['./jest.setup.ts']`
  (or `setupFiles`, depending on whether the mock runs before or after
  jest-expo's own setup) — the PRD says "setupFilesAfterEach or the
  preset's equivalent hook", which is close enough to the right
  configuration key that no rewording is required.
- **Blocker 3 — `showSnackbar()` imperative helper.** RESOLVED. PRD 12.4
  now uses the local-state pattern already in Page25/Page30 —
  `MarriageLandingScreen` holds `[snackbarMsg, setSnackbarMsg]` and
  renders `<Snackbar visible={snackbarMsg !== null} message={snackbarMsg
  ?? ""} onDismiss={...} />`. Verified `src/components/Snackbar.tsx`
  exposes `{ visible, message, onDismiss }` — API match. Test AC (c)
  correctly asserts via `getByText`, not a mock spy.
- **Blocker 4 — `CandidateHero` vs. `HeroBlock` duplication.** RESOLVED,
  though with a different resolution than the prior brainstorm
  recommended. Instead of deleting `CandidateHero.tsx`, PRD 12.2 pins
  `HeroBlock` to return `null` for `viewer === 'other'`, and PRD 12.4
  gives `CandidateHero` sole ownership of the landing hero (including
  the two dummy overlay bubbles that self-preview does not render).
  This is coherent — each hero variant has one owner — and matches the
  brainstorm's Muzz-screenshot analysis. Guard-behavior integration
  test (12.2 line 279-290) explicitly asserts `HeroBlock` is NOT in the
  tree for `viewer === 'other'`.
- **Blocker 5 — `CollapsingActionBar` row-2 semantics.** RESOLVED via
  option (a). PRD 12.4 now reduces `CollapsingActionBar` to ONLY the
  four round action buttons; the native React Navigation tab bar
  collapses via a module-scope shared value
  (`marriageTabBarHidden`) published by `MarriageLandingScreen` and
  consumed by `AppTabs`'s Marriage-tab `tabBarStyle`. Explicit
  minimum-delta threshold (8px) to avoid twitchy hides. Cleanly bounded
  — no custom tab-bar reimpl.
- **Sharpen 6 — `AppTabs.test.tsx` also references old labels.**
  RESOLVED. PRD 12.6 explicitly enumerates both `AppTabs.test.tsx`
  (line 127-128) AND `auth-gate.test.tsx` (lines 248, 272, 275, 287,
  290-291, 319, 348) as required updates, plus the catch-all grep-must-
  be-zero AC. See NEW finding 1 below re: one un-enumerated line.
- **Sharpen 7 — narrow `preferences.personalityTraits`.** RESOLVED. PRD
  12.1 now narrows to `preferences?: ({ personalityTraits?: string[] } &
  Record<string, unknown>) | null`. PersonalitySection reads without a
  cast.
- **Sharpen 8 — reuse `Avatar` primitive.** RESOLVED. PRD 12.5 now
  reads "COMPOSES the existing `<Avatar />` primitive
  (`src/components/Avatar.tsx`) and layers an optional small
  edit-pencil dot overlay". No reinvention.
- **Sharpen 9 — Edit pill wording.** RESOLVED. PRD 12.5 now reads
  "the Edit pill's press navigates to `MyProfileScreen` with
  `{ initialTab: 'edit' }` (the Edit TAB itself renders an
  `EmptyState` "Coming soon" and does not mutate profile state; the
  pill is not itself a no-op, the destination tab is)". Unambiguous.

---

### New findings

**Sharpen 1 — one un-enumerated `nav.tabs.discover` reference at
`auth-gate.test.tsx:387`.** PRD 12.6 lists lines 248, 272, 275, 287,
290-291, 319, 348 — grep confirms there is a 9th occurrence at line
387. The catch-all "grep for `nav.tabs.discover` must return zero
hits" AC will catch it, but the enumerated list is stale by one line.
Non-blocking — the subagent will find it via the grep gate. Worth a
one-line PRD tweak for accuracy.

**Sharpen 2 — Menu tab icon image-load-fallback pattern is implicit.**
PRD 12.6 says the Menu tab icon is `dummyprofile.photos[0]` cropped to
a 24×24 circle "falls back to `Ionicons/menu` if the image is
unloadable". This requires an `<Image>` `onError` handler tracked in
state, then a conditional swap to the icon. Doable but the PRD is
implicit about the mechanism (useState + onError, or an Image
primitive that swaps internally). Non-blocking — the subagent can
choose the pattern. A brief AC note ("track load-failure in local
state; on failure render the fallback icon in place of the image")
would remove ambiguity.

**Sharpen 3 — `resolveJsonModule` is required by story 12.1 but also
affects story 12.4 (which imports `dummyfemale.json`) and 12.5 (which
imports `dummyprofile.json`).** The `depends_on` chain already makes
this correct — 12.4 depends on 12.2 which depends on 12.1, and 12.5
depends on 12.2 + 12.3 (12.3 has no depends but doesn't import JSON),
so `resolveJsonModule` will be set before any JSON import runs. No
change needed. Flagging for the subagent chain of custody.

**Sharpen 4 — no functional wiring test for the tab-bar collapse
shared value.** PRD 12.4 correctly notes "Animation is NOT tested
(Reanimated worklets are mocked to no-op)". Consequence: the shared
value / tabBarStyle plumbing is un-tested. This is acceptable for a
UI polish story — visual QA happens on-device. Not a blocker; just
explicit note that no test exists for the collapse behavior itself,
only for the screen's static composition.

**Sharpen 5 — story 12.4 mentions two overlay bubbles on
CandidateHero ("Active today" / "Gold"), each guarded on the
matching `__dummy_display_only` key. PRD 12.1 pins
`is_active_today: true` and `membership_tier: "gold"` in
`dummyfemale.__dummy_display_only`, so the female hero WILL render
both bubbles.** PRD 12.1 does NOT set these keys on
`dummyprofile.__dummy_display_only` (the same block is described as
"same shape" but the specific values are only pinned for the female
fixture). This is intentional — self-preview hero is via HeroBlock,
which per PRD 12.2 line 218 does NOT render the Active-today / Gold
bubbles at all in `viewer === 'self'`. Coherent; just wanted to
confirm no drift.

---

### External dependency re-check

- `jest.setup.ts`: MISSING (as expected — PRD 12.4 creates it). ✓
- `jest.config.js`: EXISTS, uses `preset: "jest-expo"`. ✓
- `__mocks__/react-native-reanimated`: MISSING (as expected — PRD 12.4
  adds via `jest.mock` in `jest.setup.ts`, not a `__mocks__/` shim). ✓
- `src/components/Snackbar.tsx`: EXISTS, exposes
  `{ visible, message, onDismiss }`. ✓
- `src/components/Avatar.tsx`: EXISTS. ✓
- `src/components/EmptyState.tsx`: EXISTS. ✓
- `assets/female/Female3.png`, `Female4.png`, `assets/male/Male1.png`:
  ALL EXIST. ✓
- `src/features/onboarding/draftSchema.ts` (host of `SiblingDraft`):
  EXISTS. PRD intentionally diverges from `SiblingDraft` — see
  Blocker 1 resolution above. ✓
- `resolveJsonModule` in `tsconfig.json`: NOT SET (as expected — PRD
  12.1 adds it). ✓

---

### depends_on re-survey

Unchanged from the 2026-08-04 12:00 brainstorm. All edges correct:
12.1 → []; 12.2 → [12.1]; 12.3 → []; 12.4 → [12.2]; 12.5 → [12.2, 12.3];
12.6 → [12.4, 12.5]. Topological order for serial execution:
12.1 → 12.3 → 12.2 → 12.4 → 12.5 → 12.6 (12.3 can go before or after
12.2; both order permutations are valid).

---

### Verdict

All 5 prior blockers and all 4 prior sharpens are resolved in the PRD
text. 5 new findings are all **sharpens** (non-blocking).

**Recommend `proceed`.** The 5 new sharpens are either:
- caught by an existing catch-all AC (sharpen 1 grep gate),
- an implementation choice the subagent can safely make on its own
  (sharpens 2 & 3), or
- an intentional testing-scope decision (sharpens 4 & 5).

None will produce work that has to be reworked.

## 2026-08-05 audit — drift patch after post-QA polish

Post-implementation drift audit. Phase was marked `done: true` on 2026-08-04
after story 12.6 shipped, but a subsequent QA pass
(`QA/uimess.txt` — "looks nothing like Muzz") triggered a UI polish rework
that changed several section shapes. The PRD text was not updated at the
time. This entry records the reconciliation.

### Findings

**Drift 1 — MarriageIntentionsSection reshape (BREAKING).**
Shipped `MarriageIntentionsSection.tsx` now renders a Muzz-style intent
timeline (Match anchor + tick marks + stage chips Chatting/Family/Marriage +
four anchor labels ending in `marriage_time`). PRD 12.2 line 226 still
described the old two-anchor rail `Match! ─── <relation> (<marriage_time>)`.
The `relation` field is no longer rendered.
`__tests__/features/profile-sections/MarriageIntentionsSection.test.tsx`
still asserted `/Myself.*Within 2 years/` — a broken test on a phase marked
done.

**Drift 2 — Education / ProfessionalCareer / Address reshaped to bubble
grids.** Shipped implementations replaced the labelled row stacks with
flex-wrapping pill-chip grids (uppercase field labels dropped, values written
directly into the chip). Chip testIDs switched from `-row` to `-chip`. Test
files were updated in place at the time; PRD text was not. Non-breaking, but
the AC text was factually wrong about the layout.

**Drift 3 — ParentsSection reshaped to mirror SiblingsSection.** Shipped
`ParentsSection.tsx` uses the same two-tone card-and-chip layout as
`SiblingsSection` (grey `bg.chip` cards, white `bg.surface` chips inside).
PRD 12.2 line 250 described a generic "father block / mother block" without
capturing the card-and-chip shape or the two-tone contrast rule.

**Drift 4 — new `bg.chip` semantic token in theme.** Added to
`src/theme/theme.ts` during the polish pass. Not captured in any AC. The
convention (chips darker on white section bg, white inside grey cards) also
wasn't documented anywhere in the PRD.

### Resolution

1. Rewrote `MarriageIntentionsSection.test.tsx` to assert the shipped
   timeline shape: Match! + stage chips + Let's chat + Agree together +
   `marriage_time` in `intent-marriage-label`. Dropped the stale
   `Myself.*Within 2 years` assertion.
2. Amended PRD 12.2 section catalog entries (3), (8), (9), (10), (11), (12)
   to describe the shipped bubble/timeline/card-and-chip layouts, including
   the new chip testIDs.
3. Added a **Two-tone chip contrast rule** block to the phase
   `context_summary` documenting the `bg.chip` token and the chips-on-white
   vs. chips-in-card convention.
4. Bumped PRD `last_updated` to `2026-08-05`.

### Verdict

PRD text is now aligned with shipped code. Test suite is unblocked. Ready
to tag `phase-12-complete` once the fix commit lands and CI is green.

