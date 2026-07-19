phase: 11
title: Face verification + final PATCH (B10, pages 30-31)
last_updated: 2026-07-19

context_summary: |
  Phase 11 finishes the onboarding wizard with the face verification intro (page 30, camera permission gate) and the auto-capture face screen (page 31, face-oval overlay + face detection + final PATCH /profile/me). After this phase a completed onboarding flow causes `profile_complete_verified` to flip server-side, the JWT refreshes, and `RootNavigator` swaps in `AppTabs`. This marks the end of the onboarding delivery stream; phases 12+ are the thin post-onboarding features.

stories:
  - id: 11.1
    title: Page 30 - Face verification intro + camera permission gate
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `Page30FaceIntroScreen` renders an explainer body from labels and a `Verify photo` button.
      - Tapping the button calls `src/services/permissions/requestCameraPermission()` (added here) using `expo-camera`.
      - Grant navigates to `Page31FaceCaptureScreen`; deny surfaces an inline "camera required to continue" state with a retry action; permanent deny keeps Continue disabled.
      - Screen wiring test covers grant, first-time deny + retry, and permanent-deny states.
    notes: ""

  - id: 11.2
    title: Page 31 - Face capture, final PATCH /profile/me, JWT refresh
    agent: frontenddeveloper
    done: false
    depends_on: [11.1]
    acceptance_criteria:
      - `Page31FaceCaptureScreen` renders a full-screen camera preview via `expo-camera` with a `FaceOvalOverlay` feature-local component.
      - On-device face detection (via `expo-camera`'s face-detection add-on per §17.24 default recommendation) triggers auto-capture when a face is inside the oval bounds for N consecutive frames (N configurable, default 15).
      - Captured image is saved locally to `onboardingDraft.faceSelfieUri` (not sent to backend in v1 per §17.14).
      - On successful capture, the full PATCH body is derived from `onboardingDraft.fields` (plus `siblings` per current §17.21 assumption of embedded array), submitted to `/profile/me`, and on success clears the draft, forces a JWT refresh via `AuthProvider.refresh()`, and lets `RootNavigator` swap in `AppTabs`.
      - On 409 username collision the client regenerates the trailing 4-digit alphanumeric segment and retries once; a second 409 surfaces a "try again" action on this screen without clearing the draft.
      - On any other PATCH failure the draft is preserved and the screen shows a retry action - the user is never dumped back to page 1.
      - `services/api/mocks/handlers.ts` gains a PATCH `/profile/me` handler with fixtures for success, 409 username collision, and 500 generic failure; tests cover each path.
    notes: ""
