# Phase 2 brainstorm — Wizard shell + pages 1-4 (B1)

## 2026-07-22 brainstorm

Gap-analysis of `implementationplan/phase-2-wizard-shell-b1.md` against the phase-1 scaffold that shipped, against `architecture.md`, and against the shape of `aws-amplify` v6 that the phase-1 `cognitoClient` wrapper actually enforces.

### Gaps ranked by blocking severity

#### 1. BLOCKER — Cognito `signUp` password strategy is undefined (story 2.5)

- Story 2.5 says the screen calls `cognitoClient.signUp({ email })` and passes review with just an email.
- `architecture.md §11.2` row 2 also says `Cognito signUp({ email })` — so the architecture and PRD agree, but both are underspecified.
- Reality: `src/services/auth/cognitoClient.ts` (shipped in story 1.7) exposes `signUp(input: { username; password; email })`. `password` is required — aws-amplify v6's `amplifySignUp()` demands `{ username, password, options: { userAttributes: { email } } }`.
- Nothing in pages 1-4 collects a password. There is no password page anywhere in the 31-page onboarding.
- Three ways forward, pick before dispatching 2.5:
  - **(a) Client-generated random password.** Screen mints a cryptographically random password on signUp and stores it in `expo-secure-store` under a new key. Never surfaces to the user. User signs in later by re-entering email + one-time code (Cognito passwordless-style). Requires backend agreement that this is the intended shape (matches muzz-style flow).
  - **(b) Add a password field to page 2 or a new page 2b.** Requires updating architecture §11.2 and creating a new page in the 31-page count (which cascades everywhere).
  - **(c) Refactor `cognitoClient.signUp` to accept `{ email }` only** and internally derive a password — same as (a) but the concern is moved from screen into `services/`. Cleaner.
- Whichever option: (i) update story 2.5 acceptance criteria to specify the mechanism, (ii) update `cognitoClient.signUp` typed signature, (iii) add a follow-up story or note about how the user later signs in (relevant to `AuthStack.Login`).

#### 2. BLOCKER — Route-name mismatch between PRD and phase-1 scaffold (story 2.3)

- PRD story 2.3 says: "`OnboardingStack` mounts `Page01WelcomeScreen`, `Page02EmailScreen`, `Page03ConfirmCodeScreen`, `Page04GetStartedScreen`."
- Actual `src/navigation/OnboardingStack.tsx` registers routes named `Page01`, `Page02`, `Page03`, `Page04`, ..., `Page31`. Placeholder screens render `EmptyState`.
- Story 2.7 also references `Page05SexScreen` — same issue, actual route is `Page05`.
- Fix: pick one. Either (a) rename routes to include the semantic suffix (`Page01Welcome`, `Page02Email`, ...) and update all navigation calls / linking config, or (b) keep short route names (`Page01`) and let the component filenames carry the semantic suffix (`Page01WelcomeScreen.tsx` exported as the screen registered under route name `Page01`). Option (b) is less churn; recommend it and rewrite the story 2.3, 2.4, 2.5, 2.6, 2.7 AC to distinguish "route name" from "component filename".

#### 3. BLOCKER — `UserProfileWritable` type does not exist yet (story 2.2)

- Story 2.2 draft schema declares `fields: Partial<UserProfileWritable>`.
- `UserProfileWritable = Omit<UserProfile, 'age' | 'user_id' | ...>` per architecture §7.4.
- Neither `UserProfile` nor `UserProfileWritable` exists in the phase-1 codebase — `src/types/api/` was never created.
- Options: (a) create `src/types/api/UserProfile.ts` as a phase-2 sub-step (bump story 2.2 AC), (b) stub `UserProfileWritable = Record<string, unknown>` for now and revisit in phase 3 when the first real field lands (loses type safety on the draft), (c) generate types from the OpenAPI/schema — probably out of scope for phase 2.
- Recommend (a). Cost is one small file; the type shape is documented in architecture §7.4.

#### 4. BLOCKER — `src/Helper/` folder doesn't exist; `validationHelper.ts` + `errorHelper.ts` referenced but not scoped (stories 2.5, 2.6)

- Architecture §5 and §5-tree line 487 mandate `src/Helper/` (PascalCase, singular) for pure functions.
- Phase-1 shipped `services/api/errors.ts` (contains `ApiError` + `normalizeErrorResponse` + `toError`) but no `src/Helper/` folder and no `validationHelper.ts`.
- Story 2.5 AC references `Helper/validationHelper.ts → isValidEmail`; story 2.6 needs a 6-digit check that would live alongside.
- Story 2.5 AC also references `Helper/errorHelper.ts` for label-mapping the aws-amplify error into a `LabelKey`.
- Fix: add explicit AC to story 2.5 (or a dedicated sub-story 2.4a/2.4b) — "create `src/Helper/validationHelper.ts` with `isValidEmail(input: string): boolean` and `isSixDigitCode(input: string): boolean`" and "create `src/Helper/errorHelper.ts` with `cognitoErrorToLabelKey(err: unknown): LabelKey`". Add a `Helper/` folder-creation acceptance in the earliest story that needs it (2.5) and reference it from 2.6.

#### 5. BLOCKER — Label keys for phase-2 strings aren't enumerated (stories 2.4-2.7)

- `labels.en.json` and `labels.ur.json` currently hold only 7 keys (`common.*`, `auth.*.title`, `language.*`, `nav.tabs.*`).
- Story 2.4 requires: `Knotify` title, `Continue with email`, `Continue with Google`, `Language` sheet header, `English` / `Urdu` option labels.
- Story 2.5 requires: email placeholder, "Invalid email" error, "Sign up failed" / "Email already registered" / generic Cognito error labels.
- Story 2.6 requires: code placeholder, "Enter 6-digit code" hint, "Invalid code" / "Code expired" / generic error labels.
- Story 2.7 requires: "Get started" button label.
- Story 2.3 AC only says "every user-facing string is a `labels.<key>` reference and the labels-parity test still passes" — that's the outcome but doesn't tell the subagent *which* keys.
- Fix: append to each of stories 2.4-2.7 an explicit "Adds labels" list (with the exact key paths), so the subagent doesn't invent keys and the reviewer can verify parity mechanically.

#### 6. HIGH — Post-`confirmSignUp` auth state is unclear (story 2.6 → page 4 transition)

- After `Auth.confirmSignUp` in aws-amplify v6, the user is NOT signed in — Cognito requires a subsequent `signIn`.
- Once story 2.6 succeeds, the user reaches page 4 (`Get started`) with no session token in `expo-secure-store`.
- `AuthProvider` (shipped in 1.9) has `status: 'signedIn' | 'signedOut' | ...`. If unauthenticated, `RootNavigator` (per architecture §6.2) would swap to `AuthStack` — kicking the user *out of onboarding* the moment page 3 succeeds.
- Read the current `RootNavigator.tsx` and `AuthProvider.tsx` to confirm behavior. Likely one of these must be true:
  - (a) `OnboardingStack` is rendered whenever `status !== 'signedIn' || profileComplete === false` (so unauth users during signup still see it) — verify.
  - (b) Story 2.6 must call `cognitoClient.signIn({ email, password })` immediately after `confirmSignUp` succeeds (requires knowing the password → tie-in with gap #1's chosen strategy).
- Fix: (i) read `RootNavigator.tsx` to see how it gates today, (ii) if the gate throws unauth users into AuthStack, add explicit AC to story 2.6: "after `confirmSignUp` success, call `cognitoClient.signIn({ email, password })` with the stored password before navigating to page 4", (iii) if the gate already allows unauth-in-onboarding, add a note documenting the invariant.

#### 7. MEDIUM — `useOnboardingProgress` "route name → page number" mapping isn't defined (story 2.1 / 2.2)

- Story 2.1 says `WizardProgress` shows `current / total` with total = 31.
- Story 2.2 says `useOnboardingProgress()` returns `{ current, total, checkpoint }` derived from "the current route name and the draft".
- The route-name → number mapping is nowhere defined. Options: (a) a static object `{ Page01: 1, Page02: 2, ..., Page31: 31 }` in a shared const, (b) `parseInt(routeName.replace('Page', ''), 10)` regex-parse.
- (a) is safer (no accidental non-page routes counted). Fix: add AC to story 2.2 to define the map location (e.g., `src/features/onboarding/pageMap.ts`) and to fail loudly on unknown route names.

#### 8. MEDIUM — `useCheckpointResume` "post-8" / "post-14" wording is ambiguous (story 2.2)

- Story 2.2 AC: "returns the correct initial route on resume per §6.3 (secondCheckpoint -> post-14, firstCheckpoint -> post-8, else page 1 with pre-fill)".
- Is "post-8" = start at page 9, or = start at page 8 with checkpoint acknowledged? Architecture §11.2 row 8 marks page 8 as the checkpoint page itself; user having stored `lastCheckpoint = 'firstCheckpoint'` means they *finished* page 8. Resume should land them on page 9.
- Fix: change AC wording to use exact page numbers: "secondCheckpoint → route `Page15`; firstCheckpoint → route `Page09`; else `Page01`". Same numbering discipline used in gap #7's page-map.

#### 9. MEDIUM — First-time aws-amplify jest mocking pattern needs to be established (story 2.5)

- Story 2.5 AC: "aws-amplify Auth surface is mocked in tests via a jest module mock."
- No existing test in `__tests__/` mocks aws-amplify. Story 2.5 is the first. Two shapes to choose:
  - (a) `jest.mock('aws-amplify/auth', () => ({ signUp: jest.fn(), confirmSignUp: jest.fn(), ... }))` — mocks the transitive dep.
  - (b) `jest.mock('@/services/auth/cognitoClient', () => ({ signUp: jest.fn(), confirmSignUp: jest.fn(), ... }))` — mocks the wrapper, so tests never touch aws-amplify surface directly.
- (b) is cleaner and stays consistent with the phase-1 discipline of "no feature imports aws-amplify directly". Recommend (b) explicitly in story 2.5 AC and note that the pattern applies to all future Cognito-touching stories.

#### 10. MEDIUM — `LanguageProvider.setLocale` already surfaces the reload modal; story 2.4 must not double-wrap it

- Story 2.4 AC: "selecting one calls `LanguageProvider.setLocale`, which surfaces the RTL-reload modal per §17.26 when switching to/from `ur`".
- Verified: `src/state/i18n/LanguageProvider.tsx` (shipped in 1.9) already calls `Alert.alert()` + `forceRTL` + `reloadAsync` internally.
- Risk: subagent writes duplicate confirm-then-reload logic in the language sheet.
- Fix: tighten story 2.4 AC to "sheet calls `setLocale(next)` and immediately closes; the sheet MUST NOT render its own confirmation dialog — that lives in `LanguageProvider`. Test the sheet by asserting `setLocale` was called with the expected argument; do NOT assert the modal exists (LanguageProvider's own tests cover it)."

#### 11. LOW — Stale TODO in `BottomSheet.tsx` (story 1.9 already resolved it)

- `src/components/BottomSheet.tsx` still has the comment "TODO(app-root): Wire `GestureHandlerRootView` at App root" from story 1.6.
- Story 1.9 wired `GestureHandlerRootView` at `App.tsx` — the TODO is stale.
- Fix: add a small cleanup AC to story 2.4 (which is the first phase-2 consumer of BottomSheet): "remove the stale TODO comment in `src/components/BottomSheet.tsx`". Or handle it inline in the story 2.4 PR.

#### 12. LOW — Draft-store `schemaVersion` migration policy is undefined

- Draft schema has `schemaVersion: 1`. What happens when it bumps? Discard? Migrate? Prompt?
- Not blocking phase 2 (no bump yet), but should be documented as a TODO in `draftSchema.ts` so a future developer doesn't ship a silent breaking change.
- Fix: add a note-only AC to story 2.2: "leave a comment in `draftSchema.ts` noting the migration policy is deferred until schemaVersion bumps beyond 1."

#### 13. LOW — `muzzscreenshots/` folder referenced in architecture §11.2 doesn't exist in this repo

- Architecture §11.2 says reference screenshots live in `muzzscreenshots/`. Not present.
- Not blocking (visual can be verified against architecture text alone), but flag to user: is this folder available elsewhere? Would help the frontenddeveloper subagent visualize.

#### 14. INFO — `Continue with Google` no-op scope on page 1 is fine

- Story 2.4 correctly scopes Google button as "tappable, no-op" — matches architecture §11.2 row 1. No gap. Just confirming the intentional decision.

#### 15. INFO — Draft store is intentionally local; final PATCH is on page 31 (phase 11)

- Verified `architecture.md §7 / §11.2.4`. Story 2.2's decision to write only to `expo-secure-store` and never to backend is correct. No per-page PATCH.

### Cross-story dependencies to sanity-check

- Stories 2.4, 2.5, 2.7 all `depends_on: [2.3]`, meaning they can be dispatched in parallel *after* 2.3 ships. Per project rule, execution is serial — but the order among {2.4, 2.5, 2.7} is free. Recommend: **2.4 → 2.5 → 2.6 → 2.7**. Reason: (a) 2.4 exercises the wizard chrome first without touching Cognito, catches chrome bugs cheaply; (b) 2.5 → 2.6 is a natural pair (signUp → confirmSignUp share module mock, error labels, and the ambiguous auth-state gap #6 above); (c) 2.7 is trivial and lands last as a smoke check that navigation to `Page05` works.
- Story 2.2 (`depends_on: []`) is independent of chrome. Could ship in parallel with 2.1 if we were parallel — but serial ordering means the topological order is 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 → 2.7.

### External assumptions not yet validated

- **Password strategy** (gap #1) — requires user decision or backend confirmation. Cannot be resolved by the subagent alone.
- **Auth-gate behavior post-`confirmSignUp`** (gap #6) — needs a read of `RootNavigator.tsx` to confirm before story 2.6 is dispatched.
- **`muzzscreenshots/` availability** (gap #13) — user question, not codebase-answerable.
- **`UserProfileWritable` scope-in for phase 2** (gap #3) — user decision, though the recommendation is clear.


## 2026-07-23 brainstorm (targeted re-run against updated PRD)

Re-brainstorm after the 2026-07-22 findings were folded into the PRD via `QA/answers.txt`. Scope is narrow: what NEW gaps did the resolutions themselves introduce, or did they miss? Not re-litigating the 15 already-resolved items.

### New gaps introduced by the resolutions

#### A. HIGH — Story 2.2 uses `OnboardingRouteName` without defining it (chicken-and-egg with 2.3)

- Story 2.2 AC line for `pageMap.ts` says: `export PAGE_MAP: Readonly<Record<OnboardingRouteName, number>>` — but `OnboardingRouteName` is currently defined in `src/navigation/types.ts` as the keys of `OnboardingStackParamList`, and story 2.3 (which depends on 2.2) is what renames those keys.
- If 2.2 tries to import `OnboardingRouteName` from `src/navigation/types.ts`, it gets the OLD short names (`Page01`..`Page31`) — PAGE_MAP would type-check against the wrong union, or fail to type-check at all.
- FIX: Story 2.2 should DEFINE `OnboardingRouteName` locally in `pageMap.ts` as `type OnboardingRouteName = keyof typeof PAGE_MAP`, and story 2.3's `src/navigation/types.ts` update should IMPORT that type from `pageMap.ts` (making pageMap.ts the single source of truth for route names, matching its role as source of truth for page numbers). Add an AC to 2.2: "exports `type OnboardingRouteName = keyof typeof PAGE_MAP`". Add an AC to 2.3: "`OnboardingStackParamList` keys are typed against `OnboardingRouteName` imported from `pageMap.ts`, not string-literal duplicated."

#### B. HIGH — Story 2.3 does not wire `useCheckpointResume` into `OnboardingStack.initialRouteName`

- Story 2.2 builds `useCheckpointResume`, but nothing in story 2.3 mounts it. Current `OnboardingStack.tsx` has no dynamic `initialRouteName` — the stack always starts at whatever route is first-registered.
- Without wiring, checkpoint-resume is dead code: a user with `secondCheckpoint` set who kills the app and returns lands on page 1 instead of page 15.
- FIX: Add an AC to story 2.3: "`OnboardingStack` reads `useCheckpointResume()` at render and passes its return value as `<Stack.Navigator initialRouteName={...}>`. Add a wiring test that mocks `useCheckpointResume` to return each of the three possible values and asserts the stack mounts the corresponding screen first."

#### C. HIGH — Story 2.3 does not explicitly update `__tests__/navigation/OnboardingStack.test.tsx`

- Grep found existing test at `__tests__/navigation/OnboardingStack.test.tsx` references the OLD short route names (`Page01`..`Page31`). Renaming routes without updating this test breaks CI.
- Story 2.3 mentions updating `auth-gate.test.tsx` but not `OnboardingStack.test.tsx`.
- FIX: Add an AC to story 2.3: "`__tests__/navigation/OnboardingStack.test.tsx` is updated to reference the new semantic route names; the PAGE_MAP-equality test from story 2.3's first AC is added here or in a new test file."

#### D. MEDIUM — Story 2.5 does not gate navigation on successful secure-store write

- Story 2.5 acceptance criteria step 1 says "Persist the password to `expo-secure-store`" then step 3 says "Navigate to `Page03ConfirmCodeScreen`" — but nothing says what happens if the secure-store write throws (device out of space, keychain locked, corrupted state).
- Consequence: user reaches page 3, page 3 can't read the password, `bootstrapMissing` fires — but the Cognito user is already created. User is now in a broken state (account exists, no way to sign in without password reset).
- FIX: Add to story 2.5 AC: "The secure-store write is awaited BEFORE `cognitoClient.signUp` is called (so a keychain failure is caught before creating the Cognito user). If the write throws, render `onboarding.email.errors.secureStorageUnavailable` and do NOT call signUp. Add a label for it." Also add the label to the enumeration.

#### E. MEDIUM — Story 2.5 does not specify OS password-manager hints

- Password field on page 2 should trigger iOS/Android password-manager save prompts (so users don't lose the password they just picked). Requires `textContentType='newPassword'` (iOS), `autoComplete='password-new'` (Android), and matching `textContentType='emailAddress'` / `autoComplete='email'` on the email field.
- Missing from AC — easy to overlook, hard to add after the fact (users will already have signed up without saved passwords).
- FIX: Add to story 2.5 AC: "Email `TextInput` sets `textContentType='emailAddress'` and `autoComplete='email'`. Password `TextInput` sets `textContentType='newPassword'` and `autoComplete='password-new'` so OS password managers offer to save the new credential."

#### F. MEDIUM — Story 2.6 does not require the Continue button to disable during the confirmSignUp → signIn chain

- Story 2.6 chains `confirmSignUp` → read secure-store → `signIn` → delete secure-store → navigate. That's ~1-3 seconds of network. Double-tap during that window would trigger two `confirmSignUp` calls, the second failing with a code-already-used error, causing a confusing UX.
- FIX: Add to story 2.6 AC: "During the confirmSignUp+signIn chain, `WizardFooter` Continue button renders with `loading={true} disabled={true}`. The button re-enables only on error (not on success — success navigates away)."

### Verdict

All 6 findings are small tweaks to individual story AC — no architecture changes, no new stories, no dependency-graph churn. Recommend addressing inline before dispatch (would take ~5 minutes of PRD editing); alternatively they can be surfaced to the subagent as adjustments during dispatch, but AC-in-PRD is cleaner for auditability.


## 2026-07-23 verification pass (post-fix)

Verified all 6 fixes from the 2026-07-23 brainstorm landed in `implementationplan/phase-2-wizard-shell-b1.md`:

- **A** (`OnboardingRouteName` in pageMap.ts) → story 2.2 AC line for `pageMap.ts` now includes the local `type OnboardingRouteName = keyof typeof PAGE_MAP` export.
- **B** (checkpoint-resume wiring) → story 2.3 has a new AC line for `<Stack.Navigator initialRouteName={...}>` + wiring test.
- **C** (OnboardingStack.test.tsx rename) → story 2.3 has a new AC line explicitly updating the existing test file.
- **D** (secure-store write ordering) → story 2.5 On-Continue flow rewritten in strict order (write-first, signUp-second); adds `secureStorageUnavailable` label; test AC updated to assert call ordering.
- **E** (password-manager hints) → story 2.5 email/password inputs now list `textContentType` and `autoComplete` explicitly.
- **F** (double-tap protection) → story 2.6 adds loading/disabled AC + test coverage.

No new blocking gaps introduced by the fixes. Proceeding to Step 1 (GitHub issue creation).
