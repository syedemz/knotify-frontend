phase: 11
title: Face verification + final PATCH (B10, pages 30-31)
last_updated: 2026-08-03  # story 11.2 complete

context_summary: |
  Phase 11 finishes the onboarding wizard with the face verification intro (page 30, camera permission gate) and the auto-capture face screen (page 31, face-oval overlay + face detection + final "PATCH" /profile/me). After this phase, onboarding is functionally complete and the user lands on the main app (AppTabs).

  === MOCK-ONLY REGISTRATION COMPLETION (temporary, per user 2026-08-03) ===

  The backend (Cognito + AWS API + DB) is intentionally NOT stood up yet. The goal is to build out the front-end all the way through the profile page (phase 12) against local/mock data, then wire up the real backend later. So for phase 11:

    - NO real PATCH to /profile/me. The submit path goes through the existing MSW mock, which returns a synthetic 200.
    - NO changes to `src/state/auth/AuthProvider.tsx`. The stubbed `profileComplete: false` stays as-is. The `TODO(phase-2)` for JWT `custom:profile_complete` claim decode also stays as-is — it will be resolved when the real backend + Cognito claims are up.
    - `AuthProvider.refresh()` is NOT called for the purpose of getting a fresh JWT claim (it wouldn't work — the claim is stubbed). It MAY still be called for other reasons (e.g., preserving the existing silent-refresh contract) but that's not what unlocks AppTabs.
    - Instead, a NEW minimal client-side layer flips a local flag `dummy.onboarding.complete=true` in expo-secure-store on mock-PATCH success. `RootNavigator` gains a minimal additive check so that (profileComplete || dummyOnboardingComplete) → AppTabs.
    - Before clearing the onboarding draft, story 11.2 snapshots the assembled PATCH body to a NEW secure-store key `dummy.profile` so phase 12 can render "My Profile" from real user-entered data rather than a hardcoded fixture.

  Everything added as part of this mock-only bypass is tech-debt to remove when the real backend ships. It is enumerated in `context.md → Before shipping`. Every new call site is marked with `// TODO(mock-only)` for grep-ability.

  === FACE DETECTION LIBRARY DECISION (per user 2026-08-03) ===

  §17.24 in architecture.md was [Open]. Decided: use `react-native-vision-camera` for the camera preview + `vision-camera-face-detector` for on-device face detection. Rationale: `expo-face-detector` has been deprecated and removed from Expo modules for years; `expo-camera` has no bundled face-detection add-on on SDK 56. vision-camera is the current de-facto standard for React Native and doesn't cost us the "requires prebuild" downside because the project is already off Expo Go on dev builds since phase 5. `expo-camera` is NOT installed by this phase — vision-camera provides both the preview and the permission API.

  === NATIVE MODULES — MERGE REQUIRES FULL APK REINSTALL ===

  Both `react-native-vision-camera` and `vision-camera-face-detector` are native modules. Same class of change as phase 10's `expo-image-picker`. After story 11.1 lands (which is where both packages are installed), the test device (000323572000090) needs `npx expo run:android` to reinstall from scratch — CAMERA permission activates on the new APK install.

  === UNVALIDATED ASSUMPTIONS (deferred to real-backend cutover) ===

    - `options.yesNo = ["YES", "NO"]` (uppercase) written verbatim to draft fields `father_retired`, `mother_retired`, `has_children` (bool-coerced), `move_abroad` (bool-coerced). Moot for phase 11 because the mock accepts anything. Enumerated in `context.md → Before shipping` for validation when backend is real.

stories:
  - id: 11.1
    title: Page 30 - Face verification intro + camera permission gate
    agent: frontenddeveloper
    done: true
    depends_on: []
    tracking_issue: 43
    acceptance_criteria:
      - `react-native-vision-camera` and `vision-camera-face-detector` are installed as dependencies. **Pin exact minor versions** in `package.json` (e.g. `~4.x.x` and `~1.x.x` — whatever installs cleanly against Expo SDK 56) and record the resolved versions in the PR body. Both packages are native modules — after this story lands, the test device (000323572000090) needs a full APK reinstall via `npx expo run:android` (documented in the story's PR body and appended to `context.md → Recent changes`).
      - Jest mocks are added under `__mocks__/react-native-vision-camera.ts` and `__mocks__/vision-camera-face-detector.ts` so unit tests can run in Node.js without loading native code. Both mocks export the minimum surface the app touches (Camera component, `Camera.getCameraPermissionStatus()`, `Camera.requestCameraPermission()`, `useCameraDevice`, face-detector hook/utility). The face-detector mock's exact API surface follows whatever `vision-camera-face-detector` exports at the pinned version — don't over-specify.
      - `Page30FaceIntroScreen` renders an explainer body from labels and a `Verify photo` button. Copy keys live under `onboarding.faceIntro.*` in EN + UR with full parity.
      - `src/services/permissions/index.ts` gains a `requestCameraPermission(): Promise<PermissionStatus>` helper following the exact pattern of `requestNotificationPermission`, `requestLocationPermission`, and `requestMediaLibraryPermission` (returns `'granted' | 'denied' | 'undetermined'`, checks existing status first, respects re-request semantics). Uses `Camera.getCameraPermissionStatus()` / `Camera.requestCameraPermission()` from `react-native-vision-camera`. **Explicit permission-string mapping**, since vision-camera's union differs from ours: `'granted' → 'granted'`, `'denied' → 'denied'`, `'not-determined' → 'undetermined'`, `'restricted' → 'denied'`. Encapsulate the mapping in a tiny private helper `mapVisionCameraStatus(raw)` inside the module and unit-test the mapping table directly. Unit tests cover the three-outcome matrix (already-granted, first-request-grant, first-request-deny, permanent-deny via `'restricted'` and via subsequent `'denied'` calls).
      - Tapping the `Verify photo` button calls `requestCameraPermission()`. On `'granted'` → `navigation.navigate('Page31FaceCapture')`. On first-time `'denied'` → inline "camera required to continue" surface with a `Retry` button that re-invokes the helper.
      - On permanent-deny (repeat `'denied'` result on subsequent taps, or `'restricted'`), the screen shows an "Open Settings" button that calls `Linking.openSettings()` (mirrors phase 10 story 10.1's photo-permission recovery per commit 48a13c3) AND surfaces a **Snackbar/toast** message (reuse the existing Snackbar pattern from phase 9's Page25PersonalityTraitsScreen) explaining that camera permission is required to complete registration and directing the user to enable it in the OS settings. Copy key `onboarding.faceIntro.permissionRequiredMessage` in EN + UR. (Toast, not modal — one copy key, no title needed.)
      - Screen wiring test covers: (a) initial render with button enabled; (b) grant → navigate; (c) first-deny → inline retry surface visible, `Open Settings` NOT visible; (d) retry-then-grant → navigate; (e) permanent-deny → `Open Settings` visible + Snackbar/toast message rendered, tapping `Open Settings` invokes `Linking.openSettings`.
      - `OnboardingStack` wires `Page30FaceIntroScreen` in place of the current page-30 placeholder.
    notes: ""

  - id: 11.2
    title: Page 31 - Face capture, mock-only submit, local completion flag
    agent: frontenddeveloper
    done: true
    depends_on: [11.1]
    tracking_issue: 44
    acceptance_criteria:
      - `Page31FaceCaptureScreen` renders a full-screen camera preview via `react-native-vision-camera`'s `<Camera />` component with a `FaceOvalOverlay` feature-local component drawn on top.
      - On-device face detection is driven by `vision-camera-face-detector`. A **pure state machine** (`useAutoCaptureController` hook or a plain reducer function under `features/onboarding/hooks/`) consumes a stream of `faceInsideOval: boolean` events and emits `shouldCapture: boolean` after N consecutive `true` events (N configurable via a constant, default 15). The state machine is directly unit-tested with synthetic event streams — no camera required. The camera component only wires events into the state machine.
      - A manual `Shutter` button is ALWAYS rendered alongside auto-capture (per user decision on concern #10). User can tap it any time to force capture whatever is in the viewfinder. Auto-capture and manual capture reach the same capture handler.
      - `OnboardingDraft` schema is bumped `schemaVersion: 3 → 4` under the existing DISCARD policy. `faceSelfieUri: string | null` is added to `OnboardingDraft`, wired through `createEmptyDraft()`, and every existing test fixture that constructs a draft is updated to include `faceSelfieUri: null`. **Expect ~20-30 test-fixture files to require this update** — subagent should grep `createEmptyDraft` and `schemaVersion: 3` to enumerate them upfront and add `faceSelfieUri: null` in a single mechanical pass. `useOnboardingDraft` gains a `setFaceSelfieUri(uri: string)` setter.
      - On successful capture (auto or manual), the local image URI is written to `onboardingDraft.faceSelfieUri` via the setter. Not sent to any backend in v1 (per §17.14).
      - **MOCK-ONLY submit path — explicit ordering, abort-on-throw before the draft is cleared.** After the selfie is captured, the client executes these steps in this exact order; any thrown step aborts the sequence with the draft preserved and surfaces the retry action:
          1. Build the PATCH body via `buildPatchBody(draft, { isRetry: false })` (pure — cannot throw for a valid draft).
          2. Submit PATCH `/profile/me` via the app's normal HTTP client. Intercepted by the MSW handler; returns a synthetic 200 with the body echoed back.
          3. Snapshot the assembled PATCH body to expo-secure-store under key `dummy.profile` (JSON-stringified). **This step MUST happen before step 4.**
          4. Call `mockOnboardingCompletion.markComplete()` — this method OWNS both the secure-store write (`dummy.onboarding.complete = "true"`) AND the in-memory state flip. Do NOT split "write secure-store" and "flip in-memory" across the caller and the provider; keeping them in one method prevents an inconsistent state where the in-memory flag is `true` but the persistent key is missing (or vice versa).
          5. Clear the onboarding draft (`useOnboardingDraft.clear()`).
        Rationale: if any step throws before step 5, the draft is intact and the user can retry. If step 3 or 4 throws after the 200, we do NOT clear the draft — the user retries and re-runs 3 → 4 → 5 with the same body. Test AC (screen-wiring) covers the "step 3 throws" path — assert the draft is not cleared and the retry action is visible.
      - A NEW `OnboardingCompletionProvider` (under `src/state/onboardingCompletion/`) reads `dummy.onboarding.complete` from expo-secure-store on mount and exposes:
          ```
          { loading: boolean, complete: boolean, markComplete: () => Promise<void>, reset: () => Promise<void> }
          ```
        **Mount point — MUST be a descendant of `AuthProvider`** so that the provider can consume `useAuth()` for the runtime sanity warning below. Required tree in `App.tsx`: `<AuthProvider><OnboardingCompletionProvider><RootNavigator/></OnboardingCompletionProvider></AuthProvider>`. Sibling placement will crash on the `useAuth()` call.
        - **`loading` semantics:** starts `true`; flips to `false` once the initial secure-store read resolves (successfully or with an error). Prevents the first-mount race where a returning completed user briefly sees `OnboardingStack`.
        - **Resilience:** if `SecureStore.getItemAsync('dummy.onboarding.complete')` throws, log the error and default to `complete: false` (do NOT propagate; the app must not crash on secure-store read failure).
        - **Runtime sanity warning:** if `complete === true` AND `useAuth().status === 'unauthenticated'` (i.e., a real mismatch, NOT the transient `'loading'` state), `console.warn('[mock-only] onboarding completion flag is set but auth session is missing — likely stale mock-mode teardown; see context.md → Before shipping')`. Excluding `'loading'` prevents a spurious warning on every cold launch for completed users (auth is `'loading'` while the completion flag has already resolved).
        - **Naming:** the exposed boolean is `complete` (not `dummyOnboardingComplete`); when destructured in `RootNavigator` the local name is `mockOnboardingComplete` — matching the `env.isMockAuth` naming convention.
      - **`RootNavigator` edit — precise location.** Modify the EXISTING `if (!profileComplete)` branch in `src/navigation/RootNavigator.tsx` (currently lines 71-73). Change to `if (!profileComplete && !mockOnboardingComplete) return <OnboardingStack />`. Also extend the loading-splash guard at line 57 to `if (status === 'loading' || onboardingCompletion.loading) return <splash />`. Do NOT add a duplicate `if (status === 'authenticated' && …)` branch — the outer `status === 'authenticated'` gate above line 71 already covers it. Two RootNavigator tests are added:
          - `(status='authenticated', profileComplete=false, mockOnboardingComplete=true) → renders AppTabs`
          - `(status='authenticated', profileComplete=false, mockOnboardingComplete=false, onboardingCompletion.loading=true) → renders splash`
        `AuthProvider` is NOT modified.
      - Every mock-only surface added by this story is marked with `// TODO(mock-only): remove when real backend + JWT claim decode ship`. Grep `TODO(mock-only)` reveals every teardown site.
      - `buildPatchBody(draft, { isRetry })` is a pure function under `src/features/onboarding/buildPatchBody.ts`. Behaviour:
          - Explicit **allowlist** of `UserProfileWritable` fields from `draft.fields`. NEVER includes `photoPreviewUris`, `faceSelfieUri`, `notificationPermissionStatus`, `locationPermissionStatus`, `lastCheckpoint`, `currentPage`, `timestamps`, `schemaVersion`.
          - Includes `draft.phone_number` (a `UserProfileWritable` column per `knotify-backend/db-schema.json`) as `phone_number` in the body.
          - Includes `draft.siblings` under key `siblings`, transformed field-by-field from camelCase to snake_case (`maritalStatus → marital_status`, `age → sibling_age`). Wrap in a helper `serializeSiblings(siblings: SiblingDraft[])` for testability.
          - When `isRetry === true`, filters out every field for which `isImmutable(field)` (from `src/Helper/immutableFieldHelper.ts`) returns `true`. The unit test iterates over ALL keys returned by `isImmutable` and asserts each is stripped from the retry body — this way, any future addition to the helper is automatically covered without editing the test.
          - Unit tests cover: (a) first-submit includes every allowlisted writable field that's non-null in the draft; (b) client-only fields are never included; (c) retry strips every field where `isImmutable(field) === true`; (d) siblings are embedded under `siblings` key in snake_case shape; (e) empty draft produces an empty (or near-empty) body without crashing.
      - On 409 username collision, the client regenerates the username via `generateUsername(first, last)` (the existing helper — which produces a 4-digit numeric suffix, NOT alphanumeric; PRD wording corrected here) and retries the PATCH once. During the retry attempt, the button label switches to a "checking availability" state via copy key `onboarding.faceCapture.usernameRegenerating`. A second 409 surfaces a "try again" action on this screen without clearing the draft.
      - On any other PATCH failure (500, network, etc.), the draft is preserved and the screen shows a retry action. The user is never dumped back to page 1.
      - `services/api/mocks/handlers.ts` gains a PATCH `/profile/me` handler with fixtures for: (i) success (echoes body back, 200); (ii) 409 username collision (triggerable via a fixture-toggle so tests can exercise the retry path); (iii) 500 generic failure. Tests cover each path end-to-end at the screen-wiring level (mock the state machine so tests don't wait for real frames).
      - Copy keys under `onboarding.faceCapture.*` in EN + UR with full parity: `title`, `subtitle` (instructions), `shutterButton`, `autoCaptureHint`, `captureRetry`, `submitError`, `submitRetry`, `usernameRegenerating`.
      - `OnboardingStack` wires `Page31FaceCaptureScreen` in place of the current page-31 placeholder. On mock-submit success, the screen does NOT call `navigation.navigate('AppTabs')` — the context state change from `markComplete()` triggers a re-render of `RootNavigator` which swaps in `AppTabs` (state-driven, not imperative navigation).
    notes: ""
