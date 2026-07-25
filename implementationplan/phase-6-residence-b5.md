phase: 6
title: Residence (B5, pages 15-17)
last_updated: 2026-07-25

context_summary: |
  Phase 6 captures residence country + dial code (page 15), residence city (page 16), and Kashmir district + family residence address (page 17). Introduces the country-picker component using `src/config/countries.ts` and a flag-rendering library (§17.25).

  Cross-story test-setup note (draft-store Context refactor, PR #92, 2026-07-25):
  Every screen test in this phase MUST include the `OnboardingDraftProvider: ({ children }) => children` passthrough inside the `jest.mock('@/features/onboarding/hooks/useOnboardingDraft', ...)` block. Older screen tests (pages 5, 9, 10, 12) predate the refactor and are NOT the reference — copy from `Page13EducationCredentialsScreen.test.tsx` instead.

stories:
  - id: 6.1
    title: Page 15 - Current residence country (name + dial code + flag picker)
    agent: frontenddeveloper
    done: true
    depends_on: []
    tracking_issue: 93
    acceptance_criteria:
      - `Page15CountryScreen` renders a searchable list from `src/config/countries.ts`; each row shows the flag (via `react-native-country-flag`), country name, and dial code.
      - Search behavior is a **case-insensitive prefix match on `name` only** (does not match `dialCode`). Empty query shows the full alphabetical list; no debounce (plain `Array.filter` on every keystroke is fine for ~200 entries).
      - **No default pre-selection.** Picker opens scrolled to the top of the alphabetical list; no country is highlighted until the user taps one. Device-locale detection is explicitly out of scope.
      - Tapping a row atomically writes both `current_residence_country` and `resident_country_code` to the draft and auto-advances to `Page16ResidenceCityScreen`.
      - A `CountryPicker` component is added to the **shared catalog** at `src/components/CountryPicker.tsx` (co-located with other catalog components like `SelectionTile`, `ListRowSelectable`). It takes theme-token props and encapsulates row rendering; keep it generic enough to be reusable by any future country-selection screen.
      - Screen wiring test covers row rendering, atomic dual-field write, and auto-advance. Test setup includes the `OnboardingDraftProvider` passthrough noted in `context_summary` (mirror `Page13EducationCredentialsScreen.test.tsx`).
    notes: |
      Flag library confirmed at scaffold per §17.25. **This story owns installing it** — as the first step, run `npx expo install react-native-country-flag`. If Jest trips on native/SVG imports at test time, add a `moduleNameMapper` entry in `jest.config.js` mirroring the pattern used for `lucide-react-native` in phase 2. Do not treat the missing dependency as an external blocker; installing it is part of this story.

  - id: 6.2
    title: Page 16 - Current residence city
    agent: frontenddeveloper
    done: true
    depends_on: []
    tracking_issue: 94
    acceptance_criteria:
      - Add `isValidCity` to `src/Helper/validationHelper.ts` alongside a new exported constant `MAX_CITY_NAME_LENGTH = 40`. Character class matches `isValidName` (letters, spaces, hyphens, apostrophes; no leading/trailing whitespace; length 1..MAX_CITY_NAME_LENGTH). Do NOT reuse `isValidName` directly — its `MAX_NAME_LENGTH` is 35 and cities need 40.
      - `Page16ResidenceCityScreen` renders a single `TextInput` with `maxLength = MAX_CITY_NAME_LENGTH + 1` (mirrors the phase-11 pattern so the user can type past the limit and see the "tooLong" inline error rather than a silent hard-stop).
      - Continue is disabled until `isValidCity(value)` returns true; on tap writes `current_residence_city` to the draft and advances to `Page17KashmirDistrictScreen`.
      - Screen wiring test covers validation (valid + each invalid case), the disabled/enabled Continue transition, draft write, and advance. Test setup includes the `OnboardingDraftProvider` passthrough noted in `context_summary`.
      - Unit tests for `isValidCity` cover boundary lengths (0, 1, 40, 41), leading/trailing whitespace rejection, allowed character set, and rejected characters (digits, punctuation other than hyphen/apostrophe).
    notes: ""

  - id: 6.3
    title: Page 17 - Kashmir district + family residence address
    agent: frontenddeveloper
    done: true
    depends_on: []
    tracking_issue: 95
    acceptance_criteria:
      - `Page17KashmirDistrictScreen` renders a pick-one from `options.kashmirDistricts` (22 entries) plus a multiline `TextInput` for `family_residence_address`.
      - **Default preselect (Srinagar) semantics:** on mount, if `kashmir_district` in the draft is `null`/`undefined`, immediately write `"Srinagar"` to the draft via `update({ kashmir_district: 'Srinagar' })`. This keeps the visual "selected" state and the draft in sync — a user who taps Continue without touching the picker will submit `"Srinagar"` (which matches what the row shows). Back-navigation from `Page18ParentsScreen` must NOT overwrite whatever the user chose (guard the mount-write behind the `null`/`undefined` check).
      - `family_residence_address` field: **no character-class rule** (mirrors `office_address` on page 11). Only length is enforced: `maxLength = 71` on the TextInput so the user can type past the 70-character limit and see the inline "tooLong" error. `autoCorrect` is enabled (freeform prose). Introduce `isValidFamilyResidenceAddress` in `validationHelper.ts` with `MAX_FAMILY_RESIDENCE_ADDRESS_LENGTH = 70`; validator returns true when the trimmed length is between 1 and 70 inclusive.
      - Continue is disabled until BOTH: (a) `kashmir_district` is non-null in draft (always true after the mount-write, unless the user has never mounted the screen — but the write is synchronous with mount, so this is effectively always true); (b) `isValidFamilyResidenceAddress(value)` returns true. On tap writes both fields to the draft and advances to `Page18ParentsScreen` (which is a phase-2 placeholder — navigation call is safe).
      - Screen wiring test covers: (i) mount-write of "Srinagar" when draft is empty; (ii) mount-write is skipped when draft already has a value (back-nav case); (iii) tapping a different district overwrites the draft; (iv) `family_residence_address` validation gates Continue; (v) draft write + advance on Continue. Test setup includes the `OnboardingDraftProvider` passthrough noted in `context_summary`.
      - Unit tests for `isValidFamilyResidenceAddress` cover boundary lengths (0, 1, 70, 71) and confirm that special characters (`/`, `#`, `,`, `.`, digits, apostrophes) are accepted.
    notes: ""
