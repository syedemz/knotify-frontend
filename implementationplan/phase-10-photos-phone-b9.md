phase: 10
title: Photos + phone (B9, pages 28-29)
last_updated: 2026-08-03

context_summary: |
  Phase 10 delivers the photo grid (page 28, media library permission + image picker) and the phone input (page 29, libphonenumber validation). Photos are stored as local URIs only; upload to backend is deferred until the backend photo pipeline is deployed (§17.14). Phone verification method is [Open] per §17.23 - the field is accepted as validated by libphonenumber-js without OTP in v1.

  Answers from `QA/explanations.txt` (2026-08-03) resolve the following:
  - Photo remove/replace UX: Muzz-style — small "x" badge in the top-right of every filled tile removes the photo; tapping the tile body itself re-opens the picker to replace.
  - Photo constraints: force 1:1 square crop via `allowsEditing: true`, quality 0.8, `mediaTypes: 'Images'`.
  - Page 28 Continue label: flips "Add photos" (0 tiles) → "Continue" (>= 1 tile).
  - Default dial code when `resident_country_code` is empty: `+91` (India, per user's targeting).
  - Correct downstream route name: `Page30FaceVerifyIntroScreen` (not `Page30FaceIntroScreen` as the original PRD said).

  Native surface change: `expo-image-picker` is a new native dep with its own config plugin (Android `READ_MEDIA_IMAGES`, iOS `NSPhotoLibraryUsageDescription`). Adding it triggers a CNG rebuild — `npx expo prebuild` + full APK reinstall are required before the first dev-build boot after story 10.1 ships. `libphonenumber-js` (story 10.2) is JS-only.

  Draft-schema bump: story 10.2 adds `phone_number: string | null` to `OnboardingDraft`, bumps `schemaVersion` from 3 to 4 under the DISCARD policy. All existing empty-draft fixtures in `__tests__/features/onboarding/*` (~20 files) must be updated.

stories:
  - id: 10.1
    title: Page 28 - Photos (6-tile grid, image picker, media permission)
    agent: frontenddeveloper
    done: false
    depends_on: []
    tracking_issue: 41
    acceptance_criteria:
      - Adds `expo-image-picker` as a dependency AND registers its config plugin in `app.json` with `photosPermission` (iOS) and Android permission blocks. Runs `npx expo prebuild` so `android/` reflects the new manifest entry. Documents in the story commit message that a full APK reinstall is required for testing.
      - Adds `requestMediaLibraryPermission()` to `src/services/permissions/index.ts`, returning the same `'granted' | 'denied' | 'undetermined'` union the file's other exports use, wrapping `ImagePicker.requestMediaLibraryPermissionsAsync()` with the existing `getPermissionsAsync` short-circuit pattern.
      - `Page28PhotosScreen` renders a 6-tile grid via a feature-local `PhotoTile` component under `src/features/onboarding/components/`. Grid layout uses `flexWrap: 'wrap'` with 3 tiles per row on standard widths.
      - Tapping an **empty** tile calls `requestMediaLibraryPermission()`; if `'granted'` it opens `expo-image-picker` with `mediaTypes: 'Images'`, `allowsEditing: true`, `aspect: [1, 1]`, `quality: 0.8`.
      - When permission is `'denied'`, the tile shows a "grant photos access" hint in place of a picker action, and the Continue button stays disabled until >= 1 tile is filled by any route.
      - When the picker returns `canceled === true` (user granted permission but cancelled without selecting), the tapped tile stays empty and nothing is written to the draft.
      - When the picker returns a valid asset, the local URI is appended to `onboardingDraft.photoPreviewUris`; the tile switches to the "filled" state, showing the selected image via the catalog `Image` component sized to fill the tile with `contentFit: 'cover'`.
      - Filled tiles show a small circular "x" badge overlaid in the top-right corner (theme token `bg.overlay` background, `text.inverse` icon). Tapping the "x" removes that tile's URI from `photoPreviewUris` (splice by index) and the tile returns to the empty state. The "x" has its own hit target and does not bubble to the tile body's press handler.
      - Tapping the **body** of a filled tile (not the "x") re-opens the image picker with the same options; on a valid selection, the new URI replaces the old one at the same index in `photoPreviewUris`.
      - Continue button label reads "Add photos" when `photoPreviewUris.length === 0` and "Continue" when >= 1. Enabled only when >= 1. On tap, advances to `Page29PhoneScreen`.
      - Screen wiring test in `__tests__/features/onboarding/Page28PhotosScreen.test.tsx` covers: permission-grant + valid selection appends URI; permission-grant + picker-cancel leaves tile empty; permission-denied shows hint and disables Continue; "x" badge tap removes the URI at that index; tile-body tap after fill re-opens picker and replaces the URI; Continue label flips at count 0 → 1; Continue advances to `Page29PhoneScreen` when >= 1.
    notes: "Photos are not uploaded to backend in v1 per §17.14. Local URIs on Android are content:// URIs that may not survive a cold app restart until backend upload lands — document as a known limitation in the story commit, not a bug. Native rebuild required after this story (see acceptance criteria)."

  - id: 10.2
    title: Page 29 - Phone number with libphonenumber-js validation
    agent: frontenddeveloper
    done: false
    depends_on: []
    tracking_issue: 42
    acceptance_criteria:
      - Adds `libphonenumber-js` as a dependency (JS-only, no prebuild needed for this dep alone).
      - Adds `phone_number: string | null` to the `OnboardingDraft` type in `src/features/onboarding/draftSchema.ts`, initialised as `null` in `emptyDraft()`. Bumps `SCHEMA_VERSION` from 3 to 4 under the existing DISCARD policy (§16.2). Updates every empty-draft fixture in `__tests__/features/onboarding/**` and `__tests__/navigation/checkpointResume.integration.test.tsx` to include `phone_number: null`.
      - Adds `isValidPhone(dialCode: string, nationalNumber: string): boolean` to the existing `src/Helper/validationHelper.ts` module (new section, following the file's existing section-header convention). Uses `parsePhoneNumberFromString` from `libphonenumber-js` to parse `dialCode + nationalNumber` and returns `.isValid()`. Unit tests in `__tests__/Helper/validationHelper.test.ts` cover valid + invalid cases for at least three countries (IN, PK, GB) and reject empty/malformed input.
      - Adds `canonicalizePhone(dialCode: string, nationalNumber: string): string | null` to the same module, returning the E.164 form (e.g. `+919812345678`) when valid, `null` otherwise. Unit tested alongside `isValidPhone`.
      - `Page29PhoneScreen` renders a country dial-code prefix chip (defaulting to the dial code derived by looking up `draft.resident_country_code` in `src/config/countries.ts`; falls back to `+91` India when `resident_country_code` is empty or the lookup fails) and a `TextInput` with `keyboardType: 'number-pad'` and `maxLength: 15`.
      - The dial-code chip is tappable and opens the existing country picker (same component as page 15) so users can override the default without going back through onboarding.
      - Continue button is disabled until `isValidPhone(dialCode, number)` returns true. On tap, writes `phone_number: canonicalizePhone(dialCode, number)` (E.164 string) to the draft via `update()` and advances to `Page30FaceVerifyIntroScreen` (note: this is the correct registered route name — the original PRD said `Page30FaceIntroScreen` which does not exist).
      - Screen wiring test in `__tests__/features/onboarding/Page29PhoneScreen.test.tsx` covers: default dial code derived from a preset `resident_country_code`; fallback to +91 when `resident_country_code` is empty; Continue gated by validity; Continue writes E.164 to draft and advances to `Page30FaceVerifyIntroScreen`; country picker override changes the dial code.
    notes: "SMS OTP verification is [Open] per §17.23 - v1 accepts validated number without OTP. Draft schema bump to v4 triggers DISCARD of any in-progress v3 draft — flagged in QA concern #8."
