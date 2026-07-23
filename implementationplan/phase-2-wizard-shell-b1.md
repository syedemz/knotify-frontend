phase: 2
title: Wizard shell + pages 1-4 (B1)
last_updated: 2026-07-23 (story 2.5 complete)

context_summary: |
  Phase 2 delivers the onboarding wizard's structural spine (wizard chrome components, draft persistence, checkpoint hooks, page-number mapping) plus the first four pages: welcome (p1, with language toggle sheet), email + password (p2, Cognito signUp), confirm code (p3, Cognito confirmSignUp + auto-signIn), and get-started (p4). After this phase a user can create a Cognito account and reach page 4 authenticated; phases 3-11 (B2-B10) fill the remaining 27 pages page-by-page.

  Resolutions from the 2026-07-22 gap-analysis brainstorm (`phasebrainstorms/phase-2-wizard-shell-b1-brainstorm.md`) applied inline:

  - **Password strategy (Blocker 1):** page 2 renders BOTH email and password inputs. The user picks a real password that satisfies Cognito's policy (min 12, upper + lower + digit + symbol). This diverges from the earlier "email-only signup UX" wording in `architecture.md §11.2` row 2 — that row should be updated by the user out-of-band. The backend accepts this without change (Cognito app client is SRP-only per `knotify-backend/infrastructure/modules/cognito/app_clients.tf`; the post-confirmation Lambda ignores every attribute except email).
  - **Route names (Blocker 2):** phase-1's short route names (`Page01`, `Page02`, ..., `Page31`) are renamed in story 2.3 to their semantic equivalents (`Page01WelcomeScreen`, `Page02EmailScreen`, ..., `Page31FaceCaptureScreen` — see story 2.3 for the full 31-name list). Screen filenames match. This is a phase-1 fix that surfaces here.
  - **`UserProfileWritable` type (Blocker 3):** story 2.2 also creates `src/types/api/UserProfile.ts` and derives `UserProfileWritable` per architecture §7.4.
  - **`src/Helper/` folder (Blocker 4):** story 2.5 creates `src/Helper/validationHelper.ts` and `src/Helper/errorHelper.ts` per architecture §5.
  - **Label enumeration (Blocker 5):** stories 2.4-2.7 each list the exact `labels.*` keys they add, in both `labels.en.json` and `labels.ur.json`.
  - **Auth-gate for unauth-during-signup (High 6):** the current `RootNavigator.tsx` (shipped in story 1.9) renders `AuthStack` whenever `status === 'unauthenticated'`, with no branch for "unauth but signing up". Story 2.3 updates `RootNavigator` to render `OnboardingStack` when `status === 'unauthenticated' || (status === 'authenticated' && !profileComplete)`. Story 2.6 then auto-signs the user in immediately after `confirmSignUp` succeeds (using the password captured on page 2 from secure-store), so page 4 renders while `status === 'authenticated' && !profileComplete === true`.
  - **`pageMap.ts` (Medium 7):** story 2.2 creates `src/features/onboarding/pageMap.ts` — the single source of truth for route-name → page-number.
  - **Checkpoint resume wording (Medium 8):** exact route names — `firstCheckpoint` (set on advance from page 8) → resume at `Page09ReligionSubsectScreen`; `secondCheckpoint` (set on advance from page 14) → resume at `Page15ResidenceCountryScreen`; no checkpoint → `Page01WelcomeScreen`. These names are the source of truth used by pageMap.ts.
  - **Jest mocking pattern (Medium 9):** stories 2.5 and 2.6 mock `@/services/auth/cognitoClient` (the wrapper), NOT `aws-amplify/auth` directly. Sets the convention for all future Cognito-touching stories.
  - **LanguageProvider double-wrap (Medium 10):** story 2.4 language sheet just calls `setLocale(next)` and closes; it MUST NOT render its own confirmation dialog.
  - **Stale BottomSheet TODO (Low 11):** story 2.4 deletes the stale TODO in `src/components/BottomSheet.tsx`.
  - **schemaVersion migration comment (Low 12):** story 2.2 leaves a comment in `draftSchema.ts` documenting that migration policy is deferred until schemaVersion bumps beyond 1.
  - **Reference screenshots (Low 13):** `muzzscreenshots/` is now in the repo (added 2026-07-23). Stories 2.4, 2.5, 2.6, 2.7 reference `muzzscreenshots/1.jpeg`, `2.jpeg`, `3.jpeg`, `4.jpeg` respectively.

  Resolutions from the 2026-07-23 re-run brainstorm (`phasebrainstorms/phase-2-wizard-shell-b1-brainstorm.md`, second section) applied inline:

  - **`OnboardingRouteName` chicken-and-egg (A):** story 2.2 now defines `type OnboardingRouteName = keyof typeof PAGE_MAP` locally in `pageMap.ts`; story 2.3's `src/navigation/types.ts` imports the type from there rather than duplicating the string literals.
  - **`useCheckpointResume` wiring (B):** story 2.3 now explicitly wires `useCheckpointResume()` into `<Stack.Navigator initialRouteName={...}>` with a corresponding wiring test.
  - **`OnboardingStack.test.tsx` rename (C):** story 2.3 now explicitly updates the existing test file to reference the new semantic route names and adds a PAGE_MAP-equality guard.
  - **Secure-store write ordering (D):** story 2.5 now writes the bootstrap password to secure-store BEFORE calling `cognitoClient.signUp` (so keychain failure never leaves the user with a Cognito account they can't sign into). Adds `onboarding.email.errors.secureStorageUnavailable` label.
  - **OS password-manager hints (E):** story 2.5 now specifies `textContentType='newPassword'` / `autoComplete='password-new'` on the password field and `textContentType='emailAddress'` / `autoComplete='email'` on the email field.
  - **Double-tap protection (F):** story 2.6 now disables the Continue button (`loading`/`disabled`) during the confirmSignUp+signIn chain.

  Serial dispatch order per non-negotiable rule: 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 → 2.7.

stories:
  - id: 2.1
    title: Wizard chrome components (WizardHeader, WizardProgress, WizardFooter)
    agent: frontenddeveloper
    done: true
    depends_on: []
    tracking_issue: 74
    acceptance_criteria:
      - `WizardHeader`, `WizardProgress`, `WizardFooter` exist under `src/components/` with theme-token props per architecture §2a.3 (no `style` prop, no raw numeric values — configurable appearance is `SpacingKey`/`RadiusKey`/`TextColor`/`BgColor` unions).
      - `WizardProgress` renders a `current / total` progress bar where `total` is `31` (constant, sourced from a named export in `src/features/onboarding/pageMap.ts` — see story 2.2 — so a future bump of the page count changes exactly one file).
      - `WizardHeader` renders back navigation (calls `navigation.goBack()`) and hides the progress bar when `hideProgress` is `true`. Used by pages 1-4 per architecture §6.3.
      - `WizardFooter` renders a Next/Continue button supporting `disabled` and `loading` states plus an optional Back button.
      - Every user-facing string in these three components is a `labels.<key>` reference. Adds labels: `wizard.header.back = "Back"`, `wizard.footer.continue = "Continue"`, `wizard.footer.back = "Back"` (with Urdu parity in `labels.ur.json`).
      - Each component has `__tests__/components/<Name>.test.tsx` covering all variants and both themes; each is re-exported from `src/components/index.ts`.
      - `tsc --noEmit` passes with zero errors; `npx jest --coverage` keeps coverage above the thresholds set in `jest.config.js`.
    notes: ""

  - id: 2.2
    title: Onboarding draft store (draftSchema, useOnboardingDraft, checkpoints, pageMap, progress + checkpoint-resume hooks)
    agent: frontenddeveloper
    done: true
    depends_on: []
    tracking_issue: 75
    acceptance_criteria:
      - Creates `src/types/api/UserProfile.ts` with `UserProfile` (all DB-exposed fields per architecture §7.4) and `UserProfileWritable = Omit<UserProfile, 'age' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at' | 'profile_complete_verified'>`. Includes a JSDoc note that `preference_vector` MUST NOT appear in `UserProfile` (stripped by backend per architecture §7.4).
      - `src/features/onboarding/draftSchema.ts` defines the `OnboardingDraft` type per architecture §11.2.4: `schemaVersion: 1`, `lastCheckpoint: 'firstCheckpoint' | 'secondCheckpoint' | null`, `currentPage: number`, `fields: Partial<UserProfileWritable>`, `siblings: SiblingDraft[]` (SiblingDraft defined here as `{ name: string; age: number | null; maritalStatus: string | null }` scaffold), `photoPreviewUris: string[]`, `notificationPermissionStatus: 'granted' | 'denied' | 'undetermined' | null`, `locationPermissionStatus: 'granted' | 'denied' | 'undetermined' | null`, `timestamps: { createdAt: string; updatedAt: string }`. File-level comment documents: "Migration policy for schemaVersion bumps is deferred; the current schema is version 1 and no bump handler exists yet. When bumping, decide before merge whether to migrate, discard, or prompt."
      - `src/features/onboarding/checkpoints.ts` exports `firstCheckpoint` and `secondCheckpoint` as named string-literal constants that match the `lastCheckpoint` union in `draftSchema.ts`.
      - `src/features/onboarding/pageMap.ts` exports `PAGE_MAP: Readonly<Record<OnboardingRouteName, number>>` mapping every one of the 31 semantic route names to its 1..31 position, `TOTAL_PAGES = 31`, and `type OnboardingRouteName = keyof typeof PAGE_MAP` (defined LOCALLY in `pageMap.ts` — this makes `pageMap.ts` the single source of truth for both route names AND page numbers; story 2.3's `src/navigation/types.ts` will import `OnboardingRouteName` from here rather than string-literal-duplicating the names). The full 31-name list — derived from architecture.md §11.2 rows 1-31 — is: `Page01WelcomeScreen`, `Page02EmailScreen`, `Page03ConfirmCodeScreen`, `Page04GetStartedScreen`, `Page05SexScreen`, `Page06NameScreen`, `Page07BirthdayScreen`, `Page08FirstCheckpointScreen`, `Page09ReligionSubsectScreen`, `Page10ProfessionalCategoryScreen`, `Page11WorkDetailsScreen`, `Page12EducationLevelScreen`, `Page13EducationCredentialsScreen`, `Page14SecondCheckpointScreen`, `Page15ResidenceCountryScreen`, `Page16ResidenceCityScreen`, `Page17FamilyResidenceScreen`, `Page18ParentsScreen`, `Page19SiblingsScreen`, `Page20MarriageTimelineScreen`, `Page21OwnReligiousLevelScreen`, `Page22PartnersReligiousLevelScreen`, `Page23MaritalStatusScreen`, `Page24MoveAbroadScreen`, `Page25Preferences1Screen`, `Page26Preferences2Screen`, `Page27RelationScreen`, `Page28PhotosScreen`, `Page29PhoneScreen`, `Page30FaceVerifyIntroScreen`, `Page31FaceCaptureScreen`. Both `PAGE_MAP` and `TOTAL_PAGES` are the single source of truth (consumed by `useOnboardingProgress` here and by `WizardProgress` in story 2.1).
      - `src/features/onboarding/hooks/useOnboardingDraft.ts` reads/writes the draft under the `onboardingDraft` key in `expo-secure-store`, debounces writes by 200 ms (a single trailing-edge write per debounce window), and exposes `update(partial)`, `advance(nextPage)`, `reset()`, `getDraft()`.
      - `src/features/onboarding/hooks/useOnboardingProgress.ts` derives `{ current, total, checkpoint }` from the current route name via `PAGE_MAP`. Throws a clear error (`throw new Error('useOnboardingProgress: unknown route "<name>"')`) on any route not in the map — never returns silent fallback numbers.
      - `src/features/onboarding/hooks/useCheckpointResume.ts` returns the correct initial route on resume per architecture §6.3, using exact route names: `secondCheckpoint` (set after page 14) → `Page15ResidenceCountryScreen`; `firstCheckpoint` (set after page 8) → `Page09ReligionSubsectScreen`; else `Page01WelcomeScreen`.
      - Checkpoint never regresses: on back-navigation the draft's `lastCheckpoint` is never overwritten with `null` or a lower checkpoint. Covered by unit test.
      - Unit tests cover: debounced write behavior (trailing-edge, 200 ms), checkpoint non-regression on back navigation, resume routing for each of the three checkpoint states, `useOnboardingProgress` throw on unknown route, and `PAGE_MAP` completeness (every entry maps to a unique number 1..31).
      - `tsc --noEmit` passes; coverage remains above `jest.config.js` thresholds.
    notes: ""

  - id: 2.3
    title: Rename OnboardingStack routes to semantic names, update RootNavigator auth-gate for unauth-during-signup, wire pages 1-4 with wizard chrome
    agent: frontenddeveloper
    done: true
    depends_on: [2.1, 2.2]
    tracking_issue: 76
    acceptance_criteria:
      - `src/navigation/OnboardingStack.tsx` renames every one of its 31 routes from short names (`Page01`, `Page02`, …) to the exact 31 semantic names defined by `PAGE_MAP` in `src/features/onboarding/pageMap.ts` (from story 2.2). The list, in order: `Page01WelcomeScreen`, `Page02EmailScreen`, `Page03ConfirmCodeScreen`, `Page04GetStartedScreen`, `Page05SexScreen`, `Page06NameScreen`, `Page07BirthdayScreen`, `Page08FirstCheckpointScreen`, `Page09ReligionSubsectScreen`, `Page10ProfessionalCategoryScreen`, `Page11WorkDetailsScreen`, `Page12EducationLevelScreen`, `Page13EducationCredentialsScreen`, `Page14SecondCheckpointScreen`, `Page15ResidenceCountryScreen`, `Page16ResidenceCityScreen`, `Page17FamilyResidenceScreen`, `Page18ParentsScreen`, `Page19SiblingsScreen`, `Page20MarriageTimelineScreen`, `Page21OwnReligiousLevelScreen`, `Page22PartnersReligiousLevelScreen`, `Page23MaritalStatusScreen`, `Page24MoveAbroadScreen`, `Page25Preferences1Screen`, `Page26Preferences2Screen`, `Page27RelationScreen`, `Page28PhotosScreen`, `Page29PhoneScreen`, `Page30FaceVerifyIntroScreen`, `Page31FaceCaptureScreen`. If any placeholder-screen filename differs from its new route name, rename the file to match. The list here MUST match `PAGE_MAP` exactly — enforce with a unit test that iterates the stack's registered routes and asserts equality with `Object.keys(PAGE_MAP)`.
      - `src/navigation/types.ts` `OnboardingStackParamList` keys are typed against `OnboardingRouteName` imported from `src/features/onboarding/pageMap.ts` (defined in story 2.2) — not string-literal duplicated. This guarantees `types.ts` and `pageMap.ts` cannot drift.
      - `OnboardingStack.tsx` reads `useCheckpointResume()` (from story 2.2) at render and passes its return value as `<Stack.Navigator initialRouteName={...}>`. Without this wiring, the checkpoint-resume hook is dead code. A wiring test mocks `useCheckpointResume` to return each of the three possible values (`Page01WelcomeScreen`, `Page09ReligionSubsectScreen`, `Page15ResidenceCountryScreen`) and asserts the stack mounts the corresponding screen first.
      - `__tests__/navigation/OnboardingStack.test.tsx` is updated to reference the new semantic route names (currently references `Page01`..`Page31` short names — will otherwise break CI on rename). Add a test in this file (or a sibling) that iterates the stack's registered routes and asserts the set equals `Object.keys(PAGE_MAP)` — this is the PAGE_MAP-equality guard referenced in the first AC.
      - `src/navigation/linking.ts` is updated so any pre-existing route references stay consistent (empty config today, so this is a no-op verification — but call it out in the PR description).
      - `src/navigation/RootNavigator.tsx` is updated: `OnboardingStack` renders when `status === 'unauthenticated'` OR `(status === 'authenticated' && !profileComplete)`. `AuthStack` renders only when a returning user explicitly opts to sign in (out-of-scope for phase 2 — for now `AuthStack` is unreachable from the auth-gate itself; it stays in the tree so the existing tests pass, but the gate no longer routes to it). Update JSDoc comment on `RootNavigator` to reflect the new mapping; remove the previous `unauthenticated → AuthStack` branch comment.
      - `__tests__/navigation/auth-gate.test.tsx` is updated: assert that `status === 'unauthenticated'` renders `OnboardingStack` (not `AuthStack`); keep the existing `authenticated && !profileComplete → OnboardingStack` and `authenticated && profileComplete → AppTabs` assertions. Do NOT delete the `AuthStack` render test — leave it as a placeholder that renders `AuthStack` directly, since the stack is still exported and other future flows may mount it.
      - `OnboardingStack.tsx` mounts real concrete screen components (`Page01WelcomeScreen`, `Page02EmailScreen`, `Page03ConfirmCodeScreen`, `Page04GetStartedScreen`) as placeholder files created in this story (each screen just renders `Screen` + `WizardHeader hideProgress` + a `Text` placeholder — the real page content lands in stories 2.4-2.7). The remaining 27 screens stay as their existing placeholder shape but with renamed filenames matching the new route names.
      - Pages 1-4 use `<WizardHeader hideProgress />` (progress bar is hidden per architecture §6.3).
      - Native-stack back gesture and hardware back button navigate one page backwards on Android; native swipe-back works on iOS (per phase-1 skeleton).
      - Every user-facing string on pages 1-4 (in this story's placeholder implementations) is a `labels.<key>` reference; the labels-parity test still passes after this phase's key additions.
      - `tsc --noEmit` passes; navigation tests all pass; `PAGE_MAP` consumers (from story 2.2) work with the new names.
    notes: ""

  - id: 2.4
    title: Page 1 — Welcome screen with language toggle sheet
    agent: frontenddeveloper
    done: true
    depends_on: [2.3]
    tracking_issue: 77
    acceptance_criteria:
      - Reference: `muzzscreenshots/1.jpeg`.
      - `src/features/onboarding/screens/Page01WelcomeScreen.tsx` renders `images.onboarding.background` (full-screen bg), `images.onboarding.logo` (centered), the title "Knotify" (no tagline), and two buttons stacked vertically labeled "Continue with email" and "Continue with Google" — all from the labels registry.
      - Top-left globe icon (`Icon` catalog component with the `globe` lucide icon) opens a `BottomSheet` (catalog component) titled "Language" that lists two rows: "English" and "Urdu". Tapping a row calls `useLanguage().setLocale('en' | 'ur')` and closes the sheet. The sheet MUST NOT render its own confirmation dialog — `LanguageProvider.setLocale()` already shows the RTL-reload `Alert.alert` per architecture §17.26.
      - Tapping "Continue with email" navigates to `Page02EmailScreen`.
      - Tapping "Continue with Google" is a no-op — the button is visible and tappable but does not navigate, throw, or produce any side effect (intentional per architecture §11.2 row 1; will be wired in a future feature).
      - Adds labels (with Urdu parity in `labels.ur.json`):
          - `onboarding.welcome.title = "Knotify"`
          - `onboarding.welcome.continueEmail = "Continue with email"`
          - `onboarding.welcome.continueGoogle = "Continue with Google"`
          - `onboarding.language.sheetTitle = "Language"`
          - `onboarding.language.optionEnglish = "English"`
          - `onboarding.language.optionUrdu = "Urdu"`
      - Cleanup: deletes the stale `TODO(app-root): Wire GestureHandlerRootView at App root` comment in `src/components/BottomSheet.tsx` (already wired in `App.tsx` by story 1.9).
      - Screen wiring test asserts: correct label rendering under both `en` and `ur` locales; tapping "English" and "Urdu" each dispatches `setLocale` with the correct arg; the sheet does NOT render its own `Alert`/confirmation UI (assert the RTL-reload flow is delegated to `LanguageProvider` — do NOT mount `LanguageProvider` under test; use a jest mock of `useLanguage`); tapping "Continue with email" invokes `navigation.navigate('Page02EmailScreen')`; tapping "Continue with Google" does not invoke navigation or any external side effect.
      - `tsc --noEmit` passes; coverage remains above `jest.config.js` thresholds; labels-parity test passes.
    notes: ""

  - id: 2.5
    title: Page 2 — Email + password input + Cognito signUp (creates Helper/ folder)
    agent: frontenddeveloper
    done: true
    depends_on: [2.3]
    tracking_issue: 78
    acceptance_criteria:
      - Reference: `muzzscreenshots/2.jpeg`.
      - Creates `src/Helper/` folder (does not exist yet — architecture §5 mandates PascalCase singular `Helper/`).
      - Creates `src/Helper/validationHelper.ts` exporting three pure functions with TSDoc:
          - `isValidEmail(input: string): boolean` — RFC-5322-shape check (a pragmatic regex; document the trade-off in TSDoc).
          - `isSixDigitCode(input: string): boolean` — exactly six ASCII digits, no whitespace (used by story 2.6).
          - `passwordMeetsCognitoPolicy(input: string): { ok: boolean; missing: readonly ('length' | 'upper' | 'lower' | 'digit' | 'symbol')[] }` — checks Cognito's policy per `knotify-backend/infrastructure/modules/cognito/main.tf` (min length 12, at least one uppercase, one lowercase, one digit, one symbol). Returns which requirements are unmet so the UI can render precise error labels.
      - Creates `src/Helper/errorHelper.ts` exporting `cognitoErrorToLabelKey(err: unknown): LabelKey` — maps known aws-amplify Auth error names (`UsernameExistsException`, `InvalidPasswordException`, `CodeMismatchException`, `ExpiredCodeException`, `LimitExceededException`, `NotAuthorizedException`, network errors) to `LabelKey` values from `labels.en.json`. Unknown errors map to a generic key. TSDoc lists every mapping.
      - `src/features/onboarding/screens/Page02EmailScreen.tsx` renders a catalog `Screen` with `WizardHeader hideProgress`, two catalog `FormField`+`TextInput` rows (email + password) plus a `WizardFooter` Continue button.
        - Email `TextInput`: `keyboardType='email-address'`, `autoCapitalize='none'`, `autoCorrect={false}`, `returnKeyType='next'`, `textContentType='emailAddress'`, `autoComplete='email'`.
        - Password `TextInput`: use the catalog `PasswordInput` (from story 1.5) with `autoCapitalize='none'`, `autoCorrect={false}`, `returnKeyType='done'`, `textContentType='newPassword'`, `autoComplete='password-new'`. These OS hints trigger iOS/Android password-manager save prompts so users don't lose the password they just picked; hard to add after the fact once users have signed up without saved credentials.
      - Continue is disabled until `isValidEmail(email) === true` AND `passwordMeetsCognitoPolicy(password).ok === true`. Inline error hints appear beneath each field when the user has typed something invalid (do not show errors on empty untouched fields).
      - On Continue, in this exact order:
        1. Write the password to `expo-secure-store` under the key `SecureStorageKey.OnboardingBootstrapPassword` (add this enum member to `src/services/auth/secureStorage.ts`) and `await` the result. **This must succeed BEFORE `cognitoClient.signUp` is called** — if the keychain is unavailable and we create the Cognito user anyway, page 3 can't sign the user in (broken state: account exists, no password captured, no way forward without password reset). On write failure, render `onboarding.email.errors.secureStorageUnavailable` and do NOT call signUp.
        2. Call `cognitoClient.signUp({ email, password })`.
        3. On signUp success: persist the email into the onboarding draft (`useOnboardingDraft().update({ fields: { email } })`), then navigate to `Page03ConfirmCodeScreen`.
        4. On signUp failure: delete the bootstrap password from secure-store (best-effort — ignore failure), then render an inline error via `cognitoErrorToLabelKey(err)`. Do NOT block the retry.
      - The `aws-amplify` Auth surface is mocked in tests via **`jest.mock('@/services/auth/cognitoClient', () => ({ ... }))`** — mocking the wrapper, NOT `aws-amplify/auth` directly. This is the pattern for all future Cognito-touching stories. Include a one-line comment in the test file: `// Convention: mock the cognitoClient wrapper, not aws-amplify/auth (established in story 2.5).`
      - `src/services/api/mocks/handlers.ts` remains unchanged (Cognito is not REST — MSW is not the mock layer for it).
      - Adds labels (with Urdu parity):
          - `onboarding.email.emailLabel = "Email"`
          - `onboarding.email.emailPlaceholder = "you@example.com"`
          - `onboarding.email.passwordLabel = "Password"`
          - `onboarding.email.passwordPlaceholder = "At least 12 characters"`
          - `onboarding.email.errors.invalidEmail = "Please enter a valid email address."`
          - `onboarding.email.errors.passwordTooShort = "Password must be at least 12 characters."`
          - `onboarding.email.errors.passwordMissingUpper = "Password must include an uppercase letter."`
          - `onboarding.email.errors.passwordMissingLower = "Password must include a lowercase letter."`
          - `onboarding.email.errors.passwordMissingNumber = "Password must include a number."`
          - `onboarding.email.errors.passwordMissingSymbol = "Password must include a symbol."`
          - `onboarding.email.errors.usernameExists = "An account with this email already exists."`
          - `onboarding.email.errors.invalidPassword = "Password doesn't meet requirements."`
          - `onboarding.email.errors.network = "We couldn't reach the server. Please try again."`
          - `onboarding.email.errors.secureStorageUnavailable = "We couldn't securely save your password on this device. Please try again or restart the app."`
          - `onboarding.email.errors.generic = "Something went wrong. Please try again."`
      - Unit tests for `validationHelper.ts` (`__tests__/helpers/validationHelper.test.ts`) cover: RFC-5322 accepts common good inputs and rejects common bad ones; six-digit check accepts exactly "123456" and rejects short/long/whitespace/non-digit; password policy returns `{ok:true, missing:[]}` for a compliant string and correctly enumerates missing requirements for defective ones.
      - Unit tests for `errorHelper.ts` cover: every documented aws-amplify error name maps to the expected `LabelKey`; unknown errors map to the generic key; the function handles non-Error inputs without throwing.
      - Screen wiring test (`__tests__/features/onboarding/Page02EmailScreen.test.tsx`) covers: Continue disabled until BOTH email and password valid; on tap, secure-store write is awaited BEFORE `cognitoClient.signUp` is called (assert call order via mock invocation order); success path navigates to `Page03ConfirmCodeScreen`; secure-store write failure renders `secureStorageUnavailable` and does NOT call `signUp`; `UsernameExistsException` renders the corresponding inline error label without navigating; signUp failure best-effort-deletes the bootstrap password from secure-store; generic error path renders the generic label.
      - `tsc --noEmit` passes; coverage remains above `jest.config.js` thresholds; labels-parity test passes.
    notes: |
      Password storage note: the bootstrap password is written to secure-store ONLY so page 3 can auto-signIn after confirmSignUp. Page 3 (story 2.6) MUST delete the key from secure-store immediately after signIn succeeds. If the user drops off between pages 2 and 3, the key persists — accept this trade-off for phase 2. A future story (deferred) will scrub the key on app-launch resume when `lastCheckpoint === null` and `currentPage <= 3`.

      Also: `architecture.md §11.2` row 2 currently reads `Cognito signUp({ email })` — that wording no longer matches phase-2's implementation. The user should update architecture.md §11.2 row 2 to note the password field. Not blocking dispatch of this story; the PRD is the source of truth for phase-2 execution.

  - id: 2.6
    title: Page 3 — Confirm email code + Cognito confirmSignUp + auto-signIn
    agent: frontenddeveloper
    done: false
    depends_on: [2.5]
    tracking_issue: 79
    acceptance_criteria:
      - Reference: `muzzscreenshots/3.jpeg`.
      - `src/features/onboarding/screens/Page03ConfirmCodeScreen.tsx` renders a `Screen` + `WizardHeader hideProgress` + catalog `TextInput` (6-digit code) + `WizardFooter` Continue button.
        - Code `TextInput`: `keyboardType='number-pad'`, `maxLength=6`, `autoCapitalize='none'`, `autoCorrect={false}`, `returnKeyType='done'`. Displays the email being verified above the input (read from `useOnboardingDraft().getDraft().fields.email`).
      - Continue is enabled only when `isSixDigitCode(code) === true` (helper from story 2.5) AND no request is in flight.
      - While the `confirmSignUp` → read-secure-store → `signIn` → delete-secure-store chain is in flight (~1-3s of network), `WizardFooter` Continue renders with `loading={true} disabled={true}`. This prevents double-tap from firing a second `confirmSignUp` (which would fail with a code-already-used error). The button re-enables only on error (success navigates away).
      - No countdown timer is rendered (per architecture §11.2.1 row 3).
      - On Continue:
        1. Call `cognitoClient.confirmSignUp({ email, code })`. On success:
        2. Read the bootstrap password from `expo-secure-store` (`SecureStorageKey.OnboardingBootstrapPassword` — set in story 2.5). If missing, treat as a recoverable failure — render `onboarding.confirmCode.errors.bootstrapMissing` with a hint to restart from page 1.
        3. Call `cognitoClient.signIn({ email, password })` to establish an authenticated session. On success:
        4. Delete the bootstrap password from secure-store (`await secureStorage.remove(SecureStorageKey.OnboardingBootstrapPassword)`).
        5. Navigate to `Page04GetStartedScreen`. `RootNavigator` (updated in story 2.3) will keep the user in `OnboardingStack` because `profileComplete === false`.
      - Failure paths (each renders an inline error via `cognitoErrorToLabelKey`, does NOT navigate):
          - `CodeMismatchException` → `onboarding.confirmCode.errors.invalidCode`.
          - `ExpiredCodeException` → `onboarding.confirmCode.errors.codeExpired` (future story will add a "resend code" affordance — out of scope for phase 2).
          - `LimitExceededException` → `onboarding.confirmCode.errors.limitExceeded`.
          - Any signIn error post-successful-confirm → `onboarding.confirmCode.errors.signInAfterConfirm` (rare; user may need to restart).
          - Any other error → generic key.
      - Uses the same jest mock convention as story 2.5: `jest.mock('@/services/auth/cognitoClient', ...)`.
      - Adds labels (with Urdu parity):
          - `onboarding.confirmCode.title = "Enter the code"`
          - `onboarding.confirmCode.subtitle = "We sent a 6-digit code to {email}"` (interpolation format; escape braces if the labels resolver from story 1.3 does not support interpolation — in that case use two labels or a runtime replacement)
          - `onboarding.confirmCode.codePlaceholder = "123456"`
          - `onboarding.confirmCode.errors.invalidCode = "That code isn't right. Try again."`
          - `onboarding.confirmCode.errors.codeExpired = "Your code has expired."`
          - `onboarding.confirmCode.errors.limitExceeded = "Too many attempts. Please wait a moment and try again."`
          - `onboarding.confirmCode.errors.signInAfterConfirm = "We verified your email but couldn't sign you in. Please restart signup."`
          - `onboarding.confirmCode.errors.bootstrapMissing = "We lost track of your signup. Please restart from the beginning."`
          - `onboarding.confirmCode.errors.generic = "Something went wrong. Please try again."`
      - Screen wiring test (`__tests__/features/onboarding/Page03ConfirmCodeScreen.test.tsx`) covers: Continue disabled below 6 digits; Continue is `disabled` and `loading` while the confirmSignUp+signIn chain is in flight (assert with a promise held pending by the mock); on tap, `cognitoClient.confirmSignUp` is called with the correct `{ email, code }`; success path calls `cognitoClient.signIn` with the stored password, then deletes the bootstrap password from secure-store, then navigates to `Page04GetStartedScreen`; `CodeMismatchException` renders the invalid-code label, does not navigate, and re-enables the button; missing bootstrap password renders the `bootstrapMissing` label.
      - `tsc --noEmit` passes; coverage remains above `jest.config.js` thresholds; labels-parity test passes.
    notes: ""

  - id: 2.7
    title: Page 4 — Get started
    agent: frontenddeveloper
    done: false
    depends_on: [2.3]
    tracking_issue: 80
    acceptance_criteria:
      - Reference: `muzzscreenshots/4.jpeg`.
      - `src/features/onboarding/screens/Page04GetStartedScreen.tsx` renders `Screen` + `WizardHeader hideProgress` + `images.onboarding.banner` (centrally aligned via catalog `Image`) + a `WizardFooter` Continue button labeled "Get started" (always enabled).
      - On tap the screen navigates to `Page05SexScreen` (route registered by phase 1 and renamed in story 2.3). No checkpoint is advanced (the first checkpoint is page 9, delivered in phase 3).
      - Adds labels (with Urdu parity):
          - `onboarding.getStarted.button = "Get started"`
      - Screen wiring test covers banner + button rendering and tap navigation to `Page05SexScreen`.
      - `tsc --noEmit` passes; coverage remains above `jest.config.js` thresholds; labels-parity test passes.
    notes: ""
