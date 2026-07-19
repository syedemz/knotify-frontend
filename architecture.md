# knotify-frontend — Architecture

> **Status:** Grounded architecture guide, written before implementation begins. All facts about the repository, backend, screenshots, and reference project below have been verified against the file system as of 2026-07-17. Recommendations that are not yet decided are explicitly labelled **[Recommendation]**, **[Assumption]**, or **[Open]**.
>
> **Authority:** This document must be read by any coding agent before writing frontend code.
>
> Rulebook precedence (highest first):
> 1. **Direct user instructions recorded in this file** (e.g. §2a — Component-first UI mandate). These reflect explicit decisions the user has made for this project and **override** anything below.
> 2. **`codingprinciples.md`** and **`theme.md`** for topics not addressed in (1) — style values, TypeScript strictness, testing, TSDoc, folder conventions, colors / spacing / radii / typography tokens.
> 3. **This document's recommendations** (labelled `[Recommendation]`) for architecture-level choices not yet decided.
> 4. Generic React Native "best practices" and the `frontend-design` skill's defaults — lowest priority; never override the above.
>
> Where `codingprinciples.md` and this document appear to conflict on component-catalog policy specifically, this document wins — see §2a. Those sections of `codingprinciples.md` are marked for revision so all three files agree.

---

## 1. Project overview

**What the app is.** knotify is a matrimonial / dating mobile application aimed at Muslim singles seeking marriage and community. The frontend is a cross-platform mobile app that talks to an already-designed AWS backend (repo: `knotify-backend`).

**Feature scope (v1, minimum):**

- Sign-up (multi-step onboarding flow — 40 screens across screenshots 1–40)
- Login (Cognito SRP)
- Profile creation and profile editing (large form; ~34 required fields per `db-schema.json`)
- Viewing profiles of the opposite sex (the deck / feed / search)
- Bookmarking profiles
- Matching (server-side ranked deck with hard filters + preference vector — frontend consumes only)
- Sending friend requests
- Receiving friend requests
- Accepting friend requests
- Declining friend requests
- Cancelling outgoing friend requests
- One-to-one chat / messaging (AppSync GraphQL + realtime subscriptions)
- Blocking a user
- Unfriending / removing a friend
- Push-notification registration (Expo push tokens)
- Account deletion (async with polled execution status)

**Platform scope.**

- **Android** — first-class. Testing starts here because Android Studio is already installed on the developer machine.
- **iOS** — first-class. The architecture MUST NOT be Android-specific. Any code that reads platform (`Platform.OS`) must handle both branches; any dependency chosen must have documented iOS support.

**Non-goals (v1).**

- Web build via `react-native-web` — not required.
- Photo uploads — the backend photo-upload block is marked `phase12Placeholder: true` in `backend-config.json`. The frontend will render placeholder avatars and defer real upload UI until the backend is ready.
- Voice / video calling.
- Group chats — `backend-config.json → appsync.operations` only defines 1-to-1 room primitives (`createOrGetRoom(userId)`).
- Payments / premium — theme system has a `bg.premium` role and §9.15 pattern reserved for a future paid tier; no v1 flow exists.
- Web-based hosted UI for Cognito — `hostedUi: null` in backend-config.

---

## 2. Architecture goals

Listed in priority order. When two goals collide, the earlier one wins.

1. **Adherence to project rulebooks.** `codingprinciples.md` (16 KB) and `theme.md` (47 KB) are the single sources of truth for how code is written and how UI is styled. Implementation phases must not silently violate them.
2. **Cross-platform parity.** Android and iOS are equal targets. No "iOS later" concessions in the code.
3. **Component-first UI, no exceptions.** Every UI element — every button, every input, every card, every icon-in-a-circle, every label pill, every avatar, every divider, every screen container — is a reusable component in `src/components/` from **the first time it is used** (rule of one, not rule of two or three). Screens are pure composition — they wire props and hand off, they do not lay out primitives. See §2a for the full mandate.
4. **Centralized configuration.** One file for backend URLs and env-specific values. Placeholder values today; real values later without touching any consumer.
5. **Screenshot fidelity, phased.** Sign-up UI is delivered in batches of 4 screenshots per phase, each batch fully reviewed before the next starts.
6. **Backend independence during development.** The dev backend is currently torn down. The frontend must be productively buildable and runnable against a mock API layer whose contract matches the real endpoints.
7. **Type safety.** Strict TypeScript everywhere (`"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitReturns": true`). No `any`. No `!` non-null assertions unless justified inline.
8. **Testability.** Every catalog component, every helper, and every screen gets automated tests per `codingprinciples.md → Testing principles`.
9. **Maintainability over cleverness.** Feature-first folder structure. Small single-purpose files. Explicit imports through `@/` alias.
10. **Extensibility without over-engineering.** Structure supports the features listed in §1 and the obvious near-future ones (photo upload, moderation reporting) without pre-building for hypothetical features.

---

---

## 2a. Component-first UI mandate (NON-NEGOTIABLE)

This is the strongest rule in this project and it **overrides** the "rule of two", the "closed prop surface", and the "composition through children, not config" rules currently written in `codingprinciples.md → Component Catalog`. Those sections of `codingprinciples.md` are flagged for revision. Until they are revised, the rules below win.

### 2a.1 The mandate

1. **Every UI element is a reusable component under `src/components/` from its first use.** Not on the second occurrence, not on the third. On the first. There is no "inline it for now and extract later" phase.
2. **Screens never render `react-native` primitives directly for anything the user can see or touch.** No `<View>` as a card, no `<Text>` as a heading, no `<Pressable>` as a button, no `<TextInput>` as an input, no `<Image>` as an avatar. Screens compose components; they do not lay out primitives. (A `<View>` used purely as a non-visual flex container inside a screen's own layout is the only exception, and even that must not carry visual styling — background color, borders, padding-that-implies-visual-spacing, radii, shadows — all of that belongs in a component.)
3. **Components accept configurable appearance props.** Color, size, spacing (margin / padding on any side), radius, background, weight, alignment, and any visual dimension a designer can vary — every one is a prop. Defaults are documented in TSDoc. Screens pass whatever variation the design calls for.
4. **Configurable props are theme-token-keyed, not raw values.** This is the guardrail that keeps the "one place to change a hex" invariant from `theme.md` alive under the more permissive component API. See §2a.3 for the exact type-shape rule.
5. **The catalog is open-ended, not closed.** Whatever the design needs, add a component for it. No approval process, no "demonstrate a 2-screen need". First use → new component.

### 2a.2 What "component-first" looks like in practice

A screen file after this rule is applied contains only three kinds of JSX:

- Components imported from `@/components/*`.
- Feature-local components imported from the same feature folder (`../components/`).
- Structural `<View>` / `<Fragment>` for pure flex layout — carrying **no** visual styling of any kind (no `backgroundColor`, no `borderRadius`, no `padding` that implies a card, no `borderWidth`). Layout-only spacing (`gap`, `justifyContent`, `alignItems`, `flexDirection`, `flex`) is permitted; anything that draws pixels is not.

If a screen would otherwise write `<View style={{ backgroundColor, padding, borderRadius }}>`, that `<View>` becomes a component. If a screen would otherwise write `<Text style={{ fontSize, fontWeight, color }}>`, that `<Text>` becomes a component. There is no "just this once".

### 2a.3 Configurable-appearance prop shape (type-safe token keys)

Every visual prop is typed as a **key of the corresponding theme token map**, not as a raw string / number. This is what reconciles "configurable per instance" with "one place to change a value" — the raw values still live in `src/theme/`, and the prop just says which one to pick.

```ts
import type { Theme } from '@/theme/theme';

type SpacingKey  = keyof Theme['spacing'];     // 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | 'huge' | 'giant'
type RadiusKey   = keyof Theme['radii'];       // 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'pill'
type TextColor   = keyof Theme['colors']['text'];      // 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'brand' | 'premium'
type BgColor     = keyof Theme['colors']['bg'];        // 'primary' | 'surface' | 'elevated' | 'input' | 'muted' | 'premium'
type AccentColor = keyof Theme['colors']['accent'];    // 'primary' | 'primaryDisabled' | 'secondary' | 'secondaryDisabled' | 'tertiary'
type BorderColor = keyof Theme['colors']['border'];    // 'default' | 'strong'
type TextVariant = 'display.lg' | 'display.md' | 'heading.xl' | 'heading.lg' | 'heading.md' | 'heading.sm' | 'body.lg' | 'body.md' | 'body.sm' | 'label.lg' | 'label.md' | 'label.sm' | 'caption';
type ShadowKey   = keyof Theme['shadows'];     // 'none' | 'sm' | 'md' | 'lg'

interface BoxProps {
  bg?: BgColor;
  padding?: SpacingKey;
  paddingX?: SpacingKey;
  paddingY?: SpacingKey;
  paddingTop?: SpacingKey;
  paddingBottom?: SpacingKey;
  paddingLeft?: SpacingKey;
  paddingRight?: SpacingKey;
  margin?: SpacingKey;
  marginX?: SpacingKey;
  marginY?: SpacingKey;
  marginTop?: SpacingKey;
  marginBottom?: SpacingKey;
  marginLeft?: SpacingKey;
  marginRight?: SpacingKey;
  radius?: RadiusKey;
  border?: BorderColor;
  shadow?: ShadowKey;
  children?: React.ReactNode;
}

interface TextProps {
  variant?: TextVariant;                       // maps to textStyles.<variant>
  color?: TextColor;                           // maps to theme.colors.text.<color>
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  // No `style` prop. Appearance is entirely covered by the props above.
}
```

Rules that must hold on every configurable prop:

- **String-literal unions, never `string`.** `variant?: 'primary' | 'secondary' | 'ghost'`, not `variant?: string`.
- **Theme-key types, never raw literals.** `padding?: SpacingKey`, never `padding?: number`.
- **No `style` / `containerStyle` / `textStyle` prop of `StyleProp<ViewStyle>`.** This is the one part of `codingprinciples.md → Component Catalog Rule 2` that survives — because a `style` prop would let raw hex / raw pixel values back in. Everything else in Rule 2 is superseded.
- **Sensible defaults documented in TSDoc.** Every optional prop has an explicit default. Defaults are chosen so a component with no props renders correctly against the reference screenshots.
- **Prop names are visual, not implementation-y.** `paddingX` (visual), not `horizontalPadding` (verbose). `bg` (visual), not `backgroundColorRole`.
- **Numeric-scale props (`size`, weights) are string-literal unions**, e.g. `size?: 'sm' | 'md' | 'lg'`, and internally map to concrete spacing / typography tokens. This preserves the theme's single-source-of-truth for pixel values.

### 2a.4 Screen authoring rule

A screen file **must** pass this smell test:

- Grep the screen for `StyleSheet.create(` → **zero hits**. A screen has no local styles because it has no visual styling to declare — everything visual is a component prop.
- Grep the screen for imports from `'react-native'` → limited to `View` (structural layout only, no visual styling), and possibly `FlatList`, `ScrollView`, `KeyboardAvoidingView`, `Platform`. **No `Pressable`, `TouchableOpacity`, `TouchableHighlight`, `Text`, `TextInput`, `Image`, `Switch`, `Modal`** — those are all covered by catalog components.
- Grep the screen for hex literals (`#[0-9a-fA-F]`) → **zero hits**.
- Grep the screen for style objects with visual properties (`backgroundColor`, `borderRadius`, `borderWidth`, `padding`, `fontSize`, `fontWeight`, `shadow`) → **zero hits**. Layout-only (`flexDirection`, `justifyContent`, `alignItems`, `gap`, `flex`) is permitted on structural `<View>`s only, and even those should prefer a component wrapper when the same layout recurs.

ESLint enforces the `no-restricted-imports` rule scoped to `src/features/*/screens/**` and `src/screens/**` (if a top-level screens folder exists). See §2a.6 for the enforcement list.

### 2a.5 Growing the catalog

Additions are cheap by design. When the design calls for a UI element that doesn't exist in `src/components/`:

1. Create the component immediately. First use is enough. No approval, no "extract later".
2. Give it a closed API of configurable-appearance props per §2a.3.
3. Write its TSDoc block and its test file (`__tests__/components/<Name>.test.tsx`) in the same PR.
4. Add or update its entry in `theme.md §9` annotated as `"Implemented as <ComponentName>"`.
5. Export it from `src/components/index.ts`.

There is no minimum-screens threshold, no reuse threshold, no "wait and see". Build it and move on.

**No `style` prop, ever.** If a component genuinely needs a variant its current props can't express, add a prop for it. Never a passthrough `style`.

### 2a.6 ESLint enforcement

The following rules must ship in `.eslintrc.js` from phase 1 onwards.

- `no-restricted-imports` scoped to `src/features/*/screens/**`:
  - Block from `react-native`: `Pressable`, `TouchableOpacity`, `TouchableHighlight`, `TouchableWithoutFeedback`, `Text`, `TextInput`, `Image`, `Switch`, `Modal`, `Button`.
- A custom lint rule (or CI grep check) rejects screen files containing:
  - `StyleSheet.create(`
  - String literals matching `/#[0-9a-fA-F]{3,8}/`
  - Style-object keys `backgroundColor`, `borderRadius`, `borderWidth`, `fontSize`, `fontWeight` (except inside `src/components/**` and `src/theme/**`).
- `eslint-plugin-tsdoc` continues to enforce TSDoc on every exported component prop shape.

### 2a.7 Catalog inventory (starting set, expected to grow)

The starter catalog for phase 1 is derived from what the sign-up screenshots require and what the app's features (§11) need. This list is **not fixed** — new components join whenever a screen needs them.

Baseline catalog:

- **Layout / primitives**: `Screen`, `Box`, `Row`, `Column`, `Spacer`, `Divider`
- **Typography**: `Text` (accepts `variant`, `color`, `align`), `Heading` (thin wrapper picking heading variants)
- **Buttons / touch**: `Button`, `IconButton`, `PillButton`, `TouchableArea`, `Chip` (both tappable and non-tappable via a `pressable` prop or two separate components — decided at first use)
- **Inputs**: `TextInput`, `PasswordInput`, `SearchInput`, `FormField`, `Select`, `Slider`, `Switch`, `Checkbox`, `RadioGroup`, `DatePicker`
- **Containers**: `Card` (variants), `Section`, `ListRow`, `ListRowSelectable`, `EmptyState`, `LoadingState`, `ErrorState`
- **Overlays**: `Modal`, `BottomSheet`, `Toast`, `Snackbar`
- **Media / display**: `Avatar`, `Image` (wrapped `expo-image`), `Icon` (wrapped `lucide-react-native`), `Badge`, `NotificationDot`, `Illustration`
- **Chat**: `ChatBubble`, `MessageInput`, `TypingIndicator`, `ReadReceipt`, `RoomListRow`
- **Onboarding wizard**: `WizardHeader`, `WizardProgress`, `WizardFooter` (Next / Back buttons + progress indicator)

None of these is optional or "add when needed" — they map to concrete screens in this project. New components arrive as new screens introduce new patterns.

### 2a.8 How this reconciles with `theme.md`

`theme.md` describes visual patterns; §2a describes how those patterns are packaged for reuse.

- `theme.md §9 Component Patterns` continues to define the **look** of each pattern (primary button = pink fill, pill radius, white label). §2a says the same pattern is **encapsulated in a component** with a prop surface.
- `theme.md §15` (canonical `createStyles(theme)` factory) applies **inside each component**, not inside screens. Screens don't call `createStyles`; components do.
- `theme.md §14` token files (`theme.ts`, `typography.ts`) remain the single source of truth for raw values. Configurable props reference **keys** of those maps.

Anywhere `theme.md` says "the agent MUST" about token values or aesthetics, it still stands. Anywhere `codingprinciples.md → Component Catalog` says "rule of two" / "closed API without configurability" / "composition through children, not config" — §2a wins.

---

## 3. Constraints and assumptions

### 3.1 Non-negotiable constraints

| Constraint | Source | Notes |
| --- | --- | --- |
| React Native + Expo + TypeScript | User instruction | No bare-workflow escape hatch unless a required library forces it (none currently do). |
| Android + iOS both | User instruction | See §12.2 for how cross-platform is enforced. |
| Only libraries listed in `theme.md §1` | `theme.md §0.1` | New dependencies require explicit user approval. |
| No inline style objects | `theme.md §0.3`, `codingprinciples.md → Styling` | All values in `StyleSheet.create` via `createStyles(theme)` factory. |
| Colors, fonts, spacing, radii come from `src/theme/` | `theme.md §2` | No hex or numeric literals in components. |
| Labels in `src/labels/labels.json` | `codingprinciples.md → Labels and i18n` | No user-facing string literals in components. |
| Reusable components in `src/components/` — open catalog, rule-of-one | **§2a of this document** (overrides `codingprinciples.md → Component Catalog` on catalog policy) | Every UI element is a component from first use. Screens forbidden from importing visual `react-native` primitives (see §2a.6). ESLint-enforced. Configurable-appearance props are theme-token-keyed (see §2a.3). |
| Functional components only | `codingprinciples.md → Component style` | No class components. |
| TSDoc on every exported symbol | `codingprinciples.md → Documentation comments` | Enforced by `eslint-plugin-tsdoc`. |
| Async I/O uses `async/await` | `codingprinciples.md → Asynchronous data and I/O` | No `.then()` chains; three-state modeling (loading/ready/error). |

### 3.2 Backend state assumptions

Verified from `C:\Users\syede\Claude-Master\knotify-backend\backend-config.json` and `db-schema.json`.

- Two environments planned: `dev`, `prod`.
- **CI/CD** exists for the backend and has been tested on `dev`. **Not** yet tested on `prod` (cost-saving).
- **`dev` backend is currently torn down.** It will be brought back up when the frontend is ready for sign-up + landing testing.
- All URL fields in `backend-config.json` are **placeholders** of the form `<FILL_...>`. The frontend must be able to build, boot, and drive its mock layer without any real URL being resolved.
- Client must always hit the CloudFront URL, not the raw API Gateway URL. CloudFront injects the `x-knotify-edge-secret` header; the frontend does not send it.
- Cognito authentication is native SRP via `aws-amplify`. No hosted UI. No Cognito Identity Pool — the frontend never talks to AWS SDKs directly.
- Chat uses AppSync GraphQL with realtime subscriptions. The Authorization header carries the raw JWT (no `Bearer` prefix, per `backend-config → appsync.auth.notes`).
- Push notifications go through Expo. The frontend registers device tokens at `POST /v1/push-tokens`; the backend fans out to Expo.
- Photo uploads (`media` block) are **`phase12Placeholder: true`** — do not build the upload UI in v1.
- Account deletion is an **async flow with polling**: `DELETE /profile/me` returns an `executionArn`; the client polls `GET /profile/me/deletion-status?executionArn=...` until status ∈ `SUCCEEDED | FAILED | TIMED_OUT`.

### 3.3 Assumptions to make explicit

- **[Resolved — 2026-07-20]** Version pins bumped to Expo SDK 56 baseline: Expo `~56.0.x`, RN `0.85.x`, React `19.2.x`, TypeScript `~6.0.3`, Node `≥ 20.19.4`. See §16 for the full matrix and the `npx expo install` scaffold pattern.
- **[Assumption]** The primary supported locale is English (`en`) in v1. Additional locales are added to `labels.json` keys as needed; components already read `.en` so switching to a runtime resolver later is non-breaking.
- **[Assumption]** The app targets modern Android (API 24+) and iOS 16.4+ (Expo SDK 56 default; §16.1). Concrete OS floors were confirmed at 2026-07-20 alongside the SDK 56 bump.
- **[Assumption]** Session persistence is required. Once the user logs in, the app should silently re-authenticate on next launch using the Cognito refresh token (see §7.2). This differs from `test-project-new`, where the auth context was in-memory only.
- **[Open]** Dark mode: the theme system is fully dark-mode-aware, but reference screenshots are light-mode only. Dark-mode parity is **best-effort** in v1, validated by inspection when reasonable and logged as follow-up when not.

---

## 4. Reference project — how `test-project-new` informs this project

The prior test project at `C:\Users\syede\Claude-Master\test-project-new` was inspected end-to-end. Below is what to reuse, what to adapt, and what to avoid.

### 4.1 Reuse verbatim

- **The 9 components already built in `test-project-new/src/components/`** (`Button`, `IconButton`, `TouchableArea`, `TextInput`, `FormField`, `Chip`, `ChipRow`, `Card`, `Screen`) are a useful **starting point** — copy the file structure and the `createStyles(theme)` factory pattern. But **their prop shapes must be expanded** to match §2a.3 (configurable-appearance props: `bg`, `padding*`, `margin*`, `radius`, `size`, `color`, etc. as theme-token-keyed props). The test project's closed-API prop shape does not meet this project's mandate.
- **The `src/theme/` layout** — `theme.ts`, `typography.ts`, `ThemeProvider.tsx`, `commonStyles.ts`, `index.ts`. Identical files (theme.md is byte-identical between the two projects).
- **The `@/` path alias wiring** — synchronized across `tsconfig.json`, `babel.config.js` (`babel-plugin-module-resolver`), and `jest.config.js` (`moduleNameMapper`). All three must be updated together whenever the alias changes.
- **The `src/Helper/` convention** and rule-of-three extraction threshold from `codingprinciples.md`.
- **The `src/labels/labels.json` structure** — flat keys with `{ en, ... }` per key, referenced as `labels.<key>.en` in components.
- **Jest + React Native Testing Library setup** with `jest-expo` preset. `AsyncStorage` mocked globally in `jest.setup.ts`. Coverage thresholds `lines: 80, branches: 75, functions: 80, statements: 80`.
- **ESLint `no-restricted-imports` rule scoped to screen paths** — reused as a foundation, but the blocklist is widened per §2a.6 (`Text`, `Image`, `Button`, `TouchableHighlight`, `TouchableWithoutFeedback` added). The scope path is updated to `src/features/*/screens/**` to match the feature-first layout.

### 4.2 Adapt for real backend

The test project had no backend and used AsyncStorage as its "user database." For knotify:

- **Replace `Helper/storageHelper.ts` (test project) with `services/api/*` and `services/storage/secureStorage.ts`** — one is the network layer, the other persists auth tokens securely.
- **Add a real HTTP client.** The test project had none. Introduce `services/api/httpClient.ts` (see §7) that reads its base URL from `src/config/env.ts` and injects the Cognito JWT.
- **Add a real GraphQL/subscription client** for AppSync (chat). See §7.5.
- **Add server-state cache.** [Recommendation] TanStack Query (`@tanstack/react-query`) for REST-backed lists and detail views (see §6.2). Not present in the test project because there was no server.
- **Replace in-memory auth context with persisted session.** Cognito refresh tokens live for 30 days (per `backend-config → cognito.tokenValidity.refreshTokenDays`). Persist via `expo-secure-store`.
- **Add label keys for onboarding, matching, chat, requests, blocks, bookmarks** — the test project had only ~45 keys for a two-screen scope.

### 4.3 Avoid

- **Grandfathered "legacy" screens with `eslint-disable no-restricted-imports` directives.** The test project's `LoginScreen`, `RegisterScreen`, `LandingScreen` predate the catalog and carry disables. **New knotify screens do not get this grace period** — all screens use the catalog from day one.
- **In-memory auth state.** The test project resets on app restart. Knotify persists (see §6.3).
- **Plaintext credential storage.** The test project stored passwords in `AsyncStorage`. Knotify never stores passwords — Cognito SRP means passwords never leave the auth flow.
- **Skipping cross-platform verification.** The test project was Android-only. Knotify must run on both from the first screen.

---

## 5. Recommended project structure

The scaffold is created at `/create-plan` or `/implement-phase 1` time; the layout below is what phase 1 targets.

```
knotify-frontend/
├── App.tsx                          # entry — mounts font loader + ThemeProvider + QueryProvider + AuthProvider + navigator root
├── index.ts                         # registerRootComponent
├── app.json                         # Expo config (name, slug, icon, splash, ios/android bundle IDs)
├── babel.config.js                  # babel-plugin-module-resolver for '@/*'
├── metro.config.js                  # (if needed for svg/asset transformers)
├── jest.config.js                   # preset: 'jest-expo', moduleNameMapper for '@/*'
├── jest.setup.ts                    # globally mocks AsyncStorage, expo-secure-store, expo-font
├── tsconfig.json                    # strict; paths: { "@/*": ["./src/*"] }
├── .eslintrc.js                     # eslint-plugin-tsdoc + no-restricted-imports scoped to src/screens
├── .prettierrc
├── package.json
│
├── assets/                          # Expo-level assets (icon.png, splash.png, adaptive-icon.png)
│
├── src/
│   ├── assets/
│   │   ├── fonts/                   # PlusJakartaSans-{Regular,Medium,SemiBold,Bold,ExtraBold}.ttf
│   │   ├── illustrations/           # brand line-art SVGs (theme.md §11)
│   │   ├── icons/                   # non-Lucide icons only (rare)
│   │   └── images/
│   │       └── onboarding/          # backgr.png, banner.png, Logo.png, male.png, female.png
│   │                                # (moved from ./templateimages/ — never referenced by path from screens; see §5.2)
│   │
│   ├── theme/                       # SINGLE SOURCE OF TRUTH for visual tokens (theme.md §14)
│   │   ├── theme.ts                 # lightColors, darkColors, spacing, radii, shadows
│   │   ├── typography.ts            # fontFamily, fontSize, fontWeight, textStyles
│   │   ├── ThemeProvider.tsx        # useTheme(), useThemeControls()
│   │   ├── commonStyles.ts          # createCommonStyles(theme) — layout fragments consumed by components (never by screens)
│   │   └── index.ts                 # re-exports
│   │
│   ├── components/                  # OPEN CATALOG — every UI element is here (§2a)
│   │   │                            # Starter set (grows as screens introduce new patterns; §2a.7):
│   │   ├── Screen.tsx               # SafeArea + page padding wrapper (configurable padding, bg)
│   │   ├── Box.tsx                  # generic visual container: bg, padding*, margin*, radius, border, shadow
│   │   ├── Row.tsx                  # horizontal flex layout with gap
│   │   ├── Column.tsx               # vertical flex layout with gap
│   │   ├── Spacer.tsx               # sized empty space (size: SpacingKey)
│   │   ├── Divider.tsx              # 1px separator (color, marginY)
│   │   ├── Text.tsx                 # variant, color, align
│   │   ├── Heading.tsx              # thin Text wrapper for heading variants
│   │   ├── Button.tsx               # variant, size, fullWidth, disabled, loading, iconLeft/Right
│   │   ├── IconButton.tsx           # 44×44 tap target, configurable icon color/size
│   │   ├── PillButton.tsx           # small pill (chip-like tappable)
│   │   ├── TouchableArea.tsx        # generic tappable container
│   │   ├── Chip.tsx                 # display-only pill (icon + label, configurable color)
│   │   ├── TextInput.tsx            # single- or multi-line, configurable size
│   │   ├── PasswordInput.tsx        # TextInput + reveal toggle
│   │   ├── SearchInput.tsx          # pill-radius input + search icon
│   │   ├── FormField.tsx            # label + input + inline error
│   │   ├── Select.tsx               # dropdown / picker
│   │   ├── Slider.tsx               # range slider (single or dual thumb)
│   │   ├── Switch.tsx               # theme-styled Switch wrapper
│   │   ├── Checkbox.tsx
│   │   ├── RadioGroup.tsx
│   │   ├── DatePicker.tsx
│   │   ├── Card.tsx                 # variant, bg, padding, radius, shadow
│   │   ├── Section.tsx              # titled content block
│   │   ├── ListRow.tsx
│   │   ├── ListRowSelectable.tsx    # with checkbox / radio + selected-state theming
│   │   ├── EmptyState.tsx
│   │   ├── LoadingState.tsx         # skeleton placeholder per theme.md §12
│   │   ├── ErrorState.tsx
│   │   ├── Modal.tsx                # theme-styled modal
│   │   ├── BottomSheet.tsx          # wraps @gorhom/bottom-sheet
│   │   ├── Toast.tsx
│   │   ├── Snackbar.tsx
│   │   ├── Avatar.tsx               # size, ring, placeholder
│   │   ├── Image.tsx                # wrapped expo-image with radius, fit
│   │   ├── Icon.tsx                 # wrapped lucide-react-native (name, size, color)
│   │   ├── Badge.tsx
│   │   ├── NotificationDot.tsx
│   │   ├── Illustration.tsx         # SVG line-art wrapper
│   │   ├── ChatBubble.tsx           # own / other, tail, timestamp
│   │   ├── MessageInput.tsx         # chat composer
│   │   ├── TypingIndicator.tsx
│   │   ├── ReadReceipt.tsx
│   │   ├── RoomListRow.tsx
│   │   ├── WizardHeader.tsx         # progress + back button for onboarding wizard
│   │   ├── WizardProgress.tsx       # 40-step progress indicator
│   │   ├── WizardFooter.tsx         # next / back buttons + hint text
│   │   └── index.ts                 # barrel export
│   │
│   ├── labels/                      # user-facing strings — English + Urdu (see §15.6)
│   │   ├── labels.en.json           # English strings, keyed; required baseline
│   │   ├── labels.ur.json           # Urdu strings, same key shape as labels.en.json
│   │   ├── labels.types.ts          # typed shape (autocomplete for label keys, derived from labels.en.json)
│   │   └── index.ts                 # `t(key)` resolver — reads active locale from LanguageProvider
│   │
│   ├── config/                      # SINGLE SOURCE OF TRUTH for env / URLs / static content
│   │   ├── env.ts                   # reads process.env.EXPO_PUBLIC_* + backendConfig.dev.json / .prod.json
│   │   ├── backendConfig.dev.json   # mirrors backend-config.json shape; dev placeholders
│   │   ├── backendConfig.prod.json  # mirrors backend-config.json shape; prod placeholders
│   │   ├── endpoints.ts             # typed constants derived from env — used by services/api
│   │   ├── images.ts                # central image registry — see §5.2. Screens/components import `images.onboarding.background`, never a require() path.
│   │   ├── countries.ts             # country name + dial code + ISO2 flag code list (migrated from muzzscreenshots/countrycodes.js); typed as CountryEntry[]
│   │   └── options/                 # central selection-options registry — see §5.3
│   │       ├── religion.json        # ['Islam', 'Christianity', 'Hinduism', 'Sikhism', 'Atheism/Agnostic', 'Prefer not to say']
│   │       ├── islamicSubsect.json  # Sunni/Shia/etc. — shown only when religion === 'Islam'; other religions map to 'Not Applicable'
│   │       ├── professionalCategory.json    # 27-entry list (Healthcare, Medicine, ..., Internet)
│   │       ├── employmentType.json          # ['Government', 'Private', 'Self-Business']
│   │       ├── salaryRange.json             # bracket list + 'I would rather not disclose'
│   │       ├── educationLevel.json          # ['Elementary School Level', 'High School (10th)', 'Higher Secondary School (12th)', 'Graduate And Above', 'Medical Doctor / PHD']
│   │       ├── kashmirDistricts.json        # 22 districts; default 'Srinagar'
│   │       ├── yesNo.json                   # ['YES', 'NO']
│   │       ├── maritalStatus.json           # ['Never Married', 'Divorced', 'Widowed']
│   │       ├── gender.json                  # ['Male', 'Female']  (used for sibling gender)
│   │       ├── religiousLevel.json          # 4-tier list (Strictly practicing, Moderately practicing, Not practicing, Prefer not to say) — used for both self and partner
│   │       ├── marriageTime.json            # timeline options for page 20
│   │       ├── relation.json                # ['Myself', 'Son', 'Daughter', 'Sibling', 'Friend', 'Ward']
│   │       └── index.ts                     # typed loader: `options.religion`, `options.professionalCategory`, ...
│   │
│   ├── services/                    # I/O boundary
│   │   ├── api/
│   │   │   ├── httpClient.ts        # fetch wrapper: base URL, auth header, timeout, error mapping
│   │   │   ├── endpoints.ts         # typed REST endpoint helpers (getMe, listProfiles, etc.)
│   │   │   ├── errors.ts            # ApiError class, error normalization
│   │   │   └── mocks/               # MSW handlers (or equivalent) for offline dev
│   │   ├── auth/
│   │   │   ├── cognitoClient.ts     # thin wrapper over aws-amplify Auth: signUp, confirm, signIn (SRP), signOut, refresh
│   │   │   └── secureStorage.ts     # expo-secure-store wrapper for tokens
│   │   ├── graphql/
│   │   │   ├── appsyncClient.ts     # AppSync client + WebSocket subscription lifecycle
│   │   │   ├── operations.ts        # typed mutation/query/subscription strings
│   │   │   └── mocks/               # subscription mocks for offline chat testing
│   │   └── push/
│   │       └── expoPush.ts          # register device with Expo, POST token to /v1/push-tokens
│   │
│   ├── state/                       # cross-feature state (not per-feature)
│   │   ├── auth/
│   │   │   ├── AuthProvider.tsx     # session state, auto-refresh, sign-in/out, profile_complete
│   │   │   └── useAuth.ts           # hook
│   │   ├── query/
│   │   │   └── QueryProvider.tsx    # TanStack Query client + default options
│   │   ├── i18n/
│   │   │   ├── LanguageProvider.tsx # current locale ('en' | 'ur'), setLocale, persists via AsyncStorage
│   │   │   └── useLocale.ts         # hook — returns {locale, setLocale, t(key)}
│   │   └── theme/                   # (theme lives in src/theme; this folder holds no theme code — kept for symmetry only if state is added later)
│   │
│   ├── features/                    # feature-first vertical slices (see §10)
│   │   ├── auth/                    # sign-in, forgot/reset password (sign-up + confirm live inside onboarding — see §11.1)
│   │   ├── onboarding/              # 31-page sign-up wizard (see §11.2)
│   │   │   ├── screens/             # one file per page, Page01WelcomeScreen.tsx ... Page31FaceVerifyScreen.tsx
│   │   │   ├── components/          # SiblingForm.tsx, EducationForm.tsx, CountryPicker.tsx, PhotoTile.tsx, FaceOvalOverlay.tsx
│   │   │   ├── hooks/               # useOnboardingDraft, useCheckpointResume, useOnboardingProgress
│   │   │   ├── checkpoints.ts       # named checkpoint ids: 'firstCheckpoint' (page 8), 'secondCheckpoint' (page 14). Persistence layout in §11.2.4
│   │   │   ├── draftSchema.ts       # shape of the persisted draft (matches PATCH /profile/me body + client-only fields)
│   │   │   └── api.ts               # single PATCH /profile/me + upload placeholder for photos (deferred)
│   │   ├── profile/                 # my profile view, edit profile
│   │   ├── discover/                # deck + search + profile-of-other view
│   │   ├── bookmarks/               # saved profiles
│   │   ├── friendRequests/          # incoming, outgoing, actions
│   │   ├── friends/                 # friends list, unfriend
│   │   ├── chat/                    # rooms list, room view, message composer
│   │   ├── blocks/                  # blocklist management
│   │   └── settings/                # notifications, theme, account deletion
│   │   Each feature contains:
│   │     ├── screens/               # screen components — import ONLY from @/components + local
│   │     ├── components/            # feature-local components (not catalog-worthy yet)
│   │     ├── hooks/                 # feature-specific hooks (data fetching, form state)
│   │     ├── api.ts                 # thin wrapper over services/api/endpoints scoped to the feature
│   │     └── types.ts               # feature-specific view types (mapped from src/types/api)
│   │
│   ├── navigation/                  # navigators only — no screen components live here
│   │   ├── RootNavigator.tsx        # auth-gate: AuthStack | AppTabs
│   │   ├── AuthStack.tsx            # native-stack: Login → ForgotPassword → ResetPassword (sign-up + confirm live in OnboardingStack pages 2–3)
│   │   ├── OnboardingStack.tsx      # native-stack for the 40-screen sign-up flow (post-registration, pre-verified profile)
│   │   ├── AppTabs.tsx              # bottom-tabs: Discover / Requests / Chat / Menu (see §6)
│   │   ├── DiscoverStack.tsx        # nested stack within Discover tab
│   │   ├── ChatStack.tsx            # nested stack within Chat tab (rooms → room)
│   │   ├── ProfileStack.tsx         # nested stack for my profile / edit
│   │   ├── linking.ts               # deep-link config (deferred; see §12)
│   │   └── types.ts                 # ParamList types per navigator (typed navigation)
│   │
│   ├── Helper/                      # pure, non-rendering functions (codingprinciples.md → Helpers)
│   │   ├── dateHelper.ts            # birthday <-> age, ISO date parsing
│   │   ├── validationHelper.ts      # form field rules (email, username, password, custom)
│   │   ├── formatHelper.ts          # display formatting (name, location)
│   │   ├── errorHelper.ts           # map ApiError → user-facing label key
│   │   ├── immutableFieldHelper.ts  # detects which profile fields are immutable-after-set
│   │   ├── canonicalizeHelper.ts    # (backend-side concern — friendships canonicalized server-side; no frontend duty)
│   │   └── labelHelper.ts           # (added later when runtime i18n is introduced)
│   │
│   ├── types/                       # shared TypeScript types
│   │   ├── api/                     # generated from db-schema.json — see §11
│   │   │   ├── User.ts              # UserProfile view type (excludes preference_vector, internal audit columns)
│   │   │   ├── Sibling.ts
│   │   │   ├── FriendRequest.ts
│   │   │   ├── Friendship.ts
│   │   │   ├── Bookmark.ts
│   │   │   ├── Block.ts
│   │   │   ├── DeckEntry.ts         # matches deck_view columns
│   │   │   ├── ChatRoom.ts
│   │   │   ├── Message.ts
│   │   │   └── index.ts
│   │   ├── enums.ts                 # 'Male' | 'Female'; 'pending' | 'accepted' | ...
│   │   └── nav.ts                   # re-exports RootStackParamList etc. from navigation/types.ts
│   │
│   └── __mocks__/                   # module mocks used by Jest (jest.setup.ts injects these)
│
└── __tests__/
    ├── components/                  # tests for every catalog component (theme.md §15.1 checklist)
    ├── helpers/                     # tests for every Helper/*
    ├── features/                    # feature integration tests (per feature module)
    └── navigation/                  # auth-gate tests (render-tree, not navigation attempts)
```

### 5.1 Notes on the structure

- **Feature-first, not screen-first.** Each feature owns its screens, components, hooks, and API glue. A new feature slots in as a new folder under `src/features/`. Cross-feature reuse rises into `src/components/` (catalog), `src/Helper/`, or `src/services/`.
- **`src/navigation/` holds navigators only.** Screen components live under `src/features/<feature>/screens/`. The navigators import from features.
- **`src/services/` is the I/O boundary.** Nothing above it touches `fetch`, AsyncStorage, expo-secure-store, or the AppSync client. Features consume typed helpers from `services/api/endpoints.ts`.
- **`src/config/` is the single source of truth for env values.** No feature imports `process.env` directly; everything goes through `config/env.ts`.
- **`src/types/api/` types are derived from `db-schema.json`.** See §11 for the derivation policy — the frontend keeps a lightly-decoupled view type, not a direct clone.
- **All static resources are centrally registered.** Images, selection options, country data, and user-facing strings each have exactly one registry file. Screens read from the registry — they never `require()` an image path, never inline an options array, never hardcode a country list, never write a raw English string. See §5.2, §5.3, §15.6.

### 5.2 Central image registry

Images are **never referenced by path from screens or components**. They are exposed through a single typed registry so any image swap (e.g., replacing `backgr.png` with a new brand background) is a one-line change.

```
src/config/images.ts
```

Shape:

```ts
export const images = {
  onboarding: {
    background:   require('@/assets/images/onboarding/backgr.png'),
    banner:       require('@/assets/images/onboarding/banner.png'),
    logo:         require('@/assets/images/onboarding/Logo.png'),
    genderMale:   require('@/assets/images/onboarding/male.png'),
    genderFemale: require('@/assets/images/onboarding/female.png'),
  },
} as const;

export type ImageKey = keyof typeof images.onboarding; // extend per group
```

Consumption:

```tsx
import { images } from '@/config/images';
// ...
<Image source={images.onboarding.background} />
```

Rules:

- No screen or feature-local component may call `require('...png')` directly. ESLint `no-restricted-imports` / a lint rule forbids `.png` / `.jpg` / `.jpeg` / `.webp` string paths inside `src/features/`.
- Any new image lands in `src/assets/images/<group>/` **and** a new entry in `src/config/images.ts` in the same PR.
- The registry object is `as const` so consumers get autocompletion on group and key.
- The `templateimages/` folder at the project root is a legacy landing zone from the original design brief; it is retired the moment §5's scaffold is created — its five files move under `src/assets/images/onboarding/`.

### 5.3 Central options registry

Selection options for form fields (religion, professional category, education level, districts, etc.) are **never inlined in screen code**. Each option list is its own JSON file under `src/config/options/`, and screens read them through a typed loader.

```
src/config/options/<field>.json           # raw list — one file per field
src/config/options/index.ts               # typed re-exports (options.religion, options.districts, ...)
```

Shape of a simple list:

```json
["Islam", "Christianity", "Hinduism", "Sikhism", "Atheism/Agnostic", "Prefer not to say"]
```

Shape of a labelled list (when the DB value differs from the label the user sees, or when i18n needs a stable value key):

```json
[
  { "value": "government",   "labelKey": "employment.government" },
  { "value": "private",      "labelKey": "employment.private" },
  { "value": "self-business","labelKey": "employment.selfBusiness" }
]
```

Consumption:

```tsx
import { options } from '@/config/options';
// ...
<RadioGroup items={options.religion} />
```

Rules:

- No screen, feature-local component, or Helper defines an options array inline. If a field appears in a screenshot with N choices, those N choices come from `src/config/options/<field>.json`.
- Value strings that get sent to the backend match the exact case / spelling defined in `db-schema → users.<column>` (e.g., `Male` / `Female`, `Never Married` / `Divorced` / `Widowed`). Labels shown to the user come from `labels.json` and may differ per locale — the raw JSON files hold the **value**, the label lookup is a key.
- When an option list drives a **dynamic branch** (e.g., picking `Islam` on page 9 reveals the subsect list; picking any other religion pins subsect to `Not Applicable`), the branching rule is coded in the screen but the option lists themselves stay in the JSON files — nothing about the branch logic changes when we edit the list.
- Countries are a separate case (paired name + dial code + flag ISO2), so they live in `src/config/countries.ts`, not under `options/`.

---

## 6. Navigation architecture

Uses React Navigation 7 (verified in `test-project-new`: `@react-navigation/native@7.2.3`, `@react-navigation/native-stack@7.14.13`, `@react-navigation/bottom-tabs@7.15.12`). Same versions unless `theme.md §1` is updated.

### 6.1 High-level graph

```
RootNavigator
├── (unauthenticated)  AuthStack        ─ Login → ForgotPassword → ResetPassword  (sign-up + confirm live in OnboardingStack pages 2–3)
├── (authenticated,    OnboardingStack  ─ 40-step sign-up wizard (screenshots 1–40)
│   profile_complete
│   = false)
└── (authenticated,    AppTabs
    profile_complete   ├── Discover      (nested stack: Deck → OtherProfile → Filters)
    = true)            ├── Requests      (nested stack: Incoming/Outgoing tabs → RequestDetail)
                       ├── Chat          (nested stack: RoomsList → Room)
                       └── Menu          (nested stack: MyProfile → EditProfile → Bookmarks → Blocks → Settings → AccountDeletion)
```

### 6.2 Auth-gate mechanics

Copied from `test-project-new` (verified pattern): the auth-gate is implemented by **unmounting** the unauthenticated stack, not by hiding it. `RootNavigator` reads three signals from `useAuth()`:

- `status: 'loading' | 'unauthenticated' | 'onboarding' | 'ready'`
- `session: CognitoSession | null` (JWT, refresh token metadata, expiry)
- `profileComplete: boolean` (mirrors the `custom:profile_complete` JWT claim, per `backend-config → cognito.jwtCustomClaims`)

Rendering:

- `status === 'loading'` → splash / spinner
- `status === 'unauthenticated'` → `AuthStack`
- `status === 'ready' && profileComplete === false` → `OnboardingStack`
- `status === 'ready' && profileComplete === true` → `AppTabs`

Transitions are triggered by state changes in `AuthProvider`, not by imperative `navigation.navigate()` calls across the boundary. This makes the boundaries testable via render-tree assertions and eliminates a whole class of navigation bugs.

### 6.3 Onboarding stack

The sign-up flow is a **paginated wizard** — 31 pages, one native-stack navigator, with a top progress bar and a back button that unwinds one step (per §11.2). The full page list and field mapping live in §11.2; this section describes the navigation and persistence mechanics only.

**Paginated view + progress bar** — the wizard is *not* a horizontally-swiped carousel. It is a native-stack navigator: each page is a full-screen route pushed onto `OnboardingStack`, so back-gesture, hardware back button, and screen transitions are native. The progress bar is rendered by the `WizardHeader` component and reads `useOnboardingProgress()` which returns `{ current, total, checkpoint }`. `total` is a constant (31); `current` is derived from the route name (`Page01` → 1, `Page17` → 17); `checkpoint` names the most recently passed checkpoint so a resumed session can restore the correct progress bar segment. The progress bar is **not** a global tab or a swipable UI — it is a passive display on top of each page. Screens 1–4 (welcome, email, code, get-started) hide the progress bar; it appears from page 5 onward.

**Draft persistence** — the wizard writes to a local `onboardingDraft` in `expo-secure-store` after every step (survives app kill). The draft's shape matches the eventual PATCH body plus a few client-only fields (`photo_preview_uris`, `notification_permission_status`, `location_permission_status`). The draft's schema is versioned; a `schemaVersion` field allows future migrations if a page is added or removed.

**Checkpoints (named resume anchors)** — two pages act as checkpoints (see §11.2.4):
- **`firstCheckpoint`** — after page 8. Everything captured through page 7 (email verification, name, gender, birthday) is durable and re-entered on relaunch.
- **`secondCheckpoint`** — after page 14. Adds notification + location permissions. On relaunch, if permissions were already granted, the page shows a "Continue" button instead of re-requesting them.

On resume, `OnboardingStack` reads `onboardingDraft.lastCheckpoint` and mounts the appropriate step directly — the user never re-fills fields captured before the last passed checkpoint. If no draft exists, the stack starts at page 1. If the draft exists but `lastCheckpoint` is null (user hasn't reached page 8 yet), the stack starts at page 1 but pre-fills any fields that were already entered.

**Final submission** — on the last page, the whole payload is PATCHed to `/profile/me` as a single write. When the backend flips `profile_complete_verified=true`, the JWT is refreshed, `profileComplete` becomes true, and `RootNavigator` swaps in `AppTabs`. On PATCH failure the draft is preserved and the last page shows a retry action — the user is never dumped back to page 1.

### 6.4 Deep links

**[Deferred]** Deep linking is defined in `src/navigation/linking.ts` but its concrete config is decided when push notifications land — pushes carry a route (e.g., "new message in room X") that opens the correct screen. Skeleton file added in phase 1; concrete routes filled during the chat/notifications phases.

### 6.5 Typed navigation

`src/navigation/types.ts` declares a `ParamList` per navigator (e.g., `AuthStackParamList`, `AppTabsParamList`, `ChatStackParamList`). All `useNavigation` and `useRoute` calls consume these types — no `any` in navigation params.

---

## 7. State management strategy

### 7.1 Four kinds of state, four different homes

| Kind | Where it lives | Library | Persistence |
| --- | --- | --- | --- |
| Auth / session state | `src/state/auth/AuthProvider.tsx` | React Context + `aws-amplify` (Cognito) | `expo-secure-store` for tokens |
| Server state (REST) | `src/state/query/QueryProvider.tsx` (TanStack Query) | `@tanstack/react-query` **[Recommendation]** | In-memory cache; optional persistence via `@tanstack/query-async-storage-persister` **[Open]** |
| Server state (realtime — chat) | AppSync subscription hooks (`src/features/chat/hooks/`) | `aws-amplify` GraphQL client OR `@apollo/client` (subscriptions link) **[Open]** | In-memory + AsyncStorage message log **[Recommendation]** |
| Local UI / form state | `useState`, `useReducer` per screen | React built-in | none |

### 7.2 Auth state (concrete)

- Provider signs in via `Auth.signIn(username, password)` from `aws-amplify` (SRP flow — no password ever crosses the wire in plaintext).
- Access token and refresh token stored in `expo-secure-store` under distinct keys.
- Access token is 60 minutes (per backend-config); refresh token is 30 days. Provider proactively refreshes when the access token has < 5 minutes left.
- On app boot: if a refresh token exists, silently swap it for a fresh access token before rendering the navigator. If the refresh fails (revoked, expired, network down but no cached user), fall through to `AuthStack`.
- `profileComplete` is decoded from the `custom:profile_complete` claim on every token refresh.
- `signOut()` clears secure storage AND resets the TanStack Query cache to prevent leaking one user's data into another user's session on the same device.

### 7.3 Server state — TanStack Query **[Recommendation]**

Reasoning: knotify has multiple list endpoints with stale-while-revalidate semantics (deck, requests, bookmarks, blocks, friends), server-driven pagination on some (`/profiles?limit&offset`), and complex invalidation cascades (accepting a friend request removes it from `/friend-requests` and adds a row to `/friends`). TanStack Query handles all of this off-the-shelf. The test project had no such need, so this is a net-new choice.

Conventions:

- Query keys are tuples: `['deck']`, `['profile', userId]`, `['friend-requests', 'incoming']`.
- Feature modules expose `use<Thing>Query()` and `use<Thing>Mutation()` hooks from `features/<feature>/hooks/`, never raw `useQuery` in screens.
- `staleTime` is set per-query-family in `QueryProvider` defaults; not overridden ad hoc unless a screen genuinely needs it.
- Mutations return typed `onSuccess` handlers that call `queryClient.invalidateQueries` on the affected keys — no manual cache surgery.

Alternatives considered: SWR (fewer features), Redux Toolkit Query (heavier), Zustand + custom fetch (no query lifecycle). **[Open]** — user may pick a different library at `/create-plan` time; the folder structure above accommodates any of them because features consume through their own hook layer.

### 7.4 Local UI state

Follows `codingprinciples.md`: `useState`, `useReducer`, `useMemo`, `useCallback`. No cross-screen local UI state library unless a specific need appears. Forms use plain `useState` for now; `react-hook-form` may be added when a multi-field form gets complex (per `theme.md §1.2 — conditionally approved`).

### 7.5 Realtime chat state

Chat rooms subscribe to AppSync GraphQL subscriptions:

- `onMessageInRoom(roomId)`
- `onTypingInRoom(roomId)`
- `onReadReceipt(roomId)`
- Non-room subscriptions: `onNotificationForMe`, `onFriendRequestUpdated`, `onRoomDeactivated`, `onRoomReactivated`.

`services/graphql/appsyncClient.ts` owns WebSocket lifecycle, reconnect with backoff, and per-subscription unsubscribe on unmount. Feature-level hooks (e.g., `useRoomMessages(roomId)`) attach a subscription on mount and detach on unmount. The idle timeout is 10 minutes per `backend-config → appsync.idleTimeoutMinutes`; the client sends periodic keepalive pings.

**[Open]** — client choice between `aws-amplify`'s GraphQL client (unified with Cognito auth) and `@apollo/client` (richer cache). `aws-amplify` is already required for Cognito, so the default recommendation is to use its GraphQL client to avoid a second dependency. Confirm at implementation time.

---

## 8. API integration strategy

### 8.1 Boundaries

- **REST** via CloudFront: `services/api/httpClient.ts` — a small `fetch` wrapper. Base URL from `config/env.ts`.
- **GraphQL + subscriptions** via AppSync: `services/graphql/appsyncClient.ts`.
- **Auth (Cognito)**: `services/auth/cognitoClient.ts` — wraps `aws-amplify` Auth so features never import `aws-amplify` directly.
- **Push**: `services/push/expoPush.ts` — registers the device, POSTs the token.

Nothing outside `src/services/` calls `fetch`, opens a WebSocket, or reads/writes tokens.

### 8.2 HTTP client contract

```ts
type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method: HttpMethod;
  path: string;                      // e.g. '/profile/me'
  query?: Record<string, string | number>;
  body?: unknown;
  requiresAuth?: boolean;            // default true
  signal?: AbortSignal;
}

async function request<T>(opts: RequestOptions): Promise<T>;
```

Behavior:

- Prepends `baseUrl` (CloudFront URL from `config/env.ts` → `restApi.baseUrl`).
- Attaches `Authorization: Bearer <accessToken>` unless `requiresAuth === false`.
- Serializes `body` as JSON, sets `Content-Type: application/json`.
- Times out after N ms (configurable per call; default 15 s).
- On 401 → attempts one silent token refresh, then retries once; if the retry 401s, signs the user out.
- On 403 with a body hinting at `edge secret` → surfaces "wrong URL configuration" (means CloudFront was bypassed; a coding error).
- On 403 from `/match/*` → routes user back to Onboarding (per `backend-config → errorHandling.commonStatusCodes.403`).
- On 429 → surface a "please slow down" state; retry with backoff only for idempotent operations.
- Non-2xx → throws typed `ApiError { status, code, message, retryable }`.

### 8.3 Endpoint helpers

`services/api/endpoints.ts` exports one function per row in `backend-config.json → restApi.routes`, e.g.:

```ts
export const profileApi = {
  getMe:          () => request<UserProfile>({ method: 'GET', path: '/profile/me' }),
  updateMe:       (patch: Partial<UserProfileWritable>) => request<UserProfile>({ method: 'PATCH', path: '/profile/me', body: patch }),
  deleteMe:       () => request<{ executionArn: string }>({ method: 'DELETE', path: '/profile/me' }),
  deletionStatus: (executionArn: string) => request<DeletionStatus>({ method: 'GET', path: '/profile/me/deletion-status', query: { executionArn } }),
  listProfiles:   (params: ListProfilesParams) => request<Paged<UserProfile>>({ method: 'GET', path: '/profiles', query: params }),
  getProfileById: (userId: string) => request<UserProfile>({ method: 'GET', path: `/profiles/${userId}` }),
};
```

Feature hooks call these — they do not touch `httpClient` directly.

### 8.4 Mocking strategy (offline dev)

The dev backend is currently torn down. Until it returns:

- **[Recommendation]** Use **MSW (Mock Service Worker) — `msw`** to intercept `fetch` at the network layer. Handlers live in `services/api/mocks/handlers.ts`, mirror the endpoint list, and return fixtures drawn from `services/api/mocks/fixtures/` (JSON files shaped from `db-schema.json`).
- MSW is toggled by a build flag (`EXPO_PUBLIC_API_MODE=mock` vs `live`), read via `config/env.ts`. When `mock`, MSW starts in `App.tsx` before the first request.
- **[Alternative — no MSW]** A hand-rolled `mockHttpClient.ts` that swaps `httpClient.ts` at import time via a small factory. Lighter but less realistic. Decided at `/create-plan`.
- Realtime (AppSync) subscriptions are mocked by a `mockAppsyncClient.ts` that emits scripted events from a fixture stream. Chat can be exercised offline this way.
- Fixtures deliberately include edge cases: an immutable-field violation (409), a `403 profile_complete=false` from `/match/*`, a 429 throttling response.

The mock layer's job is to make **UI development productive without the real backend**, not to be a full backend simulator. Real integration lives on `dev` once it comes back up.

### 8.5 Data shaping

- REST responses are consumed as-is; `types/api/*` are the response shapes.
- The DB field `preference_vector` is **stripped by the backend** and MUST NOT appear in `UserProfile` view types — but the type file still explicitly documents this to prevent future drift.
- Frontend never sends `age` on PATCH (it's a generated column). `UserProfileWritable` is derived from `UserProfile` with `Omit<UserProfile, 'age' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at' | 'profile_complete_verified'>`.

---

## 9. Environment and configuration strategy

### 9.1 The rule

**One place for backend URLs, endpoints, and env-specific values.** If the CloudFront domain changes, exactly one file changes.

### 9.2 File layout

```
src/config/
├── env.ts                          # public API: `env.apiBaseUrl`, `env.appsyncUrl`, `env.mode`, etc.
├── backendConfig.dev.json          # dev values (placeholders today, real values later)
├── backendConfig.prod.json         # prod values (placeholders today, real values later)
├── backendConfig.types.ts          # TypeScript shape mirroring backend-config.json
└── endpoints.ts                    # concrete route strings from backendConfig for services/api
```

`backendConfig.<env>.json` is a **frontend-owned** copy of the shape in `knotify-backend/backend-config.json`. It intentionally trims fields the frontend does not consume (e.g., backend-only Aurora Data API flags, integration-test-client details). Placeholder markers (`<FILL_...>`) survive verbatim until real values are known.

### 9.3 Environment selection

Selected by an Expo public env var at build time:

- `EXPO_PUBLIC_ENV=dev` (default in `.env.development`)
- `EXPO_PUBLIC_ENV=prod` (in `.env.production` or CI-set)
- `EXPO_PUBLIC_API_MODE=mock | live` — orthogonal switch that turns MSW on/off

`config/env.ts`:

1. Reads `EXPO_PUBLIC_ENV` (`dev` fallback).
2. Loads the corresponding `backendConfig.<env>.json`.
3. Validates required fields at boot; throws with a readable error listing missing values (so a stale placeholder is caught at startup, not on first API call).
4. Exports a typed `env` object.

### 9.4 Values that placeholders currently cover

Per `backend-config.json`, the following are the concrete keys the frontend needs to resolve later:

- `restApi.baseUrl` (CloudFront)
- `cognito.userPoolId`, `cognito.appClientId`, `cognito.region`
- `appsync.apiId`, `appsync.graphqlUrl`, `appsync.realtimeUrl`
- `pushNotifications.registerEndpoint` (relative — no fill needed)
- `media.readPhotoCloudFrontDomain` (deferred with photo uploads)

The frontend does **not** need `rawApiGatewayUrl` (it must never call it directly — per `backend-config → restApi.clientMustUseCloudFront`).

### 9.5 Secrets

The Expo `EXPO_PUBLIC_*` prefix embeds values in the client bundle — **not secret storage**. Only non-secret configuration (URLs, IDs) goes there. There are no true frontend secrets in this project: Cognito app client has `appClientHasSecret: false`, and CloudFront edge-secret injection is server-side.

---

## 10. Design system and theming approach

This section is a pointer, not a spec — `theme.md` is the spec. Highlights that affect implementation phases:

- **Do not scaffold `src/theme/` from memory.** Copy `theme.md §14` files verbatim as the starting `theme.ts`, `typography.ts`, `ThemeProvider.tsx`, `index.ts`.
- **Font files are required in phase 1.** Without `PlusJakartaSans-*.ttf` in `src/assets/fonts/`, text falls back to system font and the app looks wrong. See `theme.md §5.4` for the exact wiring.
- **Icons come from `lucide-react-native`.** No other icon library.
- **Bottom sheets** (Filters, Sort) use `@gorhom/bottom-sheet` (`theme.md §1.2 — conditionally approved`).
- **Illustrations** (`theme.md §11`) are line-art SVGs. Until the user provides assets, screens render `<Image>` placeholders — do not invent illustrations.
- **The component catalog is OPEN, not closed.** §2a supersedes the closed-catalog rule from `codingprinciples.md`. Add a new component the first time it is needed — no rule-of-two, no approval process. Configurable-appearance props (color / size / spacing / padding / radius) are the norm, not the exception (see §2a.3 for the type-shape rule that keeps values on the theme scale).
- **Light + dark mode.** All components must render correctly in both. Screens tested manually in light; dark validated by inspection until reference dark screenshots exist.
- **The `frontend-design` skill is overridden by `theme.md`.** Do not apply the skill's "bold maximalist / distinctive" defaults here.

---

## 11. Feature module breakdown

Each feature is one folder under `src/features/`. Below are the modules, their user-facing scope, the endpoints they consume, and the domain rules they must respect.

### 11.1 `auth`

- Screens: `LoginScreen`, `ForgotPasswordScreen`, `ResetPasswordScreen`. Sign-up + email confirmation are **not** in `AuthStack` — they are onboarding pages 2 (`Page02EmailScreen`) and 3 (`Page03ConfirmCodeScreen`) inside `OnboardingStack` (§6.3, §11.2). One code path, one set of screens, no duplicated Cognito `signUp` / `confirmSignUp` wiring.
- Backend: `aws-amplify` Auth (Cognito SRP); no direct REST calls.
- Rules: passwords never leave the app in cleartext. Show inline validation from `Helper/validationHelper.ts`. Sign-up bootstrap (email → confirmation) lives in `OnboardingStack` — the profile row is created by a post-confirmation Lambda on the backend (per `db-schema → users.description`). `AuthStack` is entered only by returning users signing in and by password-recovery flows.

### 11.2 `onboarding`

The sign-up wizard is 31 pages, delivered as a native-stack paginated view with a top progress bar (see §6.3). This subsection is the authoritative page-by-page spec: it covers the field mapping to `db-schema → users`, the image references from the central registry (§5.2), the option-list references from the central options registry (§5.3), validation rules, dynamic branching, checkpointing, and permissions. All "Muzz" text in the reference screenshots is replaced with "Knotify" wherever it appears. All user-facing strings are keyed and localized in both English and Urdu per §15.6.

- **Backend**: `PATCH /profile/me` on final submission (page 31). Interim state persists to `expo-secure-store`.
- **Reference images**: reference screenshots live in `muzzscreenshots/` (development-time only, not shipped). Runtime images are `images.onboarding.background` (backgr.png), `images.onboarding.banner` (banner.png), `images.onboarding.logo` (Logo.png), `images.onboarding.genderMale` (male.png), `images.onboarding.genderFemale` (female.png). No screen imports the .png path directly.
- **Options**: every selection list is a JSON file under `src/config/options/` (§5.3). No screen inlines an options array.
- **Fields captured**: 30 of the 34 `requiredForCompletion` columns in `db-schema → users`, plus the entire `siblings` table (populated via the page-19 dynamic form), plus the client-only `photo_preview_uris`, `notification_permission_status`, and `location_permission_status` values. The four columns *not* directly captured by a page are `email` (set at Cognito sign-up in pages 2–3), `age` (generated from `birthday` — never PATCHed), `username` (generated in the client on page 6), and `preferences` (deferred; see §11.2.6).

#### 11.2.1 Page-by-page spec (pages 1–31)

For each page the spec records: **image** (from `images.onboarding.*`), **captured fields** (columns in `db-schema.users` or in the `siblings` table), **options** (from `src/config/options/*.json`), **validation** to unlock continue, **dynamic branches** if any, and **navigation** (auto-advance-on-select vs. explicit Continue).

| Pg | Reference | Purpose | Captures | Image / options | Advance rule |
| --- | --- | --- | --- | --- | --- |
| 1 | 1.jpeg | Welcome | — | Bg: `background`. Logo: `logo`. Title: `Knotify`. No tagline. Top-left globe icon → language sheet (en / ur only). Buttons: `Continue with email` (works), `Continue with Google` (tappable, no-op). | Tap → page 2 |
| 2 | 2.jpeg | Email | `email` (Cognito bootstrap) | Bg: `background`. TextInput type=email. Validation: RFC-5322 shape. | Continue enabled when email valid → Cognito `signUp({ email })` |
| 3 | 3.jpeg | Confirm email code | (verifies Cognito) | Bg: `background`. 6-digit code input. No countdown timer. | Continue enabled when Cognito `confirmSignUp` succeeds → page 4 |
| 4 | 4.jpeg | Get started | — | Image: `banner` (centrally aligned). CTA `Get started` enabled. | Tap → page 5 |
| 5 | 5.jpeg | Sex | `sex` | Two tappable tiles: `images.onboarding.genderMale` + label "Male", `images.onboarding.genderFemale` + label "Female". Values `Male` / `Female` from `options.gender`. Immutable-after-set (per db-schema). | Tap tile → auto-advance to page 6 |
| 6 | 6.jpeg | Name + username | `first_name`, `last_name`, `username` (generated) | Bg: `background`. Two text inputs, max 35 chars each. Validation: letters + spaces + hyphens + apostrophes only, no digits, no special chars, no leading/trailing whitespace. Username is generated client-side: `sanitize(first_name) + sanitize(last_name) + <4-digit alphanumeric>` (e.g., `AhmadKhan9K3T`). Uniqueness is enforced by the backend on the final PATCH; if the backend returns 409 on username collision the client regenerates and retries once. | Continue enabled when both names valid |
| 7 | 7.jpeg | Birthday | `birthday` (drives `age` generated column) | Image: `banner`. Cross-platform DatePicker (see §11.2.2). Validation: age ≥ 18 at today's date, birthday not in the future, year ≥ 1900. `age` is derived by `Helper/dateHelper.age(iso)` and displayed as a live preview under the picker. | Continue enabled when valid |
| 8 | 10.jpeg | **First checkpoint** | (checkpoint marker only) | Image: `banner`. No taglines. `Start` button always enabled. On advance, `onboardingDraft.lastCheckpoint = 'firstCheckpoint'` is persisted (§11.2.4). | Tap `Start` → page 9 |
| 9 | 11.jpeg | Religion + subsect | `religion`, `subsect` | Bg: `background`. Header "What religion do you practice". Options: `options.religion`. Selected row shows a pink tick (per 12.jpeg pattern). If selection is `Islam`, a secondary list `options.islamicSubsect` slides in below; picking a subsect auto-advances. If selection is anything other than `Islam`, `subsect` is set to `"Not Applicable"` and auto-advances immediately. Reactive sanity check: if user goes back and changes from `Islam` (with a subsect chosen) to a non-Islam religion, `subsect` is force-reset to `"Not Applicable"` before advancing. No manual Continue button. Immutable-after-set. | Auto-advance on complete selection |
| 10 | 12.jpeg | Professional category | `professional_category` | Bg: `background`. Header "Pick Professional Category". Options: `options.professionalCategory` (27 entries; verbatim list in §5's options block). Selected row highlighted per 12.jpeg. | Auto-advance on tap |
| 11 | (design-only) | Work details | `employment_type`, `job_title`, `employer_name`, `office_address`, `salary_range` | Bg: `background`. `employment_type`: pick-one from `options.employmentType`. `job_title`: TextInput, max 40 chars, letters/digits/spaces/-/./,. `employer_name`: TextInput, max 50 chars, same rule. `office_address`: multiline TextInput, max 150 chars. `salary_range`: pick-one from `options.salaryRange` (brackets + "I would rather not disclose"). | Continue enabled when all five valid |
| 12 | 13.jpeg | Education level | `education_level` | Bg: `background`. Options: `options.educationLevel` (5 entries). Auto-advance on tap. Drives page 13's dynamic form (§11.2.3). | Auto-advance on tap |
| 13 | (dynamic) | Education credentials | `highest_degree`, `high_school`, `high_school_passing_year`, `higher_secondary`, `higher_secondary_passing_year`, `graduation_year`, `college_name` | Bg: `background`. Dynamic form driven by page-12 choice — see §11.2.3 for the branch matrix and default-value policy. Reactive: back-navigating and changing page 12 clears/defaults page 13's now-irrelevant fields before re-mounting. | Continue enabled when all *visible* fields valid |
| 14 | 14.jpeg | **Second checkpoint** — notifications + location | (permission grants; client-only fields) | No background image. Prompt "Enable Notifications". Tap → sequentially request notification permission (`expo-notifications`) then location permission (`expo-location`, `whenInUse`). Client-only fields `notification_permission_status` and `location_permission_status` record the result. On resume with permissions already granted, page shows a plain Continue button (no re-prompt). On advance, `onboardingDraft.lastCheckpoint = 'secondCheckpoint'` is persisted. | Continue after permission flow completes (grant *or* explicit deny) |
| 15 | 15.jpeg | Current residence country | `current_residence_country`, `resident_country_code` | Bg: `background`. Header "Current Resident Country". Country list from `src/config/countries.ts` (migrated from `muzzscreenshots/countrycodes.js`). Flag rendered via `react-native-country-flag` **[Recommendation]**. Tapping a row sets both fields (name + dial code) atomically. | Auto-advance on tap |
| 16 | (design-only) | Current residence city | `current_residence_city` | Bg: `background`. Header "Current Resident City". TextInput, max 40 chars, letters/spaces/hyphens/apostrophes. | Continue enabled when valid |
| 17 | (design-only) | Family residence in Kashmir | `district`, `family_residence_address` | Bg: `background`. Header "Family Residence in Kashmir". `district`: pick-one from `options.kashmirDistricts` (22 entries; default preselected `"Srinagar"`). `family_residence_address`: multiline TextInput, max 70 chars. | Continue enabled when both valid |
| 18 | (design-only) | Parents | `fathers_name`, `fathers_job`, `father_retired`, `mothers_name`, `mothers_job`, `mother_retired` | Bg: `background`. Four TextInputs (each max 40 chars, letters/spaces rule). Two pick-ones from `options.yesNo` for the `_retired` fields. | Continue enabled when all six valid |
| 19 | (dynamic) | Siblings | populates `siblings` table (1:N with users) | Bg: `background`. Header "How many siblings do you have?". Numeric input (0–4 inclusive; negative / >4 blocked). Value `0` → Continue immediately. Value `1..4` → hides the count input, reveals N stacked sub-forms in a ScrollView. Each sub-form captures the row's `name`, `gender`, `sibling_age`, `marital_status`, `profession`. See §11.2.3 for the sub-form spec and the Cancel-discards flow. | Continue enabled when count is 0 *or* all N sub-forms valid |
| 20 | 20.jpeg | Marriage timeline | first select: (no field yet — placeholder). second select: `marriage_time`. | Bg: `background`. Two pick-ones. Second is `options.marriageTime`. | Auto-advance when both selected |
| 21 | 21.jpeg | Own religious level | `religious_level` | Bg: `background`. Options: `options.religiousLevel` (main dark label only — skip smaller subtext from the reference). Header "How religious are you?". | Auto-advance on tap |
| 22 | (21.jpeg pattern) | Partner's religious level | `partners_religious_level` | Same layout as page 21. Header "How Religious would you like your partner to be?". Options: `options.religiousLevel` (same list). | Auto-advance on tap |
| 23 | 28.jpeg | Marital status + children | `marital_status`, `has_children` | Bg: `background`. Header "What is your current marital status?". Options: `options.maritalStatus`. If `Never Married` → `has_children` is force-set to `NO` and page auto-advances. If `Divorced` or `Widowed` → a second row appears "Do you have children?" with `options.yesNo`; on tap, both are set and page advances. Reactive sanity check: back-navigation from a `Divorced/Yes` selection to `Never Married` force-resets `has_children` to `NO`. | Auto-advance on complete selection |
| 24 | 28.jpeg | Move abroad after marriage | `move_abroad` | Bg: `background`. Header "Would you be willing to move abroad after marriage?". Options: `options.yesNo`. Default preselected `YES`. | Auto-advance on tap |
| 25 | 29–32.jpeg (single scroll) | Preference multi-select #1 | (client-only — no DB field yet) | Long scrollable multi-select. Field target deferred to §11.2.6. | Continue enabled at ≥1 selection |
| 26 | 32-1 / 32-2 / 32-3.jpeg (single scroll) | Preference multi-select #2 | (client-only — no DB field yet) | Long scrollable multi-select. Field target deferred to §11.2.6. | Continue enabled at ≥1 selection |
| 27 | 19.jpeg | Profile-for-whom | `relation` | Bg: `background`. Header "Who are you creating this profile for?". Options: `options.relation` (Myself, Son, Daughter, Sibling, Friend, Ward). | Auto-advance on tap |
| 28 | 34.jpeg | Photos | client-only `photo_preview_uris[]` | 6-tile grid. Tap tile → `expo-image-picker` opens (requests media library permission first request). Selected photos are stored as local URIs; **not uploaded to the backend in v1** — see §17 assumption 14. `Add photos` button enabled at ≥1 tile filled. | Continue after ≥1 tile selected |
| 29 | 36.jpeg | Phone | `phone_number` | Bg: `background`. Country dial-code prefix (reuses page-15 selection as default; editable). Phone TextInput with numeric keyboard. Validation via `libphonenumber-js` (parse + isValidNumber for the selected country). SMS OTP verification is **[Open]** — see §17. | Continue enabled when parsed number is valid |
| 30 | 38 / 39.jpeg | Face verification intro | — | Bg: `background`. Explains photo verification. `Verify photo` button → requests camera permission via `expo-camera`, then navigates to page 31 (only if granted). | Grant → page 31; deny → surface a "camera required to continue" state with a retry |
| 31 | 40.jpeg | Face capture | client-only (photo captured, not sent) | Full-screen camera preview with a face-oval overlay (`FaceOvalOverlay` component). When the on-device face detector (from `expo-camera`'s face-detection feature or `react-native-vision-camera` **[Open]**) reports a face inside the oval bounds for N consecutive frames, capture fires automatically. Captured image saved locally; **not sent to backend in v1**. | Successful capture → PATCH `/profile/me` → root re-renders `AppTabs` |

#### 11.2.2 Cross-platform DatePicker (page 7)

The birthday picker on page 7 must render natively on both iOS and Android without a third-party paid dependency. Approach:

- Use the existing `DatePicker` catalog component (already declared in §5). Under the hood it wraps **`@react-native-community/datetimepicker`** — the community-maintained standard for RN date pickers, free, supports both platforms, and integrates with the theme.
- On iOS the picker renders as an inline wheel (spinner style) under the field label; on Android it opens the native calendar dialog. Both are wrapped inside `DatePicker` so screens see a uniform API: `<DatePicker value={iso} onChange={setIso} min={...} max={...} />`.
- Validation lives outside the component (in `Helper/dateHelper.ts`): `isAtLeast18(iso, today)`, `isNotFuture(iso, today)`, `isYearReasonable(iso)`. A single `validateBirthday(iso)` function composes them and returns a `LabelKey | null` so error text stays in `labels.json`.
- Age preview is derived: `age = dateHelper.age(iso)` and displayed live under the input.

#### 11.2.3 Dynamic forms

Two pages branch their captured fields on a prior selection. Both follow the same pattern: **the union of possible fields is always in the draft schema, unrendered branches are auto-defaulted to sentinel values, and back-navigation to the parent selector re-defaults the child form.**

**Page 13 — education branch matrix** (driven by page 12's `education_level`):

| `education_level` | Fields to ask | Fields auto-defaulted |
| --- | --- | --- |
| `Elementary School Level` | (none) | `high_school = "Not Applicable"`, `high_school_passing_year = 0`, `higher_secondary = "Not Applicable"`, `higher_secondary_passing_year = 0`, `highest_degree = "Not Applicable"`, `graduation_year = 0`, `college_name = "Not Applicable"` |
| `High School (10th)` | `high_school`, `high_school_passing_year` | others default as above |
| `Higher Secondary School (12th)` | `high_school`, `high_school_passing_year`, `higher_secondary`, `higher_secondary_passing_year` | `highest_degree`, `graduation_year`, `college_name` defaulted |
| `Graduate And Above` | all seven fields | (none) |
| `Medical Doctor / PHD` | all seven fields | (none) |

Field-level validation on page 13:
- Text fields (`high_school`, `higher_secondary`, `college_name`, `highest_degree`): max 40 chars, letters/digits/spaces/-/./&/, sanity check via `Helper/validationHelper.ts`.
- Year fields (`high_school_passing_year`, `higher_secondary_passing_year`, `graduation_year`): numeric keyboard, exactly 4 digits, 1950 ≤ year ≤ current year.

Back-navigation policy: if the user returns to page 12 and picks a *lesser* level (e.g., changes `Graduate And Above` → `Higher Secondary School (12th)`), page 13's `highest_degree`, `graduation_year`, `college_name` are force-reset to their defaults before page 13 re-mounts. Enforced by an `useEffect` in `Page13EducationScreen` that watches the draft's `education_level` and reconciles the education fields on mount.

**Page 19 — siblings dynamic list** (populates the `siblings` table):

Sub-form shape (repeated N times, one per sibling row):
- `name`: TextInput, max 35 chars, letters/spaces/hyphens/apostrophes.
- `gender`: pick-one, `options.gender`.
- `sibling_age`: numeric input, max 2 digits, 0–99.
- `marital_status`: pick-one, `options.maritalStatus` (same list as page 23).
- `profession`: TextInput, max 35 chars, sanity rule.

UI states:
1. **Initial** — numeric count input visible. Values < 0 or > 4 blocked at input level. Value `0` immediately enables Continue.
2. **Filling** — count input hidden; N `<SiblingForm />` cards rendered in a ScrollView. Continue disabled until every card passes validation. A **Cancel** action discards all cards and returns to state 1 (count input reappears blank).
3. **Complete** — Continue enabled; on tap, the array of N sibling objects is serialized into `onboardingDraft.siblings`. On final PATCH the array is sent alongside the profile payload — the backend handler is expected to `INSERT` into the `siblings` table transactionally. **[Open]** the exact request contract (embedded vs. separate call) — see §17.

#### 11.2.4 Checkpoint persistence

The draft is stored in `expo-secure-store` under a single key `onboardingDraft`:

```ts
type OnboardingDraft = {
  schemaVersion: 1;
  lastCheckpoint: 'firstCheckpoint' | 'secondCheckpoint' | null;
  currentPage: number;                  // 1..31, updated on every navigate
  fields: Partial<UserProfileWritable>; // typed slice of the eventual PATCH body
  siblings: SiblingDraft[];             // populated by page 19
  photoPreviewUris: string[];           // client-only (page 28)
  notificationPermissionStatus: 'granted' | 'denied' | 'undetermined' | null;
  locationPermissionStatus:     'granted' | 'denied' | 'undetermined' | null;
  timestamps: { createdAt: string; updatedAt: string; };
};
```

Persistence rules:
- Every `useOnboardingDraft().update(patch)` call debounces a write (200 ms) to avoid a write per keystroke.
- `lastCheckpoint` is written **only** when the user advances past pages 8 or 14 respectively. It never regresses (e.g., back-navigating from page 15 to page 12 does not clear `secondCheckpoint`).
- On app resume, `OnboardingStack` reads the draft:
  - If `lastCheckpoint === 'secondCheckpoint'` → mount at the page after 14, pre-fill all captured fields.
  - Else if `lastCheckpoint === 'firstCheckpoint'` → mount at the page after 8, pre-fill fields.
  - Else → mount at page 1, but pre-fill whatever partial data exists so users don't retype.
- On successful final PATCH the draft is cleared (all keys deleted from secure-store).
- Draft encryption is handled by `expo-secure-store` natively (Keychain on iOS, EncryptedSharedPreferences on Android).

#### 11.2.5 Permissions surface

The onboarding flow requests four distinct OS permissions. Each is centralized in `services/permissions/` (new folder under §5 — added on first use) rather than each screen calling the SDK directly:

| Permission | Requested on page | Library | Denial behavior |
| --- | --- | --- | --- |
| Notifications | 14 | `expo-notifications` | Continue still allowed; status persisted; user can re-grant in Settings |
| Location | 14 | `expo-location` (whenInUse) | Continue still allowed; discover-tab may prompt again post-onboarding |
| Media library | 28 | `expo-image-picker` | Photo tile shows a "grant photos access" hint; Continue disabled until ≥1 photo picked (either via grant or via camera capture route — TBD if we add one) |
| Camera | 30 → 31 | `expo-camera` | Cannot enter page 31 without grant; page 30 shows retry state |

#### 11.2.6 Fields captured elsewhere / deferred

- `email` is set by Cognito on page 2, not by a profile PATCH.
- `age` is a generated column — never PATCHed. Displayed live from `birthday` per §11.2.2.
- `username` is client-generated on page 6. If the final PATCH returns 409 (username collision), the client regenerates the trailing 4-digit alphanumeric segment and retries once. Second failure surfaces an error state on the last page with a "try again" action.
- `preferences` (page 25, page 26 multi-selects) is **deferred** per the user's directive. The multi-select UIs are still rendered so the interaction is present, but they write to a placeholder `onboardingDraft.preferencesDraft` and are omitted from the PATCH body. The mapping onto the `users.preferences` JSONB and the `preference_vector` derivation are decided in a later phase. **[Open]** — see §17.
- Photos (page 28) and the captured selfie (page 31) are **not** uploaded in v1 (per §17 assumption 14). The URIs live in the draft; the upload wiring is added when the backend photo pipeline is deployed.

#### 11.2.7 Text replacements

Every instance of the string `Muzz` in the reference screenshots — including headings, taglines, button labels, and copy in the corners — is rendered as `Knotify` at runtime. The reference screenshots themselves are **not** modified; the mapping happens through `labels.json` keys. No screen file contains the string `"Muzz"` anywhere.

#### 11.2.8 Post-onboarding design — deferred to future implementation phases

The §11.2 spec covers the sign-up wizard only. Every feature that runs **after** the final PATCH — i.e., after `profile_complete_verified` flips to `true` and `RootNavigator` swaps in `AppTabs` — will have its visual and interaction design delivered by the user during that feature's implementation phase (via the `/implement-phase` per-phase brainstorm). Nothing about how those screens look, how their cards are laid out, or how their interactions flow is fixed by this document.

Sections §11.3 through §11.10 below define **scope, endpoints, and domain rules only** — they intentionally do not describe:

- **Home / deck view (`discover`, §11.4)** — how other users' profile cards are rendered (photo layout, card stack vs. list vs. grid, gestures, empty/stale-deck states), how filters are triggered, how search results are presented.
- **Chat (`chat`, §11.8)** — the chat list layout, the chat room layout, the composer design, typing/read-receipt indicators, room states (blocked, deactivated, empty).
- **Friend requests (`friendRequests`, §11.6)** — the incoming/outgoing UI, how a request is initiated from another user's profile, how accept/decline/cancel actions are surfaced, the detail view.
- **Friends list (`friends`, §11.7)** — how the list is laid out and how the unfriend confirmation looks.
- **My profile / edit profile (`profile`, §11.3)** — how the user's own profile is displayed, how the immutable-after-set fields are visually differentiated, how the edit sections are grouped, how the username rename cool-down is surfaced.
- **Filters** — the filter sheet (`FiltersScreen`) — which facets are exposed, how they are grouped, how they persist.
- **Preferences field (`users.preferences`)** — the multi-select UIs on onboarding pages 25 + 26 render the interaction but do not yet write to `preferences`. The final field key + JSONB shape + user-facing edit surface are decided in a later phase.
- **Settings (`settings`, §11.10)** — layout of the settings menu, notification toggles, theme toggle, language toggle, and their sub-screens.
- **Account suspension** — currently not modeled in `db-schema` or `backend-config`; the suspension flow (self-serve pause vs. admin-driven) is out of scope until the backend surface exists. Flagged as a follow-up in §17.
- **Account deletion (`settings`, §11.10)** — the deletion confirmation flow, mode picker (`soft_delete_with_grace_period` vs. `purge_immediately`), and the polling UX for the deletion status endpoint.
- **Blocks (`blocks`, §11.9)** — the block-list layout and the "block from other-profile" entry point.
- **Bookmarks (`bookmarks`, §11.5)** — how bookmarked profiles are laid out.
- **Any other post-onboarding screen** the user surfaces later (e.g., notification center, in-app messaging, push-token debug view).

For each of the above, the design specification (equivalent to §11.2's page-by-page table) is delivered by the user during `/implement-phase` for that feature and captured in the per-phase brainstorm under `phasebrainstorms/`, then reflected in the phase's PRD under `implementationplan/`. This document is updated only when a decision has broad architectural impact (a new folder in §5, a new cross-cutting concern in §15, or a new [Open] entry in §17) — routine screen-level design does not belong here.

### 11.3 `profile`

- Screens: `MyProfileScreen`, `EditProfileScreen`.
- Backend: `GET /profile/me`, `PATCH /profile/me`.
- Rules: fields flagged `immutableAfterSet` in `db-schema` (`first_name`, `last_name`, `sex`, `birthday`, `religion`, `subsect`) are rendered greyed-out with a tooltip explaining they cannot change. Attempting to PATCH one produces a 4xx from the backend — the UI prevents the submit before it happens. `age` is never PATCHed (generated column). `username` change is rate-limited (1 per 30 days) — surface a "you can rename again on `<date>`" hint from the last-rename metadata (**[Open]** — rename metadata surface is not currently in `backend-config.json → routes`; confirm with backend team).

### 11.4 `discover`

- Screens: `DeckScreen` (main feed), `OtherProfileScreen`, `FiltersScreen`, `SearchScreen`.
- Backend: `GET /match/deck`, `POST /match/search`, `GET /profiles/{userId}`, `GET /profiles` (search).
- Rules: `/match/*` requires `profile_complete_verified=true` — a 403 sends the user back to Onboarding (per §8.2). Deck freshness is 15-minute window (per `db-schema → notesForFrontend.deckDataFreshness`) — the UI shows a stale-refresh indicator instead of promising instant freshness.

### 11.5 `bookmarks`

- Screens: `BookmarksScreen`, `BookmarkToggle` action (invoked from Deck / OtherProfile).
- Backend: `GET /bookmarks`, `POST /bookmarks`, `DELETE /bookmarks/{userId}`.
- Rules: bookmark toggle is optimistic — flip the icon on tap, roll back on server error.

### 11.6 `friendRequests`

- Screens: `IncomingRequestsScreen`, `OutgoingRequestsScreen`, `RequestDetailScreen`.
- Backend: `GET /friend-requests`, `POST /friend-requests`, `POST /friend-requests/{id}/accept`, `POST /friend-requests/{id}/decline`, `DELETE /friend-requests/{id}` (cancel outgoing).
- Rules: statuses are `pending | accepted | declined | cancelled` (per `db-schema → enums.friendRequestStatus`). Accepting invalidates both `['friend-requests', 'incoming']` and `['friends']`. Duplicate pending requests are prevented by the DB unique constraint — a 409 from POST surfaces a "request already sent" state, not an error banner.

### 11.7 `friends`

- Screens: `FriendsListScreen`.
- Backend: `GET /friends`, `DELETE /friends/{userId}`.
- Rules: the frontend never worries about `user_a`/`user_b` canonicalization — the endpoint returns the other user's profile regardless of pair order (per `db-schema → friendships.frontendGuidance`). Unfriend is destructive; confirm before calling.

### 11.8 `chat`

- Screens: `RoomsListScreen`, `RoomScreen` (message thread + composer).
- Backend: AppSync GraphQL (see `backend-config → appsync.operations`):
  - Queries: `listMyRooms`, `messagesByChatRoom(roomId, limit, nextToken)`
  - Mutations: `createOrGetRoom(userId)`, `sendMessage(roomId, content)`, `markAsRead(roomId)`
  - Subscriptions: `onMessageInRoom(roomId)`, `onTypingInRoom(roomId)`, `onReadReceipt(roomId)`, `onRoomDeactivated`, `onRoomReactivated`, `onNotificationForMe`, `onFriendRequestUpdated`
- Rules: JWT is sent to AppSync in `Authorization` header **without** `Bearer ` prefix (per `backend-config → appsync.auth.notes`). Message log is cached locally for offline read; new messages arrive via subscription while the room is mounted. Blocked / deactivated rooms surface a locked banner rather than removing the row.

### 11.9 `blocks`

- Screens: `BlockedUsersScreen`; block action invoked from `OtherProfileScreen`, `RoomScreen`.
- Backend: `GET /blocks`, `POST /blocks`, `DELETE /blocks/{userId}`.
- Rules: blocking is unidirectional in DB but bidirectional in behavior (blocked and blocker cannot see each other anywhere). UI treats it that way — after blocking, remove the user from the current session's caches (`deck`, `friends`, `chat rooms`, `bookmarks`).

### 11.10 `settings`

- Screens: `SettingsScreen`, `NotificationSettingsScreen`, `ThemeSettingsScreen`, `AccountDeletionScreen`.
- Backend: `POST /push-tokens`; account deletion via `DELETE /profile/me` + polling `GET /profile/me/deletion-status?executionArn=...`.
- Rules: deletion has two modes (`soft_delete_with_grace_period`, `purge_immediately`) — expose the mode choice explicitly. Polling backs off (1 s → 2 s → 5 s → 10 s) up to a cap; on `TIMED_OUT`, surface a "we're still working on it, check back later" state and unblock the UI.

---

## 12. Testing and validation approach

### 12.1 Unit + component tests (Jest + RNTL)

Per `codingprinciples.md → Testing principles`:

- Every catalog component: `__tests__/components/<Name>.test.tsx` — every variant, every interactive prop, disabled + loading states, `accessibilityLabel`, `onPress`, light + dark theme.
- Every helper: `__tests__/helpers/<name>.test.ts` — pure functions, exhaustive.
- Every screen: `__tests__/features/<feature>/<Screen>.test.tsx` — render, prop variations, user interaction, conditional branches. Screens made entirely of catalog components + `commonStyles` need only **wiring tests** (see `codingprinciples.md`).
- Auth-gate: `__tests__/navigation/auth-gate.test.tsx` — render-tree assertions (a query for a post-auth label is `null` when unauthenticated).
- Test naming: `given <context>, when <action>, then <expected>` per workspace rules.
- Coverage thresholds (matches test-project-new): `lines 80, branches 75, functions 80, statements 80`.

### 12.2 Cross-platform verification

Both platforms verified before a phase is considered done:

- **Android** — Android Studio + emulator. Primary dev loop.
- **iOS** — Expo Go on a physical iPhone OR the iOS simulator (Xcode required — flagged as an environment prerequisite the user must confirm).
- **[Open]** — If iOS tooling is not yet installed on the developer machine, phases still design and code cross-platform, but iOS validation is deferred and logged as follow-up. This is documented explicitly per phase; iOS is not silently dropped.

### 12.3 Manual QA against screenshots

- Each screenshot batch (see §13) has a manual checklist appended to its PRD.
- Checklist covers layout parity, spacing (via `theme.md` tokens), typography, colors, tap targets, error states, empty states, loading states, dark mode by inspection.
- Failing manual QA blocks a phase's completion tag; the fix is a story in the same phase, not a follow-up.

### 12.4 End-to-end tests

**[Open]** — Detox / Maestro / Playwright are not scoped for v1. Phase 6+ (chat) is the natural point to introduce automated E2E because manual coverage of realtime flows is expensive. Decision deferred to that phase's brainstorm.

### 12.5 API contract tests

Once `dev` backend is live: introduce contract tests that hit real endpoints against seeded fixtures. Not a v1 blocker.

---

## 13. Screenshot implementation plan

### 13.1 Verified inputs

- Reference screenshot folder: `C:\Users\syede\Claude-Master\muzzscreenshots\` (development-time reference only; not shipped).
- Sign-up flow files: `1.jpeg` through `40.jpeg` (35.jpeg absent; 32 has variants `32-1.jpeg`, `32-2.jpeg`, `32-3.jpeg`).
- **Screen-to-file mapping is authoritative in §11.2** — the sign-up wizard has 31 logical pages, and each row of §11.2.1's table names which reference file(s) inform which page. Do not re-map from file numbers here.
- Runtime images live in `src/assets/images/onboarding/` and are resolved via `src/config/images.ts` (§5.2).
- Other reference images (`filtermain.jpeg`, `filterlocation*.jpeg`, `filtersect.jpeg`, `filterdiscard.jpeg`) are **not** part of the sign-up flow — they inform later feature phases (`discover`, `filters`).

### 13.2 Batching rule

**Batches are chosen from the 31 pages in §11.2.1, not from file numbers.** Each phase is a self-contained, reviewable delivery grouped by logical stage (auth, identity, religion, location, education, work, family, preferences, verification). A suggested cut:

| Batch | Pages (§11.2.1) | Scope |
| --- | --- | --- |
| B1 | 1–4 | wizard shell (progress bar, back nav, checkpoint scaffolding), welcome, email, code, get-started |
| B2 | 5–8 | sex, name+username, birthday (cross-platform DatePicker), first checkpoint |
| B3 | 9–11 | religion + subsect branch, professional category, work details |
| B4 | 12–14 | education level, dynamic education form, second checkpoint (permissions) |
| B5 | 15–17 | residence country, residence city, Kashmir district + family address |
| B6 | 18–19 | parents, dynamic siblings form |
| B7 | 20–24 | marriage-time, religious levels (self + partner), marital status + children, move abroad |
| B8 | 25–27 | preference multi-selects (deferred field mapping), profile-for-whom |
| B9 | 28–29 | photos, phone |
| B10 | 30–31 | face verification intro + camera capture + final PATCH |

> Batching is **provisional** and re-evaluated at `/create-plan` time. The scaffolding for the wizard shell (progress bar, draft persistence, checkpoint hooks) MUST land in B1 before any other batch is picked up.

### 13.3 Per-batch workflow (per phase)

1. **Read the four screenshots.** The `/implement-phase` brainstorm inspects each image and records: what screen it represents, what fields it collects, what components it uses from the catalog, what new labels are needed, what tokens are read from `theme.md`, what the navigation transition is (forward / back / conditional branch).
2. **Map to onboarding data.** Each field the screen collects maps to a column in `db-schema.users` (or a client-only field like `photo_preview_uri`). Fields not present in the DB schema are flagged as `[Open]` — either they're a client-only aid or the schema needs an addition.
3. **Update `labels.json` and `theme.md §9` first.** If the batch introduces a new visual pattern, the new component + `theme.md §9` annotation lands in the same PR as (or in a PR just before) the screen that first uses it — per §2a's rule-of-one.
4. **Implement.** Each screen is a story in the PRD; each story is one screen or one tightly-coupled pair. Screens use only catalog components (no primitives).
5. **Test.** Component tests, screen wiring tests, cross-platform manual verification.
6. **Manual review.** User reviews the built batch (screenshots side-by-side with the actual app on emulator) before the PR merges to `development`.
7. **Persist progress.** The onboarding draft `expo-secure-store` key is updated in shape when new fields are added; the schema evolution is documented in the PRD.
8. **Tag phase-complete** on `main` per `gitbranching.md`, update `context.md`, `/clear`, move to the next batch.

### 13.4 Fidelity vs. reusability tradeoff

- Match the screenshot **layout, spacing, typography, colors, and hierarchy** as closely as possible using theme tokens.
- Do **not** invent one-off styling to match a pixel-perfect gradient or shadow that the theme system cannot express — flag the divergence, propose a theme extension, and either extend the token set (if the user approves) or accept the theme's canonical rendering.
- Reused UI (a button, an input, a chip) is styled by its catalog component. A screenshot showing a button in a slightly different color / shape does **not** justify a new button variant unless (a) two other screenshots show the same variant AND (b) the user confirms it's an intentional design decision.

### 13.5 Phase decomposition policy (added 2026-07-19)

These rules govern how `/create-plan` decomposes the project into phases and how each phase's PRD is written. They resolve the cross-phase concerns surfaced in the `/create-plan` brainstorm on 2026-07-19.

**Phase 1 owns foundational infrastructure.** It scaffolds:

- Repo + Expo/RN/TypeScript project per §16 versions.
- `src/theme/` copied verbatim from `theme.md §14` (`theme.ts`, `typography.ts`, `ThemeProvider.tsx`, `commonStyles.ts`, `index.ts`).
- The catalog components starter set from §2a.7, each with its `__tests__/components/<Name>.test.tsx`.
- `src/config/` — `env.ts`, `backendConfig.dev.json` + `.prod.json` (placeholder values), `images.ts`, `countries.ts`, `options/*.json`, `options/index.ts` (§5.2, §5.3, §9).
- `src/services/` skeletons — `api/httpClient.ts`, `api/errors.ts`, `api/mocks/handlers.ts` (empty scaffold), `auth/cognitoClient.ts`, `auth/secureStorage.ts`, `push/expoPush.ts` (registration function only; the settings phase wires the UI).
- `src/state/` skeletons — `AuthProvider`, `QueryProvider`, `LanguageProvider`.
- `src/labels/` — `labels.en.json` + `labels.ur.json` with **full key parity from day 1**. Every screen shipped in later phases adds English + Urdu strings in the same PR; the parity gate (§15.6) is enforced by a test.
- Fonts — Plus Jakarta Sans weights per `theme.md §5.4` plus the chosen Urdu font (see §17.22). Font loading wired in `App.tsx`.
- **Minimal CI** — GitHub Actions running `jest`, `eslint`, `tsc --noEmit` on every PR into `development`. This is the automated gate that all subsequent phases inherit. Live at the end of phase 1; no phase after 1 is considered complete without CI green.
- `src/navigation/` — `RootNavigator`, `AuthStack` (Login only for now — password recovery lands with the relevant phase), `OnboardingStack` (routes registered but screens are placeholders filled by the onboarding phases), `AppTabs` skeleton, `linking.ts` skeleton with an empty route table.

**Onboarding phases (batches B1–B10, §13.2)** implement the 31-page wizard per §11.2 one batch per phase, in order. B1 (wizard shell + pages 1–4) lands immediately after phase 1. Cognito `signUp` + `confirmSignUp` operations live inside B1 pages 2–3, not in a separate auth phase — see §11.1.

**Post-onboarding feature phases (§11.3–§11.10)** are generated as **thin phases** at `/create-plan` time — one phase per feature (`profile`, `discover`, `bookmarks`, `friendRequests`, `friends`, `chat`, `blocks`, `settings`). Their PRDs contain:

- Scope (screens named, endpoints wired).
- Domain rules copied from §11.3–§11.10.
- Acceptance criteria bounded to backend integration, catalog-component wiring, mock-fixture coverage, and empty/loading/error state coverage.

Visual and interaction design for each post-onboarding feature is delivered by the user at `/implement-phase` time (Step 0 brainstorm, per §11.2.8) and layered into the PRD then. Do **not** try to guess visual design at plan time — the plan only guarantees the feature is functionally correct against the backend.

**Push notifications and deep linking do not get their own phase.**

- Push token registration (`services/push/expoPush.ts` → `POST /v1/push-tokens`) is a story in the `settings` phase, since that phase owns `NotificationSettingsScreen` and the push-tokens endpoint. The registration helper is scaffolded in phase 1; the UI + wire-up land in `settings`.
- The deep-link route table (§6.4) is filled incrementally: the `chat` phase adds the `Room` route so a push tap opens the right thread; the `settings` phase adds notification-driven routes as they're introduced. Phase 1 only lays down the empty `linking.ts` skeleton.

**Definition-of-done rules that apply to every phase** (repeated in every PRD's story acceptance criteria):

- Any endpoint newly consumed by the phase adds a handler and a fixture to `services/api/mocks/`. Mocks never lag behind features.
- Every catalog component or Helper introduced by the phase ships with its test file (per §12.1).
- Coverage thresholds from §12.1 (`lines 80 / branches 75 / functions 80 / statements 80`) hold at phase merge time — enforced by the phase-1 CI job.
- Both Android and iOS are designed and coded cross-platform (per §12.2), but **iOS validation is deferred per §17.8** — Xcode is not installed on the developer machine as of 2026-07-19. Every phase's completion note in `context.md` includes "iOS validation deferred (see §17.8)".
- Every user-facing string added by the phase appears in **both** `labels.en.json` and `labels.ur.json` (§15.6). Missing Urdu keys fail the parity gate in CI.

---

## 14. Data model alignment

### 14.1 Frontend types are derived from `db-schema.json`

Backend truth: `C:\Users\syede\Claude-Master\knotify-backend\db-schema.json`. Frontend consumes REST payloads shaped from those tables.

Types live under `src/types/api/`. Each file mirrors one table or view.

**Derivation rules:**

- **Include only user-visible columns.** Drop backend-only fields:
  - `users.preference_vector` — backend strips it from responses.
  - Internal audit columns (none currently, but future-proof).
- **Optional / nullable in DB → optional in TS.** DB `nullable: true` becomes `?` in the TS type. Non-null becomes required.
- **Generated columns are read-only.** `age` is `number` in `UserProfile` but does NOT appear in `UserProfileWritable` (used for PATCH bodies).
- **Immutable-after-set columns are typed the same** but a `Helper/immutableFieldHelper.ts` predicate identifies them for the edit UI. The type does not enforce immutability — the runtime does.
- **Enum columns** become string-literal unions:
  - `sex: 'Male' | 'Female'`
  - `friend_requests.status: 'pending' | 'accepted' | 'declined' | 'cancelled'`
- **JSONB `users.preferences`** is typed as a discriminated object per known preference key. Unknown keys are `unknown`, not `any`.
- **UUIDs** are branded strings — `type UserId = string & { readonly __brand: 'UserId' }` — so passing the wrong id to the wrong function is a compile error.
- **Dates** in JSON are ISO-8601 strings, not `Date`. `Helper/dateHelper.ts` parses on demand.

### 14.2 Fields the frontend must NOT send on PATCH

- `age` (generated)
- `user_id` (identity)
- `email` (bootstrap-only, changed via a separate flow if ever)
- `created_at`, `updated_at`, `deleted_at` (server-managed)
- `profile_complete_verified` (server-controlled; flipped by the check constraint)
- Anything under `preference_vector`

Enforced by the shape of `UserProfileWritable`.

### 14.3 Field grouping for onboarding forms

The 34 `requiredForCompletion` fields will be split across screenshots 9–37 (approximately). The exact mapping is decided per batch (§13.3). The frontend keeps its own field-group taxonomy — e.g., `Identity`, `Religion`, `Location`, `Education`, `Work`, `Family`, `MaritalStatus`, `Preferences` — used for onboarding step organization and for the edit-profile screen's section headers. This grouping is a UI concern; the backend does not care.

### 14.4 Sync policy

If `db-schema.json` changes:

1. Regenerate / hand-update `src/types/api/*` in the same PR that consumes the change.
2. Adjust any Helper that depends on the field set (e.g., `immutableFieldHelper`, `validationHelper`).
3. Update the onboarding wizard if a new required field appears.
4. Update the mock fixtures.

**[Open]** — automated codegen from JSON schema is out of scope for v1 but a natural improvement (e.g., `json-schema-to-typescript`). Flagged for a later engineering task.

---

## 15. Cross-cutting concerns

### 15.1 Error handling

- Network / auth errors are caught in `httpClient.ts` and normalized into `ApiError`.
- `Helper/errorHelper.ts` maps `ApiError` to a **label key** (never a raw message) so all error text obeys the labels rule.
- Every async screen models **loading / ready / error** explicitly (per `codingprinciples.md`). Never a blank screen.
- Fatal errors (missing config on boot, unrecoverable auth failure) surface via a full-screen error state with a "reload" button, not a silent crash.

### 15.2 Accessibility

- Enforced by the theme (`theme.md §13`) and the catalog components: 44×44 minimum tap targets, WCAG AA text contrast, `accessibilityLabel` on every interactive element.
- Screen-level `accessibilityRole` and heading structure per screen.
- Icons alone never convey state — always paired with text or an accessible label.

### 15.3 Performance

- `useMemo` for the `createStyles(theme)` factory (already the canonical pattern per `theme.md §15`).
- Lists (deck, rooms, requests, friends, blocks, bookmarks) use `FlatList` with `keyExtractor`, `getItemLayout` where item heights are known, and `windowSize` tuned per surface.
- Images use `expo-image` (per `theme.md §1.2`) with prefetch + memory caching.
- Chat rooms unsubscribe from AppSync on unmount to avoid runaway WebSocket state.

### 15.4 Logging & telemetry

**[Open]** — no logging library chosen for v1. `console.log` is banned by `codingprinciples.md` in production paths. Recommend introducing a thin `Helper/logHelper.ts` behind a `DEV` guard; wire to a real reporter (Sentry / LogRocket / Datadog RUM) when observability is scoped.

### 15.5 Analytics

Out of scope for v1. When introduced, live under `services/analytics/` with a single `track(event, props)` entry point so instrumentation is centralized.

### 15.6 Localization

- **Two locales in v1: English (`en`) and Urdu (`ur`).** Both are required from day one — the onboarding wizard's language picker (page 1 top-left globe icon) toggles between them at runtime.
- Strings live under `src/labels/`:
  - `labels.en.json` — English baseline; the key shape here is the type source.
  - `labels.ur.json` — Urdu translations; must have every key that appears in `labels.en.json` (a lint/test gate enforces parity).
  - `labels.types.ts` — TypeScript type derived from `labels.en.json` (e.g., `keyof typeof en`) so `t('missing.key')` is a compile error.
  - `index.ts` — exports `t(key: LabelKey): string`, reads active locale from `LanguageProvider`.
- **Runtime switch.** `state/i18n/LanguageProvider` holds `{ locale, setLocale }`, persists to `AsyncStorage` under `app.locale`, and re-renders subscribers on change. Defaults: device locale if `en` or `ur`, else `en`.
- **No hardcoded strings in screens.** Every user-facing string is a label key. Options JSON files under `src/config/options/` may hold either raw values (when the label equals the value verbatim) or `{value, labelKey}` pairs (when the DB value must stay stable across locales — always the case for values persisted to `db-schema.users`).
- **RTL.** Urdu is right-to-left. On locale change to `ur`, the app calls `I18nManager.forceRTL(true)` and reloads (per RN docs). The catalog components use logical layout (`marginStart` / `marginEnd`, `textAlign: 'start'`) so they mirror correctly. Icons that convey direction (chevrons, back arrows) mirror automatically via `I18nManager.isRTL`. Fonts: Plus Jakarta Sans has no Urdu glyphs — a Noto Nastaliq Urdu (or Jameel Noori Nastaleeq) font file is added to `src/assets/fonts/` and selected when `locale === 'ur'` (see `theme.md §5.4`). **[Open]** confirm exact Urdu font choice at scaffold time.

### 15.7 Push notifications

- `services/push/expoPush.ts` requests permissions, obtains an Expo push token, POSTs to `/v1/push-tokens`.
- Backend fans out to Expo — the frontend never calls the Expo push API directly (per `backend-config → pushNotifications.notes`).
- Incoming notifications while foregrounded surface an in-app toast (design token: `bg.elevated`); while backgrounded, they open the corresponding deep link (per §6.4).

### 15.8 Offline behavior

- **Auth**: cached refresh token gives silent re-auth when the network returns.
- **Data**: TanStack Query serves stale cache while offline; mutations queue via TanStack Query mutation retry (default backoff).
- **Chat**: outgoing messages are optimistically added to the local log and retried on reconnect. If they fail permanently, mark them as failed with a retry action — never silently drop.

---

## 16. Programming languages, frameworks, and versions

Updated 2026-07-20 to adopt **Expo SDK 56** (released 2026-05-21). Concrete transitive versions are picked by `npx expo install` at scaffold time; `package.json` after scaffold is the authoritative pin.

### 16.1 Baseline (must-match)

| Purpose | Version | Notes |
| --- | --- | --- |
| Runtime | **Expo SDK ~56.0.x** | Released 2026-05-21. Skips SDK 55; RN jumps from 0.83.6 → 0.85. |
| Framework | **React Native 0.85.x** | New Architecture (Fabric + TurboModules) is default. Hermes v1 is default JS engine. |
| Framework | **React 19.2.x** | |
| Language | **TypeScript ~6.0.3** | strict mode + `noImplicitAny` + `strictNullChecks` + `noUncheckedIndexedAccess` + `noImplicitReturns`. |
| Node | **≥ 20.19.4** | RN 0.85 minimum. Check `node --version` before scaffold. |
| iOS minimum | 16.4 | Xcode ≥ 26.4 when iOS validation resumes (deferred per §17.8). |

### 16.2 Install pattern

- Scaffold: `npx create-expo-app@latest knotify-frontend --template blank-typescript` (picks SDK 56).
- Every Expo-managed dependency: `npx expo install <pkg>`. This checks the installed SDK version and picks a compatible version automatically — no manual pin drift.
- The following packages are installed via `npx expo install` in phase 1 story 1.7 (or when first needed) and their concrete versions are captured in `package.json`:
  - Navigation: `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`, `react-native-screens`, `react-native-safe-area-context`
  - Storage: `@react-native-async-storage/async-storage`, `expo-secure-store`
  - Fonts / splash / image: `expo-font`, `expo-splash-screen`, `expo-image`
  - Camera / picker / notifications / location / updates: `expo-camera`, `expo-image-picker`, `expo-notifications`, `expo-location`, `expo-updates`
  - Motion / gestures / bottom sheets: `react-native-reanimated`, `react-native-gesture-handler`, `@gorhom/bottom-sheet`
  - Icons: `lucide-react-native`, `react-native-svg`
  - Cross-platform date picker: `@react-native-community/datetimepicker`

### 16.3 Non-Expo-managed pins (installed via npm/yarn)

| Purpose | Library | Version |
| --- | --- | --- |
| Auth SDK | `aws-amplify` | latest 6.x (Cognito SRP) |
| Server state | `@tanstack/react-query` | latest 5.x |
| Mocking | `msw` | latest 2.x |
| Testing | Jest | `^29.7.0` |
| Testing | `jest-expo` | matching SDK 56 (e.g. `^56.0.x`) |
| Testing | `@testing-library/react-native` | latest 13.x |
| Linting | ESLint | `^9.x` (SDK 56 baseline; formerly 8.x) |
| Linting | `eslint-plugin-tsdoc` | `^0.5.2` |
| Formatting | Prettier | `^3.8.3` |
| Path alias | `babel-plugin-module-resolver` | `^5.0.3` |
| Phone parse | `libphonenumber-js` | latest |
| Country flag | `react-native-country-flag` | latest (§17.25) |

### 16.4 New Architecture risk

RN 0.85 enables Fabric + TurboModules by default. Every third-party library above must be New-Architecture-compatible. All mainstream libraries listed are compatible as of 2026-07, but this is a phase-1 blocker to revisit if any of them crashes at runtime. Escape hatch: setting `newArchEnabled: false` in `app.json` disables NA and falls back to the legacy architecture — this is acceptable as a temporary unblock but must be logged as an [Open] item.

### 16.5 Forbidden libraries

Per `theme.md §1.3`: NativeWind / Tailwind, `react-native-paper`, `native-base`, `tamagui`, `@rneui/themed`, `styled-components`, any pre-styled UI kit.

---

## 17. Open questions / risks / assumptions

Explicit list — do not silently guess in later phases.

1. **[Resolved — 2026-07-20]** Expo SDK version: `~56.0.x` (released 2026-05-21). See §16 for the full matrix.
2. **[Open]** Server-state library choice. Recommendation: `@tanstack/react-query`. Alternatives: SWR, Redux Toolkit Query.
3. **[Open]** AppSync client. Recommendation: `aws-amplify` GraphQL client (piggybacks Cognito auth). Alternative: `@apollo/client` + subscriptions link.
4. **[Open]** Mock strategy. Recommendation: MSW. Alternative: hand-rolled `mockHttpClient.ts`.
5. **[Open]** Form library. Not needed in v1. `react-hook-form` when a multi-field form gets complex.
6. **[Open]** Analytics + logging library. None in v1.
7. **[Open]** E2E framework (Detox / Maestro / Playwright). Deferred; introduce at chat phase or later.
8. **[Resolved — deferred per phase, 2026-07-19]** iOS local tooling (Xcode + simulator) is **not** installed on the developer machine as of 2026-07-19. Every phase designs and codes cross-platform, but iOS validation is deferred and logged in that phase's `context.md` handoff. Standing policy until Xcode is installed. Revisit whenever tooling changes.
9. **[Open]** Username rename metadata. `db-schema` mentions a "1 per 30 days" rate limit enforced in the API layer; `backend-config → restApi.routes.profile` does not currently expose the "last-rename" timestamp. The UI needs it to render "next rename allowed on X". Confirm with backend team; treat as follow-up until confirmed.
10. **[Open]** Dark-mode reference screenshots. Only light-mode screenshots exist. Dark mode is best-effort; visual parity is not validated in v1.
11. **[Open]** Deep-link route table. Skeleton file created in phase 1; concrete routes filled during push-notifications and chat phases.
12. **[Open]** Automated codegen for `src/types/api/*` from `db-schema.json`. Out of scope for v1; flagged as an engineering improvement.
13. **[Assumption]** ~~English is the only locale in v1.~~ Superseded: English **and** Urdu are both required from v1 per §15.6; runtime language switch exposed from onboarding page 1.
14. **[Assumption]** Photo uploads deferred until the backend photo pipeline (`backend-config → media.phase12Placeholder=true`) is deployed. Placeholder avatars until then. Onboarding page 28's picker persists local URIs only; page 31's captured selfie is not sent to the backend in v1.
15. **[Assumption]** Group chats are out of scope. Only 1-to-1 rooms are supported by `backend-config → appsync.operations.createOrGetRoom(userId)`.
16. **[Risk]** The dev backend being down means integration testing cannot happen against real endpoints until it's brought back up. The mock layer must be treated as a **development aid, not a truth source** — its handlers may drift from real backend behavior. First live-backend contact must include a contract-verification pass on every consumed endpoint.
17. **[Risk]** Cognito refresh-token revocation edge cases (user changes password, admin invalidates) can leave the client with an unusable refresh token. `AuthProvider` must handle 401/403 on refresh as a silent sign-out, not a crash.
18. **[Risk]** AppSync WebSocket lifecycle bugs are notoriously hard to test manually. Introduce integration coverage as soon as chat is scoped.
19. **[Resolved — file alignment complete]** As of 2026-07-17, `codingprinciples.md → Component Catalog` and `theme.md §0 / §9 / §15.1` have been rewritten to match §2a. All three documents (this file, `codingprinciples.md`, `theme.md`) now describe the same component-first, rule-of-one, configurable-props policy. Future divergence must be caught in review — no doc-drift is allowed.
20. **[Open]** Preference fields (onboarding pages 25 + 26). The multi-select UIs are built but their mapping onto `users.preferences` JSONB (and the backend-derived `preference_vector`) is deferred. Decide the field key and value shape before phase B8 lands.
21. **[Open]** Sibling submission contract. The `siblings` table is 1:N with users; §11.2 assumes the client sends the array inside the same `PATCH /profile/me` body under a `siblings` key. Backend team to confirm whether it should instead be a separate `POST /siblings` call, transactionally coupled to profile completion.
22. **[Resolved — 2026-07-19]** Urdu font selection: **Noto Nastaliq Urdu** (Google Fonts, SIL Open Font License). Reason: Nastaliq style matches reader expectations, license is clean for App Store / Play Store redistribution, Google-maintained. Phase 1 bundles the `.ttf` under `src/assets/fonts/NotoNastaliqUrdu-Regular.ttf` (and `-Bold.ttf` if the Urdu weight registry demands it), loads it in `App.tsx` via `useFonts`, and registers it in `theme.md §5.4` as the Urdu font family. Text components must select the Urdu font family when the active locale is Urdu (wired through `LanguageProvider` + a `useLocalizedFontFamily()` hook).
23. **[Open]** Phone verification method (onboarding page 29). Options: Cognito's built-in phone attribute + SMS OTP, a Twilio-driven flow, or skip verification (accept the number as entered) in v1. Backend-config does not currently expose a phone-verification endpoint. Default recommendation: accept the number as entered in v1 (validation only via `libphonenumber-js`); wire an OTP flow when the backend surface exists.
24. **[Open]** Face-verification library (onboarding page 31). Candidates: `expo-camera` with its face-detection add-on, or `react-native-vision-camera` + `vision-camera-face-detector`. `expo-camera` is lighter and stays in the Expo managed workflow; `vision-camera` is more accurate but heavier. Default recommendation: `expo-camera` until accuracy proves insufficient.
25. **[Open]** Country flag library. Recommendation: `react-native-country-flag` (SVG-based, small footprint, ISO2 codes match `countries.ts`). Confirm at scaffold; the registry pattern in §5.2 accommodates any swap.
26. **[Resolved — 2026-07-19]** RTL reload UX: **confirm-then-reload**. On locale switch, show a modal ("The app will restart to apply the new layout. Continue? [Cancel] [Restart]") before calling `I18nManager.forceRTL(nextIsRTL)` followed by `Updates.reloadAsync()` from `expo-updates`. Phase 1 installs `expo-updates` and exposes `LanguageProvider.setLocale(locale)` which internally drives the confirm → forceRTL → reload chain. Cancel from the confirm modal is a no-op (locale stays put). Final modal copy is refined at the /implement-phase 19 brainstorm; the confirm gate itself is fixed.

---

## 18. What this document does not cover (by design)

- **Concrete PRDs for each phase.** Those live under `implementationplan/phase-<n>-<short>.md`, generated by `/create-plan`. This doc feeds that generation but does not duplicate it.
- **Coding rules.** Owned by `codingprinciples.md`. Do not restate here.
- **Visual design tokens.** Owned by `theme.md`. Do not restate here.
- **Screen-to-screenshot mapping.** Owned by the per-batch brainstorm in `phasebrainstorms/`. This doc defines the process, not the mapping.
- **Backend implementation.** Owned by `knotify-backend/`. This doc only records what the frontend consumes.
- **CI/CD pipeline.** Owned by `cicd.md` (currently a skeleton). Filled in when a `backenddeveloper` picks it up.

---

_End of architecture guide._
