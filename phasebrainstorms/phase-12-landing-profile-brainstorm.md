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
