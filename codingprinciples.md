# Coding Principles — test-project-new

Used together with `C:\Users\syede\Claude-Master\engineeringprinciples.md`. If sections below are empty, the workspace engineeringprinciples apply by default. Fill these in only when this project needs principles that differ from or extend the workspace defaults.

The rules in this file have been checked for conflicts with the workspace `engineeringprinciples.md` and are intended to _extend_ — not contradict — them. Where the workspace file already covers a topic (TDD, DRY rule of three, no premature abstraction, definition of done, error handling, no commented-out code, etc.), this file does not restate it.

## General principles

- Keep modules small and single-purpose. If a file does more than one thing, split it.
- No hardcoded user-facing strings or style values inside components — both live in centralized files (see Frontend principles below). This is a project-specific extension of "Explicit over implicit" from the workspace principles.

## Frontend principles

### Component style

- Use **React Native functional components only**. No class components.
- Components must be **lean**: rendering + minimal local state. Anything beyond that (data shaping, formatting, validation, side-effect logic) belongs in a helper.
- Props must be explicitly typed (see TypeScript section) and destructured at the top of the component.
- One component per file. File name matches the component name (PascalCase, `.tsx`).
- **Catalog components are mandatory.** Screens MUST import the following from `@/components` for the roles they cover: `Button`, `IconButton`, `TouchableArea`, `TextInput`, `FormField`, `Chip`, `ChipRow`, `Card`, `Screen`. Screens MAY NOT import `TouchableOpacity`, `Pressable`, `TextInput` (as the `react-native` primitive), `Switch`, or `Modal` directly from `react-native`. New variants are added to the catalog component, never inlined in a screen. See **Component Catalog** below.

### Component Catalog

The reusable component catalog under `src/components/` is the only way screens build interactive UI. The catalog is closed-API by design.

**Catalog (9 components):**

- `Button` — every text button. Variants: `primary`, `secondary`, `ghost`.
- `IconButton` — icon-only 44×44 tap target.
- `TouchableArea` — generic tappable container for cards / list rows.
- `TextInput` — single- or multi-line text input.
- `FormField` — label + input + inline error wrapper.
- `Chip` — display-only pill (icon + label).
- `ChipRow` — wrapping flex row of Chips.
- `Card` — visual container. Variants: `standard`, `muted`.
- `Screen` — outer wrapper with safe-area + horizontal page padding.

**Rules (A+ discipline):**

1. **Closed prop surfaces.** Every catalog component has a documented `Props` interface. Adding a prop requires (a) a second screen demonstrating the need, (b) TSDoc on the new prop, (c) a corresponding `theme.md` §9 update if it changes visuals.
2. **No `style` / `containerStyle` / `textStyle` / `contentContainerStyle` prop on any catalog component.** Ever. Composition uses Rule 3 or wrapping `<View>`s.
3. **Typed spacing-scale props added reactively.** When wrapping a catalog component in `<View style={{ marginTop: … }}>` is repeated in ≥3 screens, the component may add `marginTop?: keyof Theme['spacing']`. Raw numbers stay forbidden.
4. **Variants are string-literal unions, not strings.** `variant: 'primary' | 'secondary' | 'ghost'`, never `variant: string`.
5. **Screens never import `TouchableOpacity`, `Pressable`, `TextInput`, `Switch`, or `Modal` from `react-native`.** Enforced by ESLint (`no-restricted-imports`) scoped to `src/screens/**`.
6. **Composition through children, not config.** No `extraSlot`, `rightAccessory`, or other slot-like props. Compose in JSX.
7. **No magic defaults.** Required props have no `?`. Optional defaults are documented in TSDoc. No prop default depends on another prop.

**Adding a new component:**

- Demonstrate ≥2-screen need (rule of two, not rule of three — this is stricter).
- TSDoc on every exported symbol.
- Add a `theme.md` §9 entry annotated as "Implemented as …".
- Test file at `__tests__/components/<Name>.test.tsx` covering every variant, every interactive prop, disabled/loading states, `accessibilityLabel`, `onPress`, light + dark theme.

**Legacy footnote:** `LoginScreen.tsx`, `RegisterScreen.tsx`, and `LandingScreen.tsx` predate this rule. They use inline patterns and carry a file-top `eslint-disable no-restricted-imports` directive. They conform incrementally when touched for unrelated work. New code does not get the same grace.

### Styling

The full design system — color palette, semantic color roles, typography, spacing, radii, shadows, light/dark theming, and the canonical component pattern — lives in **`theme.md`** at the project root. `theme.md` is authoritative. The rules below summarize the project-wide invariants that derive from it; if anything in this section appears to conflict with `theme.md`, treat `theme.md` as the source of truth and update this file.

- Use **React Native `StyleSheet`** only. No third-party styling libraries (no NativeWind/Tailwind, no styled-components, no `react-native-paper`, no `tamagui`, no `@rneui/themed`).
- **No inline style objects of any kind.** This includes objects built from theme tokens (`style={{ backgroundColor: theme.colors.accent.primary }}` is just as forbidden as hardcoded literals). All concrete style values live inside `StyleSheet.create`. JSX may only reference style keys — `style={styles.button}` or, for composition, `style={[styles.button, disabled && styles.buttonDisabled]}`.
- **The canonical pattern is a `createStyles(theme)` factory** invoked inside the component and memoized with `useMemo`. This is what allows a static `StyleSheet` to consume runtime theme tokens (and respond to light/dark mode). See `theme.md` §15 for the exact pattern — match it.
- **Design tokens are split by domain into individual single-source files** under `src/theme/`. Each file is the sole place to edit a given domain:
  - `src/theme/theme.ts` — colors (light + dark palettes), spacing, radii, shadows
  - `src/theme/typography.ts` — font families, font sizes, font weights, text-style presets
  - `src/theme/ThemeProvider.tsx` — `useTheme()` context provider
  - `src/theme/index.ts` — re-exports for clean imports
  - `src/theme/commonStyles.ts` — `createCommonStyles(theme)` factory for shared layout fragments. Rule-of-two threshold; layout only.
- Rationale: a change to a color edits exactly one file (`theme.ts`); a change to a font edits exactly one file (`typography.ts`). The split exists because colors and fonts are different concerns with different change cadences and different consumers — but each domain still has a single source of truth, in the spirit of "edit in one place." A single combined `styles/styles.ts` is **not** used. Shared layout fragments live in `commonStyles.ts`; catalog-component styles live inside each component file; screen-specific layout stays in the screen's local `createStyles`.
- **No raw color hexes, font names, font sizes, spacing numbers, or border-radius numbers anywhere outside the theme files.** Components consume them via `useTheme()` and `textStyles.*`.

### Hooks

- Use React Native hooks (`useState`, `useEffect`, `useCallback`, `useMemo`, etc.) where appropriate.
- Keep hook bodies **lean** — a `useEffect` should do one thing. If the effect needs more than a few lines, extract the logic into a helper and call it from the effect.
- Always declare the dependency array explicitly. Never omit it.
- Cleanup functions are required for any effect that subscribes, sets a timer, or opens a resource.

### Asynchronous data and I/O

Any operation that does not return synchronously must be written as asynchronous code. This includes — but is not limited to — loading data into a component on mount, calling a backend, hitting an external API or URL, reading from device storage, file I/O, and timers.

- Use `async / await`. **No raw `.then()` / `.catch()` chains** and no callback-style APIs.
- Side-effecting async work inside a component runs from a `useEffect`, never directly in the render body. Define an `async` function inside the effect and invoke it; do not mark the effect callback itself `async` (React expects an effect to return either nothing or a cleanup function, not a Promise).
  ```ts
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const data = await fetchUserProfile(userId);
      if (!cancelled) setProfile(data);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);
  ```
- Always model the three states explicitly: **loading**, **ready**, **error**. Components must render a loading state while data is in flight and an error state when the call fails — never a blank screen.
- Network and storage calls live in helpers (e.g., `Helper/apiHelper.ts`, `Helper/storageHelper.ts`), not inline in components. The helper exposes a typed async function; the component awaits it.
- Errors from `await` are caught locally and surfaced (component error state, log entry) — never swallowed in an empty `catch`. (Workspace rule: errors propagate explicitly.)
- Cancel or guard against late responses on unmount — either via an `AbortController` passed into `fetch`, or via the `cancelled` flag pattern shown above. This prevents `setState` on an unmounted component.
- Return types of async helpers are `Promise<T>` with `T` fully typed — never `Promise<any>`.

### Helpers

- All reusable, non-rendering functionality lives in a single folder: **`src/Helper/`**.
- Helpers are grouped by concern (e.g., `src/Helper/dateHelper.ts`, `src/Helper/validationHelper.ts`, `src/Helper/storageHelper.ts`).
- Helpers must be pure where possible (no side effects, no React state).
- Extraction follows the workspace **rule of three**: two similar pieces of code stay duplicated; on the third occurrence (or sooner if the shared meaning is already obvious), extract into `Helper/`. Don't extract speculatively.

### Labels and i18n

- All user-facing strings (labels, button text, messages, errors) live in a single file: **`src/labels/labels.json`**.
- Each label entry has a key and per-language values, with `en` as the required default. Schema:
  ```json
  {
    "welcome_title": {
      "en": "Welcome",
      "es": "Bienvenido"
    },
    "submit_button": {
      "en": "Submit"
    }
  }
  ```
- A shared TypeScript type for the labels structure lives in `src/labels/labels.types.ts` so components get autocomplete and compile-time checking on label keys.
- Components import the **default English value** for the label they need:
  ```ts
  import labels from '@/labels/labels.json';
  // ...
  <Text>{labels.welcome_title.en}</Text>
  ```
- No raw string literals inside components. If a label is missing from `labels.json`, add it there first, then reference it.
- A label-resolver helper may be added later (`src/Helper/labelHelper.ts`) once a runtime language switch is needed — keep components importing through the same indirection so the switch is non-breaking.

## Backend principles

## Language-specific principles

### TypeScript (mandatory for all frontend code)

- **The entire frontend is written in TypeScript.** No plain `.js`/`.jsx` files in the app source — only `.ts` / `.tsx`. Config files (e.g., `babel.config.js`, `metro.config.js`) may remain JavaScript where the toolchain requires it.
- `tsconfig.json` runs in **strict mode**: `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitReturns": true`.
- **No `any`.** If a type is genuinely unknown, use `unknown` and narrow before use. `any` requires an inline justification comment and is reviewed as a code smell.
- **No non-null assertions (`!`)** unless the invariant is enforced one line above and noted in a comment.
- Prefer `interface` for object shapes that may be extended; prefer `type` for unions, intersections, and mapped types.
- Component props are declared with an explicit `Props` interface or type alias above the component. No inline anonymous prop types.
- Function signatures are fully typed — explicit parameter types and explicit return types on exported functions. Inferred return types are acceptable for short, non-exported helpers.
- Use `readonly` for arrays and object fields that should not mutate after construction.
- Discriminated unions over boolean flags when modeling alternative states (e.g., `{ status: 'loading' } | { status: 'ready'; data: Foo } | { status: 'error'; error: Error }`).
- Enums are avoided in favor of string literal union types (`type Status = 'idle' | 'loading' | 'ready'`).
- `import type { ... }` is used for type-only imports to keep the runtime bundle clean.

### Documentation comments (TSDoc)

This project uses **TSDoc** for API-level documentation. This is a deliberate, scoped extension of the workspace "minimal comments" rule (`engineeringprinciples.md` line 109), not an override of it: inline "what" comments inside function bodies remain banned. TSDoc blocks document the _contract_ of an exported symbol so it surfaces in IntelliSense, hover tooltips, and onboarding.

- **Every exported component, hook, helper, and type** has a TSDoc block (`/** ... */`) directly above it.
- A TSDoc block describes purpose, parameters, return value, thrown errors (if any), and any non-obvious behavior or constraint. Use the standard tags: `@param`, `@returns`, `@throws`, `@example`, `@deprecated`.
- Example:
  ```ts
  /**
   * Loads the user profile for the given user id.
   *
   * Performs a network call against the profile API. The caller is responsible
   * for cancelling on unmount (see Asynchronous data and I/O principles).
   *
   * @param userId - The id of the user whose profile to load.
   * @returns The resolved {@link UserProfile}.
   * @throws {ApiError} When the network call fails or returns a non-2xx status.
   */
  export async function fetchUserProfile(userId: string): Promise<UserProfile> { ... }
  ```
- **Inline body comments remain minimal.** Inside a function body, only add a comment when the _why_ is non-obvious — a constraint, a workaround, a subtle invariant. Never describe what the next line of code does; the names should already say that.
- No commented-out code. No "removed X here" markers. Version control is the history.
- TSDoc is enforced by lint rules (`eslint-plugin-tsdoc`) on exported symbols. A missing or malformed TSDoc block on an exported symbol is a lint error.

### React Native

- Functional components + hooks only.
- Prefer `const` over `let`. No `var`.
- Async work uses `async/await`, not raw `.then()` chains.
- No direct DOM-style assumptions — this is React Native, not React DOM.

## Testing principles

The workspace TDD rules apply in full. Project-specific extensions:

- Every component has a test under `__tests__/components/<ComponentName>.test.tsx`. Every helper has a test under `__tests__/helpers/` (or its own colocated `*.test.ts`). Screen integration tests live under `__tests__/`.
- Every helper in `Helper/` has its own unit test file.
- Tests use **Jest + React Native Testing Library**, written in TypeScript (`.test.tsx` / `.test.ts`).
- A component's test suite covers, at minimum: render without crash, prop variations, user interaction (where applicable), and any conditional rendering branches. Pure styling concerns fall under the workspace visual-work carve-out and are not unit-tested.
- **Catalog components are tested centrally and exhaustively.** A screen's test suite does NOT re-assert the visual rendering of a catalog component it uses — it asserts only the wiring (correct props passed, `onPress` invokes the right handler, conditional rendering branches). This is the testing-effort reduction that mandatory components deliver.
- A screen that uses ONLY catalog components and `commonStyles.ts` (no local `createStyles`) requires only wiring tests. A screen with screen-specific layout still tests render-without-crash + prop variations as before.
