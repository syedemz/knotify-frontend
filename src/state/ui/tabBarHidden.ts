/**
 * Module-scope Reanimated shared value driving the bottom-tab-bar collapse.
 *
 * Multiple feature screens write to this value from their scroll handlers,
 * and `AppTabs.CollapsingTabBar` reads it via `useAnimatedStyle` to translate
 * + fade the native tab bar in lock-step with the scroll direction.
 *
 * The value is a number in the range `[0, 1]`:
 * - `0` — tab bar fully visible (scroll at top or scrolling up).
 * - `1` — tab bar fully hidden (scrolling down past the threshold).
 *
 * **Current writers** (any screen may drive this, but the animation only
 * applies when its host tab participates — see `AppTabs.CollapsingTabBar`):
 * - `MarriageLandingScreen` — writes from its scroll handler (Marriage tab).
 * - `OtherProfileScreen`   — writes from its scroll handler (Explore tab,
 *                             nested in `ExploreStack`). Resets to `0` on
 *                             mount + unmount so `ExploreHomeScreen` — which
 *                             does not write — always sees the bar visible.
 *
 * Instantiated once at module load so all writers and the tab-bar reader
 * share a single object reference across React renders.
 *
 * Renamed from `marriageTabBarHidden` (phase 12) once the Explore tab began
 * writing to it in phase 13 — the "marriage" prefix no longer described the
 * reality that two screens across two tabs drive it. The move to
 * `src/state/ui/` reflects that this is app-wide UI state, not a landing-
 * feature concern.
 *
 * @module state/ui/tabBarHidden
 */

import { makeMutable } from 'react-native-reanimated';

export const tabBarHidden = makeMutable(0);
