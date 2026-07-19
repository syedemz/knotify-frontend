# App Theme Guide — Muslim Singles Dating & Social App

> **Purpose of this document:** This file is the single source of truth for the visual design system of this React Native application. Any agent or developer building UI for this app **MUST** read this file first and follow its rules without deviation. The `frontend-design` skill is helpful for general aesthetic guidance, but **this document overrides it** wherever they conflict, because consistency across screens matters more than per-screen creativity here.

---

## 0. Critical Rules for the Agent

These rules are non-negotiable. Before writing any UI code, the agent MUST confirm it will follow all of them.

1. **Use ONLY the libraries listed in §1 (Approved Libraries).** Do not introduce any other dependency unless the user explicitly approves it in chat. If unsure, ask the user before installing.
2. **DO NOT** invent new colors, fonts, spacing values, or radii. Use **only** the tokens defined in this document.
3. **DO NOT** hardcode any style values (colors, fonts, sizes, spacing) inline in components. Every value must come from the theme files described in §2.
4. **All theme tokens live in ONE file**: `src/theme/theme.ts`. Changing a color anywhere in the app must require editing only this file.
5. **All font definitions live in ONE file**: `src/theme/typography.ts`. Changing a font family anywhere in the app must require editing only this file.
6. **Always import from the theme** — never duplicate values. Example: `import { colors, spacing, radii } from '@/theme/theme'`.
7. **Both light and dark mode must be supported.** Every component must read colors via the `useTheme()` hook, never directly from a hardcoded palette.
8. **The frontend-design skill's advice on "bold maximalist or distinctive" aesthetics DOES NOT APPLY to this app.** This app's aesthetic is already defined: clean, friendly, minimalist with selective color pops. Do not deviate.
9. **Every UI element is imported from `@/components`, never built ad-hoc — from its first use.** A screen that needs a button uses `<Button variant="primary" />`; it does not assemble a button from `<Pressable>` and `<Text>`. The same rule applies to text (`<Text>` component with `variant` and `color` props), images (`<Avatar>`, `<Image>`, `<Illustration>`), containers (`<Card>`, `<Box>`, `<Section>`), overlays (`<Modal>`, `<BottomSheet>`), and every other visual element. The catalog is **open-ended**, not fixed — any new visual pattern joins as a new component on first use (no "rule of two", no "rule of three"). Components accept **configurable-appearance props** (color, size, spacing, padding, radius, background) typed as keys of the theme token maps, never as raw values. See §9 for the pattern-to-component index, §15 for the canonical implementation pattern, and `architecture.md §2a` for the full mandate.

---

## 1. Approved Libraries (REQUIRED)

> **This is an Expo project.** All library choices below are made with that in mind. The agent MUST use these and ONLY these unless the user explicitly approves something new.

### 1.1 Required Libraries (always use these)

| Purpose                      | Library                                                                                         | Install command                                                                                                                                              | Notes                                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Font loading                 | `expo-font`                                                                                     | `npx expo install expo-font`                                                                                                                                 | Loads custom `.ttf` files at app startup. See §5.4 for usage.                            |
| Splash screen control        | `expo-splash-screen`                                                                            | `npx expo install expo-splash-screen`                                                                                                                        | Used together with `expo-font` to keep splash visible until fonts are ready.             |
| Icons                        | `lucide-react-native`                                                                           | `npx expo install lucide-react-native react-native-svg`                                                                                                      | Outlined icon set. Matches the app's visual style. Requires `react-native-svg` peer dep. |
| Navigation                   | `@react-navigation/native` + `@react-navigation/native-stack` + `@react-navigation/bottom-tabs` | `npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context` | Use bottom-tabs for the main 5-tab layout (Marriage / Explore / Jamaa / Chat / Menu).    |
| Safe-area handling           | `react-native-safe-area-context`                                                                | (installed via React Navigation above)                                                                                                                       | Wrap screen contents in `<SafeAreaView edges={['top','bottom']}>`.                       |
| Animation (only when needed) | `react-native-reanimated`                                                                       | `npx expo install react-native-reanimated`                                                                                                                   | Use for any custom animation. **Do not** use the legacy `Animated` API.                  |
| Gesture handling             | `react-native-gesture-handler`                                                                  | `npx expo install react-native-gesture-handler`                                                                                                              | Required for swipe interactions (cards, sheets).                                         |

### 1.2 Conditionally-Approved Libraries (use only when the feature actually requires it)

| Purpose                           | Library                                     | When to use                                                                                                                                          |
| --------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bottom sheets / modal sheets      | `@gorhom/bottom-sheet`                      | When building draggable bottom sheets like the Filters or Sort modals. Install with `npx expo install @gorhom/bottom-sheet`.                         |
| Image handling                    | `expo-image`                                | For any non-trivial image (avatars, illustrations, remote images). Install with `npx expo install expo-image`. Prefer over `react-native`'s `Image`. |
| Async storage                     | `@react-native-async-storage/async-storage` | For persisting user preferences (theme mode, onboarding state). Install with `npx expo install @react-native-async-storage/async-storage`.           |
| Forms (only if forms get complex) | `react-hook-form`                           | Only for multi-field forms with validation. For simple inputs, plain `useState` is fine.                                                             |
| Linear gradients                  | `expo-linear-gradient`                      | Only if a screen genuinely needs a gradient. The app's aesthetic is mostly flat — gradients should be rare.                                          |

### 1.3 FORBIDDEN Libraries (do NOT install these — they conflict with the design system)

The agent must **never** install any of the following, as they bring their own design opinions that clash with this theme:

- ❌ `nativewind` / Tailwind for React Native — conflicts with the centralized theme tokens
- ❌ `react-native-paper` — Material Design opinions clash with the app's custom aesthetic
- ❌ `native-base` — same reason; also deprecated
- ❌ `tamagui` — its own theming system competes with ours
- ❌ `@rneui/themed` (React Native Elements) — same reason
- ❌ `styled-components` — adds runtime overhead; we use `StyleSheet.create` instead
- ❌ Any UI kit that ships with its own pre-styled components

### 1.4 Styling Approach

Use **`StyleSheet.create`** from React Native, combined with theme tokens consumed via the `useTheme()` hook. The canonical pattern is a `createStyles(theme)` **factory** invoked inside the component and memoized with `useMemo` (see §15 for the exact pattern). Components compose styles by referencing keys from the returned `StyleSheet` object — `style={styles.button}` — never by inlining objects.

Do not use:

- ❌ Inline style objects of ANY kind — including objects built from theme tokens (`style={{ backgroundColor: colors.accent.primary }}` is forbidden, just like hardcoded literals are)
- ❌ External CSS-in-JS libraries
- ❌ Tailwind-style className utilities

The only acceptable form of style composition at the call site is an **array of `StyleSheet` references** with optional conditional toggles, e.g. `style={[styles.button, disabled && styles.buttonDisabled]}`. This keeps every concrete style value inside a `StyleSheet.create` block and out of JSX.

Shared layout fragments live in `src/theme/commonStyles.ts` as a `createCommonStyles(theme)` factory, consumed *inside components* (never inside screens). See `codingprinciples.md` → Styling for the file-organization rules.

### 1.5 If a Library You Need Is Not Listed

If the agent encounters a feature that genuinely cannot be built with the libraries above, it must:

1. **Stop and ask the user** before installing anything.
2. Explain why the existing libraries are insufficient.
3. Propose 1–2 specific alternatives with trade-offs.
4. Wait for explicit approval.

Do not silently install new dependencies.

---

## 2. File Structure (REQUIRED)

The agent must create and use exactly this structure for theme-related files:

```
src/
└── theme/
    ├── theme.ts          ← All design tokens (colors, spacing, radii, shadows). SINGLE SOURCE.
    ├── typography.ts     ← All font families, sizes, weights, text styles. SINGLE SOURCE.
    ├── ThemeProvider.tsx ← React context provider that supplies light/dark theme.
    └── index.ts          ← Re-exports everything for clean imports.
```

When the user wants to change a color globally → edit `theme.ts`.
When the user wants to change a font globally → edit `typography.ts`.
**No other file in the codebase should ever define a color or font directly.**

---

## 3. Brand Identity

**App name placeholder:** the app is in the social/dating space, oriented toward Muslim singles seeking marriage and community.

**Aesthetic in three words:** _Friendly. Clean. Approachable._

**Visual signatures:**

- Warm coral-pink as the primary action color
- Black-and-white line-art illustrations with selective color pops
- Pill-shaped (fully-rounded) primary buttons
- Generous white space — never cram content
- Bold, geometric sans-serif type with strong weight contrast
- Soft, rounded card containers (16–20px corners)
- Micro-dot notification indicators (small filled circles in the brand pink)

**What this app is NOT:**

- Not edgy, dark, or moody
- Not maximalist, brutalist, or experimental
- Not corporate, sterile, or grayscale
- Not overly decorative or ornamental

---

## 4. Color System

### 4.1 Light Mode Palette (PRIMARY — observed from reference screens)

```ts
// Brand colors
const brandPink = "#E91E63"; // Primary CTA, brand accent, "Confirm" buttons, active checkmarks
const brandPinkSoft = "#F8BBD0"; // Disabled state of primary button, subtle pink fills
const brandPinkBg = "#FCE4EC"; // Very light pink for badge backgrounds, highlight rows
const brandMint = "#4ECDC4"; // Secondary CTA, profile ring, success-adjacent actions
const brandMintSoft = "#A8E6E1"; // Disabled secondary button
const brandOrange = "#F77F3F"; // Tertiary accent, avatar fills, "Menu" tab active
const brandGold = "#A88A2C"; // Premium / advanced features label color
const brandGoldBg = "#F5EFD9"; // Premium section background

// Neutrals
const black = "#0E1116"; // Primary text, headings
const gray900 = "#1A1D23";
const gray700 = "#4A4F58"; // Secondary text
const gray500 = "#8B9099"; // Tertiary text, placeholder, inactive tab labels
const gray300 = "#D4D7DC"; // Borders, dividers
const gray200 = "#E8EAED"; // Card borders, subtle separators
const gray100 = "#F4F5F7"; // Input backgrounds, subtle surfaces
const gray50 = "#FAFAFB"; // Page section backgrounds
const white = "#FFFFFF"; // Primary background

// Semantic
const success = "#4ECDC4"; // Reuses brandMint
const error = "#E63946";
const warning = "#F4A261";
const info = "#5B8DEF";
```

### 4.2 Dark Mode Palette (extrapolated — adjust after user testing)

> **Note to agent:** The user did not provide dark mode reference screens. The values below are extrapolated using accessibility-tested contrast ratios. They preserve the same brand hues but adjust luminance for dark backgrounds. If the user later provides dark mode references, update this section.

```ts
// Brand colors stay perceptually similar but slightly desaturated for dark backgrounds
const brandPinkDark = "#FF4081"; // Slightly brighter pink — pops on dark surfaces
const brandPinkSoftDark = "#7A2547";
const brandPinkBgDark = "#3D1828";
const brandMintDark = "#5DDED4";
const brandOrangeDark = "#FF9A5C";
const brandGoldDark = "#D4B85A";
const brandGoldBgDark = "#2A2418";

// Neutrals for dark mode
const bgPrimaryDark = "#0E1116"; // Page background
const bgSurfaceDark = "#181B22"; // Cards, elevated surfaces
const bgElevatedDark = "#22262E"; // Modals, sheets
const borderDark = "#2D323B";
const dividerDark = "#23272E";
const textPrimaryDark = "#F4F5F7";
const textSecondaryDark = "#A8ADB7";
const textTertiaryDark = "#6B7280";
const inputBgDark = "#1F2229";
```

### 4.3 Semantic Color Roles

The agent must use **semantic names** in components, not raw color names. This is what enables theme switching with one edit.

| Role                     | Light           | Dark                | Used for                          |
| ------------------------ | --------------- | ------------------- | --------------------------------- |
| `bg.primary`             | `white`         | `bgPrimaryDark`     | Main screen background            |
| `bg.surface`             | `white`         | `bgSurfaceDark`     | Cards, list rows                  |
| `bg.elevated`            | `white`         | `bgElevatedDark`    | Modals, bottom sheets             |
| `bg.input`               | `gray100`       | `inputBgDark`       | Input field background            |
| `bg.muted`               | `gray50`        | `bgSurfaceDark`     | Subtle section backgrounds        |
| `bg.premium`             | `brandGoldBg`   | `brandGoldBgDark`   | Premium feature sections          |
| `text.primary`           | `black`         | `textPrimaryDark`   | Headings, primary content         |
| `text.secondary`         | `gray700`       | `textSecondaryDark` | Body text, descriptions           |
| `text.tertiary`          | `gray500`       | `textTertiaryDark`  | Placeholder, inactive labels      |
| `text.inverse`           | `white`         | `black`             | Text on colored buttons           |
| `text.brand`             | `brandPink`     | `brandPinkDark`     | Highlighted text, "No preference" |
| `text.premium`           | `brandGold`     | `brandGoldDark`     | Premium-tier labels               |
| `border.default`         | `gray200`       | `borderDark`        | Card borders, list dividers       |
| `border.strong`          | `gray300`       | `borderDark`        | Input borders                     |
| `accent.primary`         | `brandPink`     | `brandPinkDark`     | Primary CTA, brand accent         |
| `accent.primaryDisabled` | `brandPinkSoft` | `brandPinkSoftDark` | Disabled primary button           |
| `accent.secondary`       | `brandMint`     | `brandMintDark`     | Secondary CTA                     |
| `accent.tertiary`        | `brandOrange`   | `brandOrangeDark`   | Tertiary accent                   |
| `status.success`         | `success`       | `brandMintDark`     | Success states                    |
| `status.error`           | `error`         | `#FF6B6B`           | Errors, destructive               |
| `status.warning`         | `warning`       | `#FFB870`           | Warnings                          |
| `status.info`            | `info`          | `#7FA8FF`           | Informational                     |
| `notification.dot`       | `brandPink`     | `brandPinkDark`     | Small unread indicator dots       |

**Rule:** In components, ALWAYS access colors as `theme.colors.text.primary`, NEVER as `'#0E1116'` or `colors.black`.

---

## 5. Typography System

### 5.1 Font Families

Two font families are used throughout the app. Both must be defined in `typography.ts`, and both must be loaded via `expo-font` at app startup. See §5.4 for the exact loading procedure.

```ts
export const fontFamily = {
  // Primary display + body font — friendly, geometric, high weight contrast
  // Recommended: "Plus Jakarta Sans" (free, open-source, matches the reference visual)
  // Alternates that match: "Manrope", "DM Sans", "Lexend"
  primary: {
    regular: "PlusJakartaSans-Regular",
    medium: "PlusJakartaSans-Medium",
    semibold: "PlusJakartaSans-SemiBold",
    bold: "PlusJakartaSans-Bold",
    extrabold: "PlusJakartaSans-ExtraBold",
  },
  // Optional secondary font for special accents (e.g., quoted text, decorative labels).
  // If unused at first, leave undefined. Do not import unless needed.
  display: undefined,
};
```

> **To change the font app-wide:** edit only the strings in `fontFamily.primary`. Every text element pulls from this object.

### 5.2 Type Scale

Define each text style as a complete preset. Components reference presets by name, not raw values.

| Preset name  | Size | Line height | Weight    | Use case                                     |
| ------------ | ---- | ----------- | --------- | -------------------------------------------- |
| `display.lg` | 32   | 40          | extrabold | Large hero text (rare)                       |
| `display.md` | 28   | 36          | extrabold | Onboarding question headers                  |
| `heading.xl` | 24   | 32          | bold      | Screen titles ("Tell us why you're on Muzz") |
| `heading.lg` | 20   | 28          | bold      | Section titles, "Never miss out!"            |
| `heading.md` | 18   | 26          | semibold  | Card titles, list section headers            |
| `heading.sm` | 16   | 24          | semibold  | Profile names, prominent row labels          |
| `body.lg`    | 16   | 24          | regular   | Body paragraphs, primary descriptions        |
| `body.md`    | 14   | 22          | regular   | Secondary descriptions, captions             |
| `body.sm`    | 13   | 20          | regular   | Helper text, metadata                        |
| `label.lg`   | 16   | 22          | semibold  | Button labels (primary buttons)              |
| `label.md`   | 14   | 20          | semibold  | Tab labels, list-row labels                  |
| `label.sm`   | 12   | 16          | medium    | Small badges, micro-labels                   |
| `caption`    | 11   | 14          | medium    | Smallest text — bottom tab labels            |

**Rule:** Components should use `<Text style={textStyles.heading.xl}>...</Text>` or a `<Heading variant="xl">` wrapper — never raw `fontSize`/`fontWeight` props.

### 5.3 Letter Spacing

- All-caps labels: `letterSpacing: 0.5`
- All other text: `letterSpacing: 0` (default)

### 5.4 Font Loading (Expo)

Custom fonts must be loaded at app startup using `expo-font` and `expo-splash-screen`. This is **mandatory** — without it, text will fall back to the system font and the app will look wrong.

**Step 1 — Install the packages**

```bash
npx expo install expo-font expo-splash-screen
```

**Step 2 — Add the font files**

Download Plus Jakarta Sans from [Google Fonts](https://fonts.google.com/specimen/Plus+Jakarta+Sans) and place the `.ttf` files in `src/assets/fonts/`. The exact filenames the agent should use (these match the `fontFamily` strings in `typography.ts`):

```
src/assets/fonts/
├── PlusJakartaSans-Regular.ttf
├── PlusJakartaSans-Medium.ttf
├── PlusJakartaSans-SemiBold.ttf
├── PlusJakartaSans-Bold.ttf
└── PlusJakartaSans-ExtraBold.ttf
```

> **Important:** The string passed to `expo-font`'s `useFonts` hook must EXACTLY match the `fontFamily` value used in `typography.ts`. If the file is named `PlusJakartaSans-Bold.ttf`, the key must be `'PlusJakartaSans-Bold'`. Mismatches are the #1 reason fonts silently fail to apply.

**Step 3 — Load fonts in the app entry point**

The agent must wire fonts into the root component (typically `App.tsx` or `app/_layout.tsx` for Expo Router). Use this exact pattern:

```tsx
// App.tsx (or app/_layout.tsx for Expo Router)
import { useEffect } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { ThemeProvider } from "./src/theme";

// Keep the splash screen visible while we load fonts
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    "PlusJakartaSans-Regular": require("./src/assets/fonts/PlusJakartaSans-Regular.ttf"),
    "PlusJakartaSans-Medium": require("./src/assets/fonts/PlusJakartaSans-Medium.ttf"),
    "PlusJakartaSans-SemiBold": require("./src/assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    "PlusJakartaSans-Bold": require("./src/assets/fonts/PlusJakartaSans-Bold.ttf"),
    "PlusJakartaSans-ExtraBold": require("./src/assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Don't render the app until fonts are ready
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return <ThemeProvider>{/* App navigation root goes here */}</ThemeProvider>;
}
```

**Step 4 — Verify**

Before declaring font setup complete, the agent must verify:

- [ ] All 5 weight files exist in `src/assets/fonts/`
- [ ] Every key in the `useFonts` object matches a `fontFamily` value in `typography.ts`
- [ ] Splash screen is held until `fontsLoaded` is true
- [ ] A test text element renders in the correct font (visually inspect — fallback to system font is the failure mode)

**Adding a new font weight or family later**

If the user later asks for a new weight (e.g., a Light weight) or a different font family, the agent must update **two** places only:

1. Add the entry to `fontFamily` in `src/theme/typography.ts`
2. Add the matching `useFonts` key + `.ttf` require in the app entry point

No other file should need to change.

---

## 6. Spacing System

A 4-point base scale. **Never** use values outside this list.

```ts
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16, // ← Default screen edge padding
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  giant: 64,
};
```

**Layout conventions:**

- **Screen horizontal padding:** `spacing.lg` (16px)
- **Vertical gap between cards in a list:** `spacing.md` (12px)
- **Gap between a label and its input:** `spacing.xs` (4px)
- **Gap between sections of a screen:** `spacing.xxl` (24px)
- **Padding inside a card:** `spacing.lg` (16px) horizontal, `spacing.md` (12px) vertical

---

## 7. Border Radius

```ts
export const radii = {
  none: 0,
  sm: 8, // Small chips, badges
  md: 12, // Input fields, small cards
  lg: 16, // Standard cards, list-row cards (matches "I'm ready to get married soon" cards)
  xl: 20, // Large containers, modal sheets
  xxl: 24, // Extra-rounded containers
  pill: 999, // Fully-rounded — primary buttons, tags, search bars
};
```

**Conventions:**

- **Primary buttons:** `radii.pill` (always fully rounded — matches "Enable location" and "Turn on notifications")
- **Secondary buttons:** `radii.pill`
- **Input fields:** `radii.md` (12px) for tall inputs; `radii.pill` for inline search bars
- **Cards / list rows:** `radii.lg` (16px)
- **Modal / bottom-sheet top corners:** `radii.xl` (20px)
- **Avatar:** circular (`radii.pill` or `borderRadius: width/2`)

---

## 8. Shadows & Elevation

This app uses very subtle shadows. Avoid heavy drop shadows.

```ts
export const shadows = {
  none: {},
  sm: {
    // Subtle elevation for cards
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2, // Android
  },
  md: {
    // Floating buttons, sticky bottom CTAs
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    // Modals, popovers
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
};
```

In dark mode, reduce all shadow opacities by ~50% (shadows are less visible on dark backgrounds anyway; rely more on `bg.elevated` to convey elevation).

---

## 9. Component Patterns

These are the canonical implementations. The agent must match them.

> **Every pattern in this section is a component under `@/components` from its first use.** The `Implemented as …` annotation below names the component and its primary props for each pattern. If a pattern has no annotation yet, the pattern still becomes a component the moment a screen needs it — the annotation is added to this file in the same PR (per `codingprinciples.md → Component Catalog → Adding a new component`, step 5). There are no "design-guidance-only" patterns; every pattern is a real, tested component.

### 9.1 Primary Button

- Background: `accent.primary`
- Text color: `text.inverse` (white)
- Text style: `label.lg`
- Padding: `spacing.lg` vertical, `spacing.xxl` horizontal
- Border radius: `radii.pill`
- Width: full-width by default with `spacing.lg` margin from screen edges
- Disabled state: background = `accent.primaryDisabled`, text remains white but at 70% opacity
- Pressed state: opacity drops to 0.85

**Implemented as `<Button variant="primary" />`. See §15.**

### 9.2 Secondary Button

- Background: `accent.secondary` (mint)
- Text color: `text.primary` (black on mint, NOT white — matches "Turn on notifications")
- All other rules same as primary

**Implemented as `<Button variant="secondary" />`.**

### 9.3 Tertiary / Ghost Button

- Background: transparent
- Text color: `accent.primary`
- Border: 1px solid `border.strong` (optional)
- All other rules same as primary

**Implemented as `<Button variant="ghost" />`.**

### 9.4 Input Field

- Background: `bg.input`
- Border: 1px solid `border.strong` on focus, transparent otherwise
- Text color: `text.primary`
- Placeholder color: `text.tertiary`
- Padding: `spacing.md` vertical, `spacing.lg` horizontal
- Border radius: `radii.md`
- Min height: 48px

**Implemented as `<TextInput />`. Wrap with `<FormField label="…" error={…}>` for labeled inputs.**

### 9.5 Search Bar

- Same as input field, but `radii.pill` and a leading search icon (`text.tertiary` color)

**Implemented as `<SearchInput />` with props `{ value, onChangeText, placeholder?, onSubmit?, size?: 'sm' | 'md' | 'lg' }`.**

### 9.6 List Row / Card

- Background: `bg.surface`
- Border: 1px solid `border.default` (or none if on a `bg.muted` parent — match the reference: subtle outline)
- Padding: `spacing.lg`
- Border radius: `radii.lg`
- Min height: 64px
- Press feedback: background tints to `bg.muted`

**Implemented as `<Card variant="standard" />`. Pressable variant: `<TouchableArea><Card>…</Card></TouchableArea>`.**

### 9.7 Selectable List Row (with checkbox/radio)

- Same as List Row
- Checkbox on the right side
- When selected: text color → `accent.primary`, checkbox fills with `accent.primary` and shows white checkmark
- Matches the "No preference" / nationality-list pattern

**Implemented as `<ListRowSelectable />` with props `{ label, selected, onToggle, control?: 'checkbox' | 'radio', description? }`.**

### 9.8 Bottom Tab Bar

- Background: `bg.surface`
- Top border: 1px solid `border.default`
- Height: 64px (excluding safe-area inset)
- Tab item: icon (24×24) above label (`caption` text style)
- Inactive state: icon + label = `text.tertiary`
- Active state: icon + label = `text.primary`, plus a small dot indicator above the icon if there's a notification (the dot uses `notification.dot` color, 6px diameter)

**Implemented as `<BottomTabBar />` (custom `tabBar` prop for `@react-navigation/bottom-tabs`) that internally renders `<TabBarItem />` per tab with props `{ icon, label, focused, hasNotification, onPress }`.**

### 9.9 Top Header Bar

- Background: `bg.primary`
- Height: 56px (excluding safe-area inset)
- Title: `heading.md`, centered
- Back button (left): chevron icon, 24×24, color `text.primary`
- Action button (right): text label like "Clear" in `label.md`, color `text.secondary` (or `accent.primary` if it's a positive action)

**Implemented as `<Header />` with props `{ title?, onBack?, action?: { label, onPress, tone?: 'default' | 'positive' | 'destructive' } }`.**

### 9.10 Tab Switcher (Social / Muzz style — top-of-screen tabs)

- Two tabs side-by-side, each taking 50% width
- Active tab: text in `text.primary`, weight bold, 2px underline below in `text.primary` color
- Inactive tab: text in `text.tertiary`, no underline
- Notification dot: 6px filled circle in `notification.dot`, positioned to the right of the tab label

**Implemented as `<TabSwitcher />` with props `{ tabs: { key, label, hasNotification? }[], activeKey, onChange }`.**

### 9.11 Modal / Bottom Sheet

- Background: `bg.elevated`
- Top corners: `radii.xl`
- Top handle: 4px tall, 40px wide, `border.strong` color, centered, `spacing.sm` from the top
- Padding: `spacing.lg` horizontal, `spacing.xl` vertical

**Implemented as `<Modal />` (full-screen) and `<BottomSheet />` (draggable, wraps `@gorhom/bottom-sheet`). Shared props: `{ visible, onDismiss, children, padding?: SpacingKey }`. `<BottomSheet />` adds `{ snapPoints?, showHandle? }`.**

### 9.12 Toggle / Switch

- Use the platform default with `accent.primary` as the active track color
- Inactive track: `border.strong`

**Implemented as `<Switch />` (wraps `react-native` `Switch`) with props `{ value, onValueChange, disabled?, accessibilityLabel }`.**

### 9.13 Slider (Range)

- Track: 2px tall, `text.primary` color (black)
- Thumb: 20px circle, `bg.surface` fill, 2px `text.primary` border (matches the Filters age slider)

**Implemented as `<Slider />` with props `{ min, max, value | values, onChange, step?, mode?: 'single' | 'range' }`. Range mode uses two thumbs.**

### 9.14 Notification Dot

- 6px filled circle in `notification.dot` color
- Use to indicate unread items on icons, tabs, and menu items

**Implemented as `<NotificationDot />` with props `{ visible?, size?: 'sm' | 'md', color? }`. Default `size='sm'` (6px). Consumed by `<TabBarItem />`, `<TabSwitcher />`, `<ListRow />` as a positioned overlay.**

### 9.15 Premium / Advanced Section

- Container background: `bg.premium` (warm gold tint)
- Section header: `text.premium` color, `heading.lg` style, with a crown icon (24×24)
- Used for paid/premium features only — do not use elsewhere

**Implemented as `<PremiumSection />` with props `{ title, children, icon? }`. Wraps a `<Card bg="premium" />` with a heading row. Do not compose this pattern outside the premium feature area.**

---

## 10. Iconography

- **Style:** Outlined, 1.5–2px stroke weight, rounded line caps. Match the visual weight of [Lucide Icons](https://lucide.dev) or [Phosphor Icons (regular)](https://phosphoricons.com).
- **Default size:** 24×24
- **Tab bar size:** 24×24
- **Inline icons (next to text):** 16×16 or 20×20
- **Color:** Inherits from parent text color by default (use `text.primary`, `text.tertiary`, etc.)

**Recommended icon library:** `lucide-react-native` — install with `npm install lucide-react-native`. Use this consistently.

---

## 11. Illustrations

A signature element of this app is the **black-and-white line-art illustration with selective color pops** (matches the reference screens — the figure holding a map, the man holding a speech-bubble sign, etc.).

**Rules for illustrations:**

- Black ink lines on transparent or off-white backgrounds
- Selective use of the brand pink (`brandPink`) for accent elements (hearts, butterflies, marks)
- Do NOT use full-color illustrations
- Do NOT use 3D renders or photographic imagery
- Source: SVG files placed in `src/assets/illustrations/`
- Sized to roughly 200×200 to 280×280 in screens

The agent should leave illustrations as `<Image source={...} />` placeholders until the user provides the assets.

---

## 12. Motion & Animation

This app uses **subtle, purposeful** motion. No flashy animations.

- **Button press:** opacity 1 → 0.85, 100ms
- **Screen transitions:** standard React Navigation defaults (slide on iOS, fade on Android)
- **Modal entry:** slide up from bottom, 300ms, ease-out
- **List item appearance:** no animation by default
- **Loading states:** use a skeleton placeholder (gray100 / gray200 alternating) — never a spinner alone for full-screen loads

Use `react-native-reanimated` for any custom animation. Do not use Animated API directly.

---

## 13. Accessibility Requirements

- All interactive elements must have an `accessibilityLabel`
- Minimum touch target: 44×44 (iOS) / 48×48 (Android)
- Text-on-background contrast must meet WCAG AA (4.5:1 for body, 3:1 for large text)
- `accent.primary` on `bg.primary` (white) passes AA for large text; for small text on pink buttons, always use white text
- Do not rely on color alone to convey state (e.g., always pair the brand pink "selected" state with a checkmark icon)

---

## 14. Reference Theme File Templates

Below are the exact starter files the agent should create. The agent may add additional tokens later, but **must not remove or rename** any of these.

### 14.1 `src/theme/theme.ts`

```ts
// ============================================================
// SINGLE SOURCE OF TRUTH FOR ALL DESIGN TOKENS
// To change a color globally, edit ONLY this file.
// ============================================================

const palette = {
  // Brand
  brandPink: "#E91E63",
  brandPinkSoft: "#F8BBD0",
  brandPinkBg: "#FCE4EC",
  brandMint: "#4ECDC4",
  brandMintSoft: "#A8E6E1",
  brandOrange: "#F77F3F",
  brandGold: "#A88A2C",
  brandGoldBg: "#F5EFD9",

  // Neutrals
  black: "#0E1116",
  gray900: "#1A1D23",
  gray700: "#4A4F58",
  gray500: "#8B9099",
  gray300: "#D4D7DC",
  gray200: "#E8EAED",
  gray100: "#F4F5F7",
  gray50: "#FAFAFB",
  white: "#FFFFFF",

  // Semantic raw
  success: "#4ECDC4",
  error: "#E63946",
  warning: "#F4A261",
  info: "#5B8DEF",

  // Dark mode brand
  brandPinkDark: "#FF4081",
  brandPinkSoftDark: "#7A2547",
  brandPinkBgDark: "#3D1828",
  brandMintDark: "#5DDED4",
  brandOrangeDark: "#FF9A5C",
  brandGoldDark: "#D4B85A",
  brandGoldBgDark: "#2A2418",

  // Dark mode neutrals
  bgPrimaryDark: "#0E1116",
  bgSurfaceDark: "#181B22",
  bgElevatedDark: "#22262E",
  borderDark: "#2D323B",
  dividerDark: "#23272E",
  textPrimaryDark: "#F4F5F7",
  textSecondaryDark: "#A8ADB7",
  textTertiaryDark: "#6B7280",
  inputBgDark: "#1F2229",
  errorDark: "#FF6B6B",
  warningDark: "#FFB870",
  infoDark: "#7FA8FF",
};

export const lightColors = {
  bg: {
    primary: palette.white,
    surface: palette.white,
    elevated: palette.white,
    input: palette.gray100,
    muted: palette.gray50,
    premium: palette.brandGoldBg,
  },
  text: {
    primary: palette.black,
    secondary: palette.gray700,
    tertiary: palette.gray500,
    inverse: palette.white,
    brand: palette.brandPink,
    premium: palette.brandGold,
  },
  border: {
    default: palette.gray200,
    strong: palette.gray300,
  },
  accent: {
    primary: palette.brandPink,
    primaryDisabled: palette.brandPinkSoft,
    secondary: palette.brandMint,
    secondaryDisabled: palette.brandMintSoft,
    tertiary: palette.brandOrange,
  },
  status: {
    success: palette.success,
    error: palette.error,
    warning: palette.warning,
    info: palette.info,
  },
  notification: {
    dot: palette.brandPink,
  },
};

export const darkColors = {
  bg: {
    primary: palette.bgPrimaryDark,
    surface: palette.bgSurfaceDark,
    elevated: palette.bgElevatedDark,
    input: palette.inputBgDark,
    muted: palette.bgSurfaceDark,
    premium: palette.brandGoldBgDark,
  },
  text: {
    primary: palette.textPrimaryDark,
    secondary: palette.textSecondaryDark,
    tertiary: palette.textTertiaryDark,
    inverse: palette.black,
    brand: palette.brandPinkDark,
    premium: palette.brandGoldDark,
  },
  border: {
    default: palette.borderDark,
    strong: palette.borderDark,
  },
  accent: {
    primary: palette.brandPinkDark,
    primaryDisabled: palette.brandPinkSoftDark,
    secondary: palette.brandMintDark,
    secondaryDisabled: palette.brandMintDark,
    tertiary: palette.brandOrangeDark,
  },
  status: {
    success: palette.brandMintDark,
    error: palette.errorDark,
    warning: palette.warningDark,
    info: palette.infoDark,
  },
  notification: {
    dot: palette.brandPinkDark,
  },
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  giant: 64,
} as const;

export const radii = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
} as const;

export const shadows = {
  none: {},
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export type ColorScheme = typeof lightColors;
export type Theme = {
  mode: "light" | "dark";
  colors: ColorScheme;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
};

export const lightTheme: Theme = {
  mode: "light",
  colors: lightColors,
  spacing,
  radii,
  shadows,
};

export const darkTheme: Theme = {
  mode: "dark",
  colors: darkColors,
  spacing,
  radii,
  shadows,
};
```

### 14.2 `src/theme/typography.ts`

```ts
// ============================================================
// SINGLE SOURCE OF TRUTH FOR ALL FONTS AND TEXT STYLES
// To change a font globally, edit ONLY this file.
// ============================================================

import { TextStyle } from "react-native";

export const fontFamily = {
  primary: {
    regular: "PlusJakartaSans-Regular",
    medium: "PlusJakartaSans-Medium",
    semibold: "PlusJakartaSans-SemiBold",
    bold: "PlusJakartaSans-Bold",
    extrabold: "PlusJakartaSans-ExtraBold",
  },
};

export const fontSize = {
  xs: 11,
  sm: 12,
  md: 13,
  base: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  display: 28,
  displayLg: 32,
} as const;

export const fontWeight = {
  regular: "400" as TextStyle["fontWeight"],
  medium: "500" as TextStyle["fontWeight"],
  semibold: "600" as TextStyle["fontWeight"],
  bold: "700" as TextStyle["fontWeight"],
  extrabold: "800" as TextStyle["fontWeight"],
};

export const textStyles = {
  display: {
    lg: {
      fontFamily: fontFamily.primary.extrabold,
      fontSize: 32,
      lineHeight: 40,
    } as TextStyle,
    md: {
      fontFamily: fontFamily.primary.extrabold,
      fontSize: 28,
      lineHeight: 36,
    } as TextStyle,
  },
  heading: {
    xl: {
      fontFamily: fontFamily.primary.bold,
      fontSize: 24,
      lineHeight: 32,
    } as TextStyle,
    lg: {
      fontFamily: fontFamily.primary.bold,
      fontSize: 20,
      lineHeight: 28,
    } as TextStyle,
    md: {
      fontFamily: fontFamily.primary.semibold,
      fontSize: 18,
      lineHeight: 26,
    } as TextStyle,
    sm: {
      fontFamily: fontFamily.primary.semibold,
      fontSize: 16,
      lineHeight: 24,
    } as TextStyle,
  },
  body: {
    lg: {
      fontFamily: fontFamily.primary.regular,
      fontSize: 16,
      lineHeight: 24,
    } as TextStyle,
    md: {
      fontFamily: fontFamily.primary.regular,
      fontSize: 14,
      lineHeight: 22,
    } as TextStyle,
    sm: {
      fontFamily: fontFamily.primary.regular,
      fontSize: 13,
      lineHeight: 20,
    } as TextStyle,
  },
  label: {
    lg: {
      fontFamily: fontFamily.primary.semibold,
      fontSize: 16,
      lineHeight: 22,
    } as TextStyle,
    md: {
      fontFamily: fontFamily.primary.semibold,
      fontSize: 14,
      lineHeight: 20,
    } as TextStyle,
    sm: {
      fontFamily: fontFamily.primary.medium,
      fontSize: 12,
      lineHeight: 16,
    } as TextStyle,
  },
  caption: {
    fontFamily: fontFamily.primary.medium,
    fontSize: 11,
    lineHeight: 14,
  } as TextStyle,
};
```

### 14.3 `src/theme/ThemeProvider.tsx`

```tsx
import React, { createContext, useContext, useState, useMemo } from "react";
import { useColorScheme } from "react-native";
import { lightTheme, darkTheme, Theme } from "./theme";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setMode: (mode: "light" | "dark" | "system") => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<"light" | "dark" | "system">(
    "system",
  );
  const mode = override === "system" ? (systemScheme ?? "light") : override;
  const theme = mode === "dark" ? darkTheme : lightTheme;

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setOverride(theme.mode === "dark" ? "light" : "dark"),
      setMode: setOverride,
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx.theme;
}

export function useThemeControls() {
  const ctx = useContext(ThemeContext);
  if (!ctx)
    throw new Error("useThemeControls must be used within ThemeProvider");
  return { toggleTheme: ctx.toggleTheme, setMode: ctx.setMode };
}
```

### 14.4 `src/theme/index.ts`

```ts
export * from "./theme";
export * from "./typography";
export { ThemeProvider, useTheme, useThemeControls } from "./ThemeProvider";
```

---

## 15. How a Component Should Be Written (CANONICAL EXAMPLE)

The canonical implementation pattern lives in `src/components/Button.tsx`. Read that file alongside this section for the concrete factory pattern. The example below is a reduced sketch — the real file is authoritative.

```tsx
// src/components/PrimaryButton.tsx
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useTheme } from "@/theme";
import { textStyles } from "@/theme/typography";
import type { Theme } from "@/theme/theme";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function PrimaryButton({ label, onPress, disabled }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        pressed && styles.buttonPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    button: {
      backgroundColor: theme.colors.accent.primary,
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.xxl,
      borderRadius: theme.radii.pill,
      alignItems: "center",
    },
    buttonDisabled: {
      backgroundColor: theme.colors.accent.primaryDisabled,
    },
    buttonPressed: {
      opacity: 0.85,
    },
    label: {
      ...textStyles.label.lg,
      color: theme.colors.text.inverse,
    },
  });
```

**Why this is correct:**

1. **No inline style objects anywhere in JSX.** Every concrete value lives inside `StyleSheet.create`. The `style={[...]}` array contains only references to keys on the `styles` object, plus boolean toggles.
2. **`createStyles(theme)` factory** lets a static `StyleSheet.create` consume runtime theme tokens. `useMemo` re-runs it only when the theme changes (light/dark switch).
3. **Imports tokens from the theme** — no hardcoded values.
4. **Uses `useTheme()`** — automatically responds to dark mode.
5. **References semantic colors** (`accent.primary`, `text.inverse`) — not raw hexes.
6. **Uses preset text styles** via spread (`...textStyles.label.lg`) — not raw `fontSize`/`fontWeight`.
7. **Uses spacing/radii tokens** — not raw numbers.

**Bad components — all of the following are forbidden:**

```tsx
// ❌ Hardcoded literals
<View style={{ backgroundColor: "#E91E63", padding: 16, borderRadius: 999 }}>
  <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>Submit</Text>
</View>

// ❌ Inline object built from theme tokens — STILL forbidden
<View style={{ backgroundColor: theme.colors.accent.primary, padding: theme.spacing.lg }}>
  <Text style={{ color: theme.colors.text.inverse }}>Submit</Text>
</View>

// ❌ Mixing a StyleSheet ref with an inline object override
<View style={[styles.button, { paddingHorizontal: 24 }]} />
```

The first is forbidden because it bypasses the design system entirely. The second and third are forbidden because they leak concrete style values into JSX — the rule is that all style objects live inside `StyleSheet.create`, with no exceptions. If you need a variant, add another key to the `createStyles` factory and reference it.

### §15.1 — When to add a new component

**Rule of one.** A new component is added to `src/components/` the first time a screen needs it. There is no minimum-screens threshold. No "extract later". No approval process. First use → new component.

Every new component must land in the same PR with:

1. **Configurable-appearance props** typed as keys of the theme token maps (e.g. `padding?: keyof Theme['spacing']`, `color?: keyof Theme['colors']['text']`, `radius?: keyof Theme['radii']`). No raw `string` / `number` typed appearance props. Variant props are string-literal unions (`variant?: 'primary' | 'secondary' | 'ghost'`). Size props are string-literal unions that map internally to concrete tokens (`size?: 'sm' | 'md' | 'lg'`).
2. **No `style` / `containerStyle` / `textStyle` / `contentContainerStyle` pass-through prop.** Ever. This is the one hole that would let raw hexes and raw pixel values back in — it stays closed. If a variant is genuinely needed that current props can't express, add a new prop (typed per Rule 1); never a `style` escape.
3. **Sensible defaults documented in TSDoc** on every optional prop. Required props have no `?`.
4. **A §9 entry** added or updated, annotated as `"Implemented as <ComponentName> with props <...>"`.
5. **Tests** at `__tests__/components/<Name>.test.tsx` covering every variant, every interactive prop, disabled / loading states, `accessibilityLabel`, `onPress`, and light + dark theme.
6. **A barrel export** from `src/components/index.ts`.

No "just for this screen." No "we'll generalize later." Every screen composes components from day one. See `codingprinciples.md → Component Catalog` and `architecture.md §2a` for the full mandate.

---

## 16. Quick Checklist for the Agent (Run before submitting any UI code)

- [ ] No hardcoded colors anywhere — all colors come from `useTheme().colors`
- [ ] No hardcoded fonts — all text uses `textStyles.*`
- [ ] No hardcoded spacing — all spacing uses `spacing.*`
- [ ] No hardcoded radii — all radii use `radii.*`
- [ ] Component renders correctly in both light AND dark mode
- [ ] All touch targets ≥ 44px
- [ ] Primary buttons are pill-shaped and pink
- [ ] Cards have 16px radius and subtle borders
- [ ] All icons are outlined-style, 24×24 by default
- [ ] No additional UI library imports
- [ ] All interactive elements have `accessibilityLabel`

---

## 17. When the User Wants to Change the Theme

If the user says: _"Change the brand color to green"_ → edit one line in `theme.ts` (`brandPink: '#XX...'` → new value).
If the user says: _"Switch to a different font"_ → edit `fontFamily.primary` in `typography.ts`, and update the font loading in the app entry point.
If the user says: _"Make corners less rounded"_ → edit `radii` in `theme.ts`.
If the user says: _"Add a new color"_ → add it to `palette` in `theme.ts`, then expose it in both `lightColors` and `darkColors` under a semantic name.

The agent should **never** start grep-replacing color hexes across components. If it ever needs to, that means the rules of this document were violated and it should fix the source instead.

---

_End of theme guide._
