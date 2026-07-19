phase: 10
title: Photos + phone (B9, pages 28-29)
last_updated: 2026-07-19

context_summary: |
  Phase 10 delivers the photo grid (page 28, media library permission + image picker) and the phone input (page 29, libphonenumber validation). Photos are stored as local URIs only; upload to backend is deferred until the backend photo pipeline is deployed (§17.14). Phone verification method is [Open] per §17.23 - the field is accepted as validated by libphonenumber-js without OTP in v1.

stories:
  - id: 10.1
    title: Page 28 - Photos (6-tile grid, image picker, media permission)
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `Page28PhotosScreen` renders a 6-tile grid via a feature-local `PhotoTile` component under `src/features/onboarding/components/`.
      - Tapping an empty tile requests media library permission via `src/services/permissions/requestMediaLibraryPermission()` (added here if not present) then opens `expo-image-picker`.
      - Selected local URIs are appended to `onboardingDraft.photoPreviewUris`; tiles show the selected image via catalog `Image`.
      - When permission is denied, the tile shows a "grant photos access" hint and Continue stays disabled until >=1 tile is filled by any route.
      - "Add photos" (Continue) button is enabled at >=1 tile filled; on tap advances to `Page29PhoneScreen`.
      - Screen wiring test covers permission grant path, permission deny path, tile-fill on selection, Continue gate, and advance.
    notes: "Photos are not uploaded to backend in v1 per §17.14."

  - id: 10.2
    title: Page 29 - Phone number with libphonenumber-js validation
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `Page29PhoneScreen` renders a country dial-code prefix (defaulting to the value written on page 15 but editable) and a `TextInput` with `keyboardType='number-pad'`.
      - `Helper/validationHelper.ts → isValidPhone(dialCode, number)` uses `libphonenumber-js` to parse and validate; unit tests cover valid + invalid cases for at least three countries.
      - Continue is disabled until the parsed number is valid; on tap writes `phone_number` (canonicalized E.164 form) to the draft and advances to `Page30FaceIntroScreen`.
      - Screen wiring test covers valid/invalid gating and advance.
    notes: "SMS OTP verification is [Open] per §17.23 - v1 accepts validated number without OTP."
