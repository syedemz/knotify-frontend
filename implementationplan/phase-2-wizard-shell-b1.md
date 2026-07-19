phase: 2
title: Wizard shell + pages 1-4 (B1)
last_updated: 2026-07-19

context_summary: |
  Phase 2 delivers the onboarding wizard's structural spine (wizard chrome components, draft persistence, checkpoint hooks) plus the first four pages: welcome (p1, with language toggle sheet), email (p2, Cognito signUp), confirm code (p3, Cognito confirmSignUp), and get-started (p4). After this phase a user can create a Cognito account and reach page 4; phases 3-11 (B2-B10) fill the remaining 27 pages page-by-page.

stories:
  - id: 2.1
    title: Wizard chrome components (WizardHeader, WizardProgress, WizardFooter)
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `WizardHeader`, `WizardProgress`, `WizardFooter` exist under `src/components/` with theme-token props per §2a.3.
      - `WizardProgress` renders a `current / total` progress bar where `total` is the constant `31`.
      - `WizardHeader` renders back navigation and hides the progress bar when `hideProgress` is `true` (used by pages 1-4 per §6.3).
      - `WizardFooter` renders a Next/Continue button supporting `disabled` and `loading` states plus an optional Back button.
      - Each component has `__tests__/components/<Name>.test.tsx` covering all variants and both themes; each is re-exported from `src/components/index.ts`.
    notes: ""

  - id: 2.2
    title: Onboarding draft store (useOnboardingDraft, checkpoints, draftSchema)
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `src/features/onboarding/draftSchema.ts` defines the `OnboardingDraft` type per §11.2.4 (schemaVersion, lastCheckpoint, currentPage, fields, siblings, photoPreviewUris, notificationPermissionStatus, locationPermissionStatus, timestamps).
      - `src/features/onboarding/checkpoints.ts` exports named constants `firstCheckpoint` and `secondCheckpoint`.
      - `src/features/onboarding/hooks/useOnboardingDraft.ts` reads/writes the draft under the `onboardingDraft` key in `expo-secure-store`, debounces writes by 200 ms, and exposes `update`, `advance`, `reset`, `getDraft`.
      - `src/features/onboarding/hooks/useOnboardingProgress.ts` derives `{ current, total, checkpoint }` from the current route name and the draft.
      - `src/features/onboarding/hooks/useCheckpointResume.ts` returns the correct initial route on resume per §6.3 (secondCheckpoint -> post-14, firstCheckpoint -> post-8, else page 1 with pre-fill).
      - Unit tests cover debounced write behavior, checkpoint-never-regresses on back navigation, and resume routing for each checkpoint state.
    notes: ""

  - id: 2.3
    title: Wire OnboardingStack pages 1-4 with wizard chrome and progress hooks
    agent: frontenddeveloper
    done: false
    depends_on: [2.1, 2.2]
    acceptance_criteria:
      - `OnboardingStack` mounts `Page01WelcomeScreen`, `Page02EmailScreen`, `Page03ConfirmCodeScreen`, `Page04GetStartedScreen` as concrete screens replacing the phase-1 placeholders.
      - Pages 1-4 hide the wizard progress bar per §6.3 (they use `<WizardHeader hideProgress />` or omit `WizardProgress`).
      - Native-stack back gesture and hardware back button navigate one page backwards on Android; native swipe-back works on iOS (per phase-1 skeleton).
      - Every user-facing string on pages 1-4 is a `labels.<key>` reference; the labels-parity test still passes after this phase's key additions.
    notes: ""

  - id: 2.4
    title: Page 1 - Welcome screen with language toggle sheet
    agent: frontenddeveloper
    done: false
    depends_on: [2.3]
    acceptance_criteria:
      - `Page01WelcomeScreen` renders `images.onboarding.background`, `images.onboarding.logo`, the title "Knotify" (no tagline), and two buttons labeled "Continue with email" and "Continue with Google" from the labels registry.
      - Tapping the top-left globe icon opens a `BottomSheet` listing `en` and `ur`; selecting one calls `LanguageProvider.setLocale`, which surfaces the RTL-reload modal per §17.26 when switching to/from `ur`.
      - "Continue with email" navigates to `Page02EmailScreen`.
      - "Continue with Google" is tappable but no-op (no navigation, no throw, no side effect).
      - Screen wiring test asserts correct label rendering under both locales, language-sheet dispatch of `setLocale`, and email-button navigation.
    notes: ""

  - id: 2.5
    title: Page 2 - Email input + Cognito signUp
    agent: frontenddeveloper
    done: false
    depends_on: [2.3]
    acceptance_criteria:
      - `Page02EmailScreen` uses catalog `TextInput` with `keyboardType='email-address'` and `autoCapitalize='none'`.
      - Continue is disabled until the email matches RFC-5322 shape validated by `Helper/validationHelper.ts → isValidEmail`.
      - On Continue, the screen calls `cognitoClient.signUp({ email })`; success stores the email in the onboarding draft and advances to `Page03ConfirmCodeScreen`; failure renders an inline error via `Helper/errorHelper.ts` label mapping.
      - The `aws-amplify` Auth surface is mocked in tests via a jest module mock; `services/api/mocks/handlers.ts` remains unchanged for this story (Cognito is not REST).
      - Screen wiring test covers disabled-until-valid, signUp success navigation, and signUp failure inline error.
    notes: ""

  - id: 2.6
    title: Page 3 - Confirm email code + Cognito confirmSignUp
    agent: frontenddeveloper
    done: false
    depends_on: [2.5]
    acceptance_criteria:
      - `Page03ConfirmCodeScreen` renders a 6-digit code input using catalog `TextInput` with `keyboardType='number-pad'` and `maxLength=6`.
      - Continue is enabled only when exactly 6 digits are entered.
      - On Continue, the screen calls `cognitoClient.confirmSignUp({ email, code })`; success advances to `Page04GetStartedScreen`; failure surfaces an inline error via labels.
      - No countdown timer is rendered (per §11.2.1 row 3).
      - Screen wiring test covers 6-digit gating, confirmSignUp success navigation, and confirmSignUp failure inline error.
    notes: ""

  - id: 2.7
    title: Page 4 - Get started
    agent: frontenddeveloper
    done: false
    depends_on: [2.3]
    acceptance_criteria:
      - `Page04GetStartedScreen` renders `images.onboarding.banner` centrally aligned and a `Get started` button enabled by default.
      - On tap the screen navigates to `Page05SexScreen` (route already registered by phase 1); no checkpoint is advanced (first checkpoint is page 8, delivered in phase 3).
      - Screen wiring test covers banner + button rendering and tap navigation.
    notes: ""
