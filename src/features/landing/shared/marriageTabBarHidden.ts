/**
 * Module-scope Reanimated shared value for the Marriage tab-bar collapse.
 *
 * Instantiated once at module load so both `MarriageLandingScreen` (writer)
 * and `AppTabs` (reader, story 12.6) can import from the same module without
 * creating a circular dependency.
 *
 * The value is a number in the range [0, 1]:
 * - `0` — tab bar fully visible (scroll at top or scrolling up).
 * - `1` — tab bar fully hidden (scrolling down past the threshold).
 *
 * `MarriageLandingScreen` drives this via `useAnimatedScrollHandler` with an
 * 8 px delta threshold to avoid twitchy hides.
 *
 * `AppTabs` (story 12.6) reads this via `useAnimatedStyle` to compute:
 * - `translateY`: `0` → `tabBarHeight`
 * - `opacity`: `1` → `0`
 *
 * @module features/landing/shared/marriageTabBarHidden
 */

import { makeMutable } from 'react-native-reanimated';

/**
 * Shared value produced by `MarriageLandingScreen` and consumed by
 * `AppTabs` (story 12.6) to collapse the native React Navigation tab bar
 * on downward scroll.
 *
 * `0` = visible, `1` = hidden.
 */
export const marriageTabBarHidden = makeMutable(0);
