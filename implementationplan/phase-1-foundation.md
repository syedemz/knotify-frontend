phase: 1
title: Foundation & scaffolding
last_updated: 2026-07-20

context_summary: |
  Phase 1 stands up every foundation the rest of the project builds on: Expo/RN/TypeScript project scaffold, `src/theme/` copied verbatim from `theme.md §14`, the catalog components starter set from §2a.7 with tests, central registries under `src/config/`, the I/O boundary under `src/services/`, cross-cutting state under `src/state/`, English + Urdu labels with parity, navigation skeleton with auth-gate, and minimal CI. After phase 1 the app boots on Android, renders a placeholder Login screen through the auth-gate, and every PR into `development` runs jest + eslint + tsc + labels-parity in GitHub Actions. Phase 2 lands the onboarding wizard shell and pages 1-4 on top of this scaffold.

stories:
  - id: 1.1
    title: Bootstrap Expo/RN/TS project with theme, typography, and font loading
    agent: frontenddeveloper
    tracking_issue: 1
    done: false
    depends_on: []
    acceptance_criteria:
      - Project is scaffolded via `npx create-expo-app@latest . --template blank-typescript` on Expo SDK 56; `package.json` versions match `architecture.md §16.1` (Expo `~56.0.x`, RN `0.85.x`, React `19.2.x`, TS `~6.0.3`). Node runtime `>= 20.19.4`.
      - Running `npm install && npx expo start` on a fresh clone launches the Metro bundler without errors on Android.
      - `tsconfig.json` sets `strict`, `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`, `noImplicitReturns` all `true`; `@/*` path alias points to `./src/*`.
      - `babel.config.js` includes `babel-plugin-module-resolver` mapping `@` -> `./src`; `jest.config.js` mirrors the same alias via `moduleNameMapper` and sets `coverageThreshold: { global: { lines: 80, branches: 75, functions: 80, statements: 80 } }` per §12.1.
      - `src/theme/theme.ts`, `src/theme/typography.ts`, `src/theme/ThemeProvider.tsx`, `src/theme/commonStyles.ts`, `src/theme/index.ts` are copied verbatim from `theme.md §14` and compile under strict TS.
      - The following font files are already present in the repo at `src/assets/fonts/` (placed by the user): `NotoNastaliqUrdu-Regular.ttf`, `NotoNastaliqUrdu-Medium.ttf`, `NotoNastaliqUrdu-SemiBold.ttf`, `NotoNastaliqUrdu-Bold.ttf`, and `LICENSE-NotoNastaliqUrdu.txt` (SIL Open Font License). The story assumes these files exist; startup MUST fail with a readable error message if any are missing rather than silently falling back.
      - `App.tsx` mounts `ThemeProvider` and blocks initial render until Plus Jakarta Sans (all weights per `theme.md §5.4`) and all four Noto Nastaliq Urdu weights are loaded via `expo-font`.
      - `theme.md §5.4` font registry is extended with an `urdu` family entry mapping to the four Noto Nastaliq Urdu weights; a `useLocalizedFontFamily()` hook returns `plusJakarta` when locale is `en` and `urdu` when locale is `ur`, consumed by catalog `Text` / `Heading` in stories 1.4-1.6.
      - No hex literals appear anywhere in `src/theme/*` other than inside `theme.ts` (single source of truth).
    notes: "Urdu font: Noto Nastaliq Urdu (§17.22 resolved 2026-07-19). SDK bumped to 56 on 2026-07-20 per §16."

  - id: 1.2
    title: Scaffold central registries under src/config/
    agent: frontenddeveloper
    tracking_issue: 2
    done: false
    depends_on: []
    acceptance_criteria:
      - `src/config/env.ts` reads `EXPO_PUBLIC_ENV` (defaulting to `dev`), loads the corresponding `backendConfig.<env>.json`, validates required fields at import time, and exports a typed `env` object; missing values throw a readable startup error listing them.
      - `src/config/backendConfig.dev.json` and `.prod.json` mirror the shape of `knotify-backend/backend-config.json` trimmed to frontend-consumed fields; unresolved placeholders remain `<FILL_...>` verbatim.
      - `src/config/images.ts` exports the `images.onboarding` registry per §5.2 with keys `background`, `banner`, `logo`, `genderMale`, `genderFemale`; the five source PNGs are moved from the project-root `templateimages/` folder (`backgr.png`, `banner.png`, `Logo.png`, `male.png`, `female.png`) to `src/assets/images/onboarding/`, and the empty `templateimages/` folder at the project root is deleted after migration.
      - `src/config/countries.ts` exports a typed `CountryEntry[]` migrated from the workspace-root file `C:\Users\syede\Claude-Master\muzzscreenshots\countrycodes.js` (which lives one level above the project root; it is a development-time reference asset, not part of the project) with name + dial code + ISO2.
      - `src/config/options/` contains one JSON file per list named in §5 (religion, islamicSubsect, professionalCategory, employmentType, salaryRange, educationLevel, kashmirDistricts, yesNo, maritalStatus, gender, religiousLevel, marriageTime, relation) plus a typed `index.ts` loader exposing `options.<field>`.
      - A jest test verifies every options JSON file parses and every registry entry in `index.ts` resolves.
    notes: ""

  - id: 1.3
    title: Scaffold labels/ with English + Urdu parity and typed t() resolver
    agent: frontenddeveloper
    tracking_issue: 3
    done: false
    depends_on: []
    acceptance_criteria:
      - `src/labels/labels.en.json` exists with the baseline key set required by the placeholder screens shipped in this phase. Baseline keys include `common.notImplemented`, `common.loading`, `common.error`, `common.retry`, `auth.login.title`, `auth.forgotPassword.title`, `auth.resetPassword.title`. Additional keys are added by later phases as needed (each new key must ship with an Urdu translation in the same PR to keep parity green).
      - `src/labels/labels.ur.json` has identical keys to `labels.en.json` (initial values may be translation drafts).
      - `src/labels/labels.types.ts` derives a `LabelKey` union from `labels.en.json` so `t('missing.key')` is a compile error.
      - `src/labels/index.ts` exports `t(key: LabelKey): string` that reads the active locale from `LanguageProvider` and falls back to English if the Urdu translation is missing at runtime.
      - A jest test enforces parity: every key in `labels.en.json` exists in `labels.ur.json` and vice versa; the test fails on any drift.
    notes: ""

  - id: 1.4
    title: Catalog - layout, typography, buttons
    agent: frontenddeveloper
    tracking_issue: 4
    done: false
    depends_on: [1.1]
    acceptance_criteria:
      - Components exist under `src/components/`: `Screen`, `Box`, `Row`, `Column`, `Spacer`, `Divider`, `Text`, `Heading`, `Button`, `IconButton`, `PillButton`, `TouchableArea`, `Chip`.
      - Every configurable-appearance prop uses a theme-token-key type per §2a.3 (`SpacingKey`, `RadiusKey`, `TextColor`, `BgColor`, etc.); no raw numbers, no hex literals, no `style` prop.
      - `Text` and `Heading` consume `useLocalizedFontFamily()` (from story 1.1) and default their font family accordingly - Plus Jakarta Sans when locale is `en`, Noto Nastaliq Urdu when locale is `ur`. Consumers never pass `fontFamily` explicitly.
      - Every component has a TSDoc block on its exported prop shape with documented defaults.
      - Every component has `__tests__/components/<Name>.test.tsx` covering variants, disabled and loading states where applicable, `accessibilityLabel`, `onPress` handlers, and both light and dark theme.
      - `src/components/index.ts` re-exports every component in this group.
    notes: ""

  - id: 1.5
    title: Catalog - inputs
    agent: frontenddeveloper
    tracking_issue: 5
    done: false
    depends_on: [1.1]
    acceptance_criteria:
      - Components exist under `src/components/`: `TextInput`, `PasswordInput`, `SearchInput`, `FormField`, `Select`, `Slider`, `Switch`, `Checkbox`, `RadioGroup`, `DatePicker`.
      - `DatePicker` wraps `@react-native-community/datetimepicker` and renders correctly on Android (dialog) and iOS (inline wheel); it exposes a uniform `<DatePicker value={iso} onChange={setIso} min max />` API.
      - Every component uses theme-token props per §2a.3; no raw values, no `style` passthrough.
      - Every component has a TSDoc block and `__tests__/components/<Name>.test.tsx` covering value/onChange, error states, disabled state, and both themes.
      - `src/components/index.ts` re-exports every component in this group.
    notes: ""

  - id: 1.6
    title: Catalog - containers, state UI, overlays, media
    agent: frontenddeveloper
    tracking_issue: 6
    done: false
    depends_on: [1.1]
    acceptance_criteria:
      - Components exist under `src/components/`: `Card`, `Section`, `ListRow`, `ListRowSelectable`, `EmptyState`, `LoadingState`, `ErrorState`, `Modal`, `BottomSheet`, `Toast`, `Snackbar`, `Avatar`, `Image`, `Icon`, `Badge`, `NotificationDot`, `Illustration`.
      - `Image` wraps `expo-image`; `Icon` wraps `lucide-react-native`; `BottomSheet` wraps `@gorhom/bottom-sheet`.
      - Every component uses theme-token props per §2a.3; no `style` passthrough.
      - Every component has a TSDoc block and `__tests__/components/<Name>.test.tsx` covering variants, `accessibilityLabel`, and both themes.
      - `src/components/index.ts` re-exports every component in this group.
    notes: "Chat components (ChatBubble, MessageInput, TypingIndicator, ReadReceipt, RoomListRow) and wizard chrome (WizardHeader, WizardProgress, WizardFooter) are built by the phases that first consume them (chat and phase 2 B1 respectively) per the rule-of-one. They are not required by phase 1."

  - id: 1.7
    title: Scaffold services/ I/O boundary
    agent: frontenddeveloper
    tracking_issue: 7
    done: false
    depends_on: [1.2]
    acceptance_criteria:
      - `src/services/api/httpClient.ts` implements the `request<T>` contract from §8.2 - base URL from `config/env.ts`, JWT injection, configurable timeout, one silent-refresh on 401 then retry, typed `ApiError` on non-2xx.
      - `src/services/api/errors.ts` exports the `ApiError` class and error-normalization helpers per §8.2.
      - `src/services/api/mocks/handlers.ts` initializes MSW with an empty handler array; `App.tsx` starts MSW when `EXPO_PUBLIC_API_MODE === 'mock'`. Endpoint-specific handlers are added by later phases.
      - `src/services/auth/cognitoClient.ts` wraps `aws-amplify` Auth exposing `signUp`, `confirmSignUp`, `signIn`, `signOut`, `refreshSession`; no feature imports `aws-amplify` directly.
      - `src/services/auth/secureStorage.ts` wraps `expo-secure-store` with typed get/set/delete for auth-token keys and the `onboardingDraft` key.
      - `src/services/push/expoPush.ts` exports a `registerForPushNotifications()` helper that requests permission, obtains the Expo push token, and POSTs to `/v1/push-tokens`; the settings phase wires it into UI.
      - `src/services/graphql/appsyncClient.ts` exists as a skeleton exporting a `getAppsyncClient()` factory consumed by the chat phase.
      - Unit tests cover httpClient's 401-refresh-then-retry path, 5xx propagation, and timeout path using MSW-registered handlers.
    notes: ""

  - id: 1.8
    title: Scaffold state/ providers (Auth, Query, Language)
    agent: frontenddeveloper
    tracking_issue: 8
    done: false
    depends_on: [1.3, 1.7]
    acceptance_criteria:
      - `src/state/auth/AuthProvider.tsx` exposes `useAuth()` returning `{ status, session, profileComplete, signIn, signOut, refresh }` per §7.2; on mount, silently swaps an existing refresh token for an access token before children render.
      - `AuthProvider` clears the TanStack Query cache on `signOut()`.
      - `src/state/query/QueryProvider.tsx` mounts a `QueryClient` with default `staleTime` and `retry` settings per §7.3.
      - `src/state/i18n/LanguageProvider.tsx` exposes `{ locale, setLocale }`, persists the choice to AsyncStorage under `app.locale`, and defaults to device locale if `en` or `ur` else `en`.
      - `expo-updates` is installed via `npx expo install expo-updates` and configured.
      - `setLocale(locale)` implements the confirm-then-reload flow per §17.26 using React Native's built-in `Alert.alert()` (no catalog Modal dependency): title / body from labels, buttons Cancel + Restart; on Restart call `I18nManager.forceRTL(nextIsRTL)` then `Updates.reloadAsync()`; Cancel is a no-op that leaves the persisted locale untouched.
      - Unit tests cover the confirm-accept path (forceRTL + reloadAsync called in order), the confirm-cancel path (neither called, locale unchanged), and the same-locale early-return (no Alert shown).
      - `App.tsx` composes providers in the order fonts -> ThemeProvider -> LanguageProvider -> QueryProvider -> AuthProvider -> RootNavigator.
      - Unit tests cover AuthProvider silent-refresh happy path, silent-refresh failure fallthrough to unauthenticated, and signOut clearing the query cache.
    notes: ""

  - id: 1.9
    title: Scaffold navigation/ skeleton with auth-gate
    agent: frontenddeveloper
    tracking_issue: 9
    done: false
    depends_on: [1.4, 1.8]
    acceptance_criteria:
      - `src/navigation/RootNavigator.tsx` reads `useAuth()` and renders one of loading splash, `AuthStack`, `OnboardingStack`, or `AppTabs` per §6.2.
      - `src/navigation/AuthStack.tsx` registers routes `Login`, `ForgotPassword`, `ResetPassword`; screens may be placeholders that render a "Not implemented yet" catalog `EmptyState`.
      - `src/navigation/OnboardingStack.tsx` registers routes `Page01` through `Page31` with placeholder screens; the wizard shell and real screens land in later onboarding phases.
      - `src/navigation/AppTabs.tsx` registers Discover / Requests / Chat / Menu tabs with placeholder screens.
      - `src/navigation/linking.ts` exports a valid empty linking config; the file compiles and does not throw when RootNavigator mounts.
      - `src/navigation/types.ts` declares `ParamList` types for every navigator; every `useNavigation` and `useRoute` call in the codebase uses these types.
      - `__tests__/navigation/auth-gate.test.tsx` asserts: (a) when `useAuth().status === 'unauthenticated'`, `RootNavigator` renders `AuthStack` (verified by `queryByText(t('auth.login.title'))` returning a node); (b) `queryByText` for any known `AppTabs`-only label (e.g., the Discover tab label placeholder) returns `null`; (c) analogous checks for the `authenticated` + incomplete-profile case (renders `OnboardingStack`) and the `authenticated` + complete-profile case (renders `AppTabs`).
    notes: ""

  - id: 1.10
    title: Minimal CI on GitHub Actions
    agent: backenddeveloper
    tracking_issue: 10
    done: false
    depends_on: [1.1, 1.3]
    acceptance_criteria:
      - `.github/workflows/ci.yml` runs on every pull request targeting `development` and `main`.
      - The workflow executes `npm ci`, `npx tsc --noEmit`, `npx eslint src __tests__`, `npx jest --coverage`, and the labels-parity test.
      - The workflow fails the PR check on any non-zero exit code.
      - Coverage thresholds from §12.1 (`lines 80 / branches 75 / functions 80 / statements 80`) are enforced by `jest.config.js` and the CI job surfaces the failure in the check output.
      - `cicd.md` is updated with the workflow file path, the four commands the job runs, and the coverage thresholds.
    notes: ""
