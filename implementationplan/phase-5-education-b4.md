phase: 5
title: Education + second checkpoint (B4, pages 12-14)
last_updated: 2026-07-24

context_summary: |
  Phase 5 captures education level (page 12), the dynamic education credentials form driven by page 12's selection (page 13), and the second checkpoint that also collects notification + location permissions (page 14). Introduces the education branch matrix from architecture.md §11.2.3 and the centralized permissions surface from §11.2.5.

  Post-brainstorm decisions (2026-07-24, all confirmed by user in QA/explanations.txt):
  - `expo-location` is not yet installed; story 5.3 installs it and adds native config with the copy "Knotify uses your approximate location to show you compatible matches nearby".
  - `src/services/push/expoPush.ts` already has a private `requestNotificationPermission` — story 5.3 extracts it into `src/services/permissions/index.ts` (single source of truth) and re-imports from `expoPush.ts`.
  - Draft fields `notificationPermissionStatus` / `locationPermissionStatus` are top-level on `OnboardingDraft` (camelCase, siblings of `fields`); story 5.3 adds top-level setters `setNotificationPermissionStatus` / `setLocationPermissionStatus` on `useOnboardingDraft` modeled on `setSiblings`.
  - Text fields on page 13 allow apostrophe (`'`) to accept real school names ("St. Mary's High School"), matching phase-4's story-4.3 character-rule widening.
  - Per-field inline validation errors are required on page 13, matching the Page 02 / Page 11 pattern.

stories:
  - id: 5.1
    title: Page 12 - Education level (drives page 13's branch)
    agent: frontenddeveloper
    done: true
    depends_on: []
    tracking_issue: 25
    acceptance_criteria:
      - "`Page12EducationLevelScreen` reads `options.educationLevel` (5 entries) from `@/config/options` and renders them via `ListRowSelectable` (matches the page-9 religion picker pattern). Assert the list length via `options.educationLevel.length`, not a hardcoded 5."
      - "Tapping a row writes `education_level` to the draft via `useOnboardingDraft().update({ education_level })` and auto-advances to `Page13EducationCredentialsScreen` via `advance(13)` + `navigation.navigate('Page13EducationCredentialsScreen')`."
      - "Re-tapping the currently-selected row is a no-op (matches story-4.1 religion re-tap behavior)."
      - "Back-navigation from page 13 to page 12 works — no navigator errors, the previous `education_level` selection is still shown as selected. (Downgrade reconciliation is story 5.2's concern.)"
      - "Screen wiring test covers auto-advance on tap, `education_level` written to draft, list length equals `options.educationLevel.length`, and re-tap no-op."
      - "Label keys with English copy enumerated (Urdu equivalents required for parity — implementer writes idiomatic Urdu, CI enforces key parity): `onboarding.education.title` → \"What's your highest level of education?\"."
    notes: ""

  - id: 5.2
    title: Page 13 - Dynamic education credentials form
    agent: frontenddeveloper
    done: true
    depends_on: [5.1]
    tracking_issue: 26
    acceptance_criteria:
      - "`Page13EducationCredentialsScreen` renders the fields for the selected `education_level` per the branch matrix in architecture.md §11.2.3. Hidden branches are set to their default sentinels (`\"Not Applicable\"` for text fields, `0` for year fields). The year sentinel `0` is deliberate — do not substitute `null` even though `UserProfile.ts` types year columns as `number | null`."
      - "Field-level validation lives in `Helper/validationHelper.ts` with unit tests at boundary values. Text fields (`high_school`, `higher_secondary`, `college_name`, `highest_degree`): max 40 chars, allowed characters `[a-zA-Z0-9 \\-.,&']` (note the apostrophe — real school names like \"St. Mary's High School\" must pass). Year fields (`high_school_passing_year`, `higher_secondary_passing_year`, `graduation_year`): numeric-only, exactly 4 digits, 1950 ≤ year ≤ current year."
      - "Boundary tests in `__tests__/Helper/validationHelper.test.ts`: for each text field, assert 40 chars pass and 41 chars fail; for each year field, assert 1949 fails, 1950 passes, currentYear passes, currentYear+1 fails."
      - "Each field shows an inline validation error keyed off a `LabelKey` when its value is invalid — same pattern as pages 2 and 11. Continue is disabled until every visible field validates."
      - "Verify max-40 against `knotify-backend/db-schema.json` for `college_name`, `high_school`, `higher_secondary`, `highest_degree` during implementation. If DB is TEXT (unbounded), 40 is our UI choice; if `VARCHAR(N)` and N differs, update to N and mention in notes."
      - "For each of the 5 education-level values (`Elementary School Level`, `High School (10th)`, `Higher Secondary School (12th)`, `Graduate And Above`, `Medical Doctor / PHD`), the correct field set renders and hidden fields are auto-defaulted to their sentinels in the draft on mount."
      - "Back-navigating to page 12 and picking a lesser education level triggers `useEffect` reconciliation that force-resets the now-irrelevant fields to their sentinel defaults before page 13 re-mounts (per architecture §11.2.3 back-nav policy)."
      - "Continue navigates to `Page14SecondCheckpointScreen` via `advance(14)` + `navigation.navigate('Page14SecondCheckpointScreen')`."
      - "Screen wiring test covers each of the 3 behaviors above (branch-matrix rendering + auto-defaults, back-nav downgrade reset, Continue navigation) as separate `it()` blocks."
      - |
        Label keys with English copy enumerated — 22 total (1 title + 7 field sets × (label + placeholder + error)). Urdu equivalents required for parity — implementer writes idiomatic Urdu, CI enforces key parity.

          Title:
            `onboarding.education.credentials.title` → "Tell us about your education"

          For each field, a label + placeholder + error triple:

            highSchool:
              `onboarding.education.credentials.highSchool.label`         → "High school name"
              `onboarding.education.credentials.highSchool.placeholder`   → "e.g. St. Mary's High School"
              `onboarding.education.credentials.highSchool.error`         → "Use letters, digits, spaces, apostrophes, and , . & - only (max 40 chars)"

            highSchoolYear:
              `onboarding.education.credentials.highSchoolYear.label`       → "High school passing year"
              `onboarding.education.credentials.highSchoolYear.placeholder` → "e.g. 2012"
              `onboarding.education.credentials.highSchoolYear.error`       → "Enter a 4-digit year between 1950 and the current year"

            higherSecondary:
              `onboarding.education.credentials.higherSecondary.label`       → "Higher secondary school name"
              `onboarding.education.credentials.higherSecondary.placeholder` → "e.g. Government College Lahore"
              `onboarding.education.credentials.higherSecondary.error`       → "Use letters, digits, spaces, apostrophes, and , . & - only (max 40 chars)"

            higherSecondaryYear:
              `onboarding.education.credentials.higherSecondaryYear.label`       → "Higher secondary passing year"
              `onboarding.education.credentials.higherSecondaryYear.placeholder` → "e.g. 2014"
              `onboarding.education.credentials.higherSecondaryYear.error`       → "Enter a 4-digit year between 1950 and the current year"

            highestDegree:
              `onboarding.education.credentials.highestDegree.label`       → "Highest degree"
              `onboarding.education.credentials.highestDegree.placeholder` → "e.g. BSc Computer Science"
              `onboarding.education.credentials.highestDegree.error`       → "Use letters, digits, spaces, apostrophes, and , . & - only (max 40 chars)"

            graduationYear:
              `onboarding.education.credentials.graduationYear.label`       → "Graduation year"
              `onboarding.education.credentials.graduationYear.placeholder` → "e.g. 2018"
              `onboarding.education.credentials.graduationYear.error`       → "Enter a 4-digit year between 1950 and the current year"

            collegeName:
              `onboarding.education.credentials.collegeName.label`       → "College / university name"
              `onboarding.education.credentials.collegeName.placeholder` → "e.g. LUMS"
              `onboarding.education.credentials.collegeName.error`       → "Use letters, digits, spaces, apostrophes, and , . & - only (max 40 chars)"
    notes: ""

  - id: 5.3
    title: Page 14 - Second checkpoint + notification + location permissions
    agent: frontenddeveloper
    done: false
    depends_on: []
    tracking_issue: 27
    acceptance_criteria:
      - "AC 0 (native setup): run `npx expo install expo-location`. Add `NSLocationWhenInUseUsageDescription` to iOS config and `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION` to Android config in `app.json` / `app.config.ts` with the user-facing copy: \"Knotify uses your approximate location to show you compatible matches nearby\". Verify `expo-notifications` is already installed (it is, ~56.0.22)."
      - "Create `src/services/permissions/index.ts` that exports two typed helpers, both returning `Promise<'granted' | 'denied' | 'undetermined'>` (matches the existing pattern in `expoPush.ts`): `requestNotificationPermission()` wrapping `expo-notifications`; `requestLocationPermission()` wrapping `expo-location` with `whenInUse` accuracy. No screen calls the SDKs directly."
      - "Refactor `src/services/push/expoPush.ts`: remove the private `requestNotificationPermission` function and import from `@/services/permissions` instead. Update `expoPush.test.ts` accordingly. Only ONE implementation of `requestNotificationPermission` exists in the codebase after this story."
      - "Extend `useOnboardingDraft` with two new top-level setters modeled on the existing `setSiblings`: `setNotificationPermissionStatus(status)` and `setLocationPermissionStatus(status)`. These write to the top-level `notificationPermissionStatus` / `locationPermissionStatus` on `OnboardingDraft` (NOT inside `draft.fields`). Both trigger the 200ms debounced secure-store write. Update the hook's return-type interface + the test mock in `__tests__/navigation/OnboardingStack.test.tsx` and any Page-02+ test mocks that spread the hook."
      - "`Page14SecondCheckpointScreen` renders no background image (`Screen` without `background` prop). Layout mirrors `Page08FirstCheckpointScreen`: `WizardHeader` with `hideProgress` at top, centered content column (title + subtitle), `WizardFooter` with a single primary Continue button at bottom. Only the Continue button's LABEL and `onPress` change based on state — the visual variant is always `WizardFooter`'s default primary styling. No separate button component."
      - "Tapping the Continue button (labeled \"Enable Notifications\" in the prompt state) sequentially calls `requestNotificationPermission()` then `requestLocationPermission()`. Each result is written to the draft via the new setters whether granted or denied — never skipped. After both settle, the label swaps to \"Continue\" and the next tap advances (see AC below)."
      - |
        Re-prompt rule (explicit) — three states, one component. Screen has local state `mode: 'prompt' | 'continue' | 'loading'` derived from the draft. Priority order: `loading` if the mount reconciliation is in flight; else `prompt` if either permission status is `null` or `undetermined`; else `continue` (both terminal).

        Mount-reconciliation timing (explicit): a `useEffect` fires on mount with `mode` set to `'loading'`. It calls `Notifications.getPermissionsAsync()` and `Location.getPermissionsAsync()` in parallel (`Promise.all`), writes both observed statuses through the new setters (respecting Expo's `canAskAgain` — a `'denied'` result with `canAskAgain: false` is stored as `'denied'` and treated as terminal), then flips `mode` to `'prompt'` or `'continue'` based on the reconciled draft. The Continue button is disabled while `mode === 'loading'` to prevent double-tap during the reconciliation.

        Rationale: fire-and-forget without a loading state would let a user in the resumed-both-granted case briefly see the "Enable Notifications" button (whatever the pre-reconciliation draft said) before it swaps to "Continue" — a visible flicker. The `'loading'` state (backed by test coverage) avoids this.
      - "On Continue tap, calls `advanceWithCheckpoint(15, 'secondCheckpoint')` and then `navigation.navigate('Page15ResidenceCountryScreen')`. This sets `lastCheckpoint = 'secondCheckpoint'` (non-regressing per architecture §11.2.4). Killing and relaunching mounts the stack at `Page15ResidenceCountryScreen` (the fix from `fix/onboarding-resume-race` on `development` already handles this)."
      - |
        Label keys with English copy enumerated — 4 total. Urdu equivalents required for parity — implementer writes idiomatic Urdu, CI enforces key parity.

          `onboarding.secondCheckpoint.title`                → "You're doing great!"
          `onboarding.secondCheckpoint.subtitle`             → "Enable notifications so you don't miss new matches and messages, and share your approximate location so we can show you compatible matches nearby."
          `onboarding.secondCheckpoint.enableNotifications`  → "Enable Notifications"
          `onboarding.secondCheckpoint.continue`             → "Continue"
      - "Screen wiring test mocks BOTH `expo-notifications` and `expo-location` (mirror the `expoPush.test.ts` mock pattern) and covers: (a) first-time grant flow — both prompts fire in order, both draft setters called with `'granted'`, Continue navigates to Page 15; (b) first-time deny flow — both prompts fire, both setters called with `'denied'`, Continue still enabled; (c) resumed-both-granted state — no prompts fire, plain Continue button, `advanceWithCheckpoint(15, 'secondCheckpoint')` called on tap; (d) resumed-one-denied-terminal state — no prompts fire, plain Continue button; (e) mount reconciliation — `getPermissionsAsync()` for both modules is called on mount and the draft is updated with the observed statuses."
      - "Unit test for `services/permissions/index.ts` covers both helpers' happy path (granted), deny path, and pre-granted-already-returns-granted-without-request path."
    notes: ""
