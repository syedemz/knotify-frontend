/**
 * MarriageLandingScreen — the first post-onboarding screen a male user sees.
 *
 * Renders a candidate female profile (sourced from `assets/dummyfemale.json`)
 * in a scrollable layout composed of:
 * - `HeaderBar` — sticky top bar (filter icon left, bell icon right).
 * - `CandidateHero` — full-bleed hero image (first scroll child, scrolls up).
 * - `ProfileScrollView` viewer="other" — 13 profile sections (HeroBlock
 *   returns `null` for viewer='other'; CandidateHero fills that slot).
 * - `CollapsingActionBar` — floating bottom overlay with 4 round action
 *   buttons.
 * - `Snackbar` — local-state toast shown when any action button is pressed.
 *
 * **Scroll-driven tab-bar collapse:**
 * The screen writes to `marriageTabBarHidden` (module-scope shared value in
 * `shared/marriageTabBarHidden.ts`) via `useAnimatedScrollHandler`. An 8 px
 * delta threshold prevents twitchy hides. `AppTabs` (story 12.6) reads the
 * shared value to collapse the native React Navigation tab bar.
 *
 * **Action buttons (no-op in phase 12):**
 * Each of the four round buttons sets `snackbarMsg` to
 * `t('landing.actionUnavailable')`. Real handlers ship in phase 13.
 *
 * @module features/landing/screens/MarriageLandingScreen
 */

import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Snackbar } from '@/components';
import { t } from '@/labels';
import { ProfileScrollView } from '@/features/profile-sections';

import { HeaderBar } from '../components/HeaderBar';
import { CandidateHero } from '../components/CandidateHero';
import { CollapsingActionBar } from '../components/CollapsingActionBar';
import { marriageTabBarHidden } from '../shared/marriageTabBarHidden';

// Static import — no API call in phase 12.
import dummyfemale from '../../../../assets/dummyfemale.json';
import type { DummyFemaleProfile } from '@/types/DummyFemaleProfile';
import type { DummyOverlay } from '@/types/DummyOverlay';
import type { UserProfile } from '@/types/api/UserProfile';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Minimum scroll delta (px) before the tab bar starts collapsing. */
const SCROLL_DELTA_THRESHOLD = 8;

// Cast the JSON import to the richer DummyFemaleProfile type.
const candidateProfile = dummyfemale as unknown as DummyFemaleProfile;

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Renders the Marriage landing page — the candidate card a male user sees
 * immediately after completing onboarding.
 *
 * All action buttons are no-ops in phase 12; each triggers the local
 * Snackbar with "Available in a later phase".
 */
export function MarriageLandingScreen(): React.ReactElement {
  // ── Local snackbar state (mirrors Page25 / Page30 pattern) ────────────────
  const [snackbarMsg, setSnackbarMsg] = useState<string | null>(null);

  // ── Animated scroll handler for tab-bar collapse ───────────────────────────
  const previousScrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      const currentY = event.contentOffset.y;
      const delta = currentY - previousScrollY.value;

      if (delta > SCROLL_DELTA_THRESHOLD) {
        // Scrolling down — hide the tab bar.
        marriageTabBarHidden.value = withTiming(1, { duration: 220 });
      } else if (delta < -SCROLL_DELTA_THRESHOLD) {
        // Scrolling up — show the tab bar.
        marriageTabBarHidden.value = withTiming(0, { duration: 220 });
      }

      previousScrollY.value = currentY;
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAction = useCallback(() => {
    setSnackbarMsg(t('landing.actionUnavailable'));
  }, []);

  const handleSnackbarDismiss = useCallback(() => {
    setSnackbarMsg(null);
  }, []);

  const hasUnread =
    candidateProfile.__dummy_display_only?.has_unread_notifications === true;

  return (
    <View testID="marriage-landing-screen" style={{ flex: 1 }}>
      {/* Sticky header — rendered outside the scroll so it stays fixed */}
      <HeaderBar hasUnreadNotifications={hasUnread} />

      {/* Scrollable content */}
      <Animated.ScrollView
        testID="marriage-landing-scroll"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 200 }}
      >
        {/* Hero scrolls with the content */}
        <CandidateHero profile={candidateProfile} />

        {/* 13 profile sections (HeroBlock returns null for viewer='other') */}
        <ProfileScrollView
          // DummyFemaleProfile's narrowed `preferences` type is not directly
          // assignable to UserProfile & DummyOverlay; cast via the widened
          // intersection so tsc is satisfied while runtime behaviour is unchanged.
          profile={candidateProfile as unknown as UserProfile & DummyOverlay}
          viewer="other"
        />
      </Animated.ScrollView>

      {/* Floating 4-button action bar anchored above the tab bar. Collapses
          in lock-step with the tab bar via the shared value. */}
      <CollapsingActionBar onAction={handleAction} hidden={marriageTabBarHidden} />

      {/* Local snackbar — shown when any action button is pressed */}
      <Snackbar
        visible={snackbarMsg !== null}
        message={snackbarMsg ?? ''}
        onDismiss={handleSnackbarDismiss}
        duration={3000}
      />
    </View>
  );
}
