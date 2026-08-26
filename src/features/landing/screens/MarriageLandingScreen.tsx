/**
 * MarriageLandingScreen — Marriage-tab deck of condensed candidate cards.
 *
 * Phase-13 refactor: replaces the single Aisha full-profile view with a
 * swipeable deck backed by `DECK_FIXTURES`. Each card is rendered by
 * `DeckCard` (condensed: CandidateHero + 4 sections). Users advance through
 * the deck via the four `CollapsingActionBar` buttons.
 *
 * **Deck navigation (story 13.3 AC3):**
 * - Dislike (X) → advance index, no snackbar.
 * - Like (✓) → advance index + Snackbar "Friend request sent" (mock theatre
 *   only — no FriendshipProvider write; real request-create ships in phase 15).
 * - Undo (↺) → decrement index (bounded at 0).
 * - Star (⭐) → Snackbar "Available in a later phase".
 *
 * **Exhausted state (AC3):** when `currentDeckIndex >= DECK_FIXTURES.length`,
 * scroll content shows `EmptyState` and `CollapsingActionBar` returns `null`
 * (completely removed from the tree — no greyed-out buttons).
 *
 * **Deck-advance resets (AC5 + S4):** a `useEffect` on `currentDeckIndex`
 * resets `marriageTabBarHidden.value` to 0 AND scrolls to the top, so both
 * the tab bar and the action bar spring back into view on every new card.
 *
 * **HeaderBar unread-dot (AC4 / S1):** derived from the CURRENT USER's
 * `dummyprofile.__dummy_display_only?.has_unread_notifications` — read once
 * at module scope. NOT derived from the deck card.
 *
 * **Scroll-driven tab-bar collapse:** preserved from phase 12 — the
 * `useAnimatedScrollHandler` with 8 px delta threshold is unchanged.
 *
 * @module features/landing/screens/MarriageLandingScreen
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { EmptyState, Snackbar } from '@/components';
import { t } from '@/labels';
import { DECK_FIXTURES } from '@/features/discover/data/deckFixtures';

import { HeaderBar } from '../components/HeaderBar';
import { DeckCard } from '../components/DeckCard';
import { CollapsingActionBar } from '../components/CollapsingActionBar';
import { marriageTabBarHidden } from '../shared/marriageTabBarHidden';

// Current-user profile — read once at module scope for the bell-dot (AC4 / S1).
// The dot reflects THIS user's unread state, not the deck candidate's.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dummyprofile = require('../../../../assets/dummyprofile.json') as {
  __dummy_display_only?: { has_unread_notifications?: boolean };
};

// ── Constants ─────────────────────────────────────────────────────────────────

/** Minimum scroll delta (px) before the tab bar starts collapsing. */
const SCROLL_DELTA_THRESHOLD = 8;

/**
 * Whether the current user has unread notifications.
 * Derived from `dummyprofile.__dummy_display_only?.has_unread_notifications`.
 * Read at module scope — static per app session (matches AC4 semantics).
 */
const CURRENT_USER_HAS_UNREAD =
  dummyprofile.__dummy_display_only?.has_unread_notifications === true;

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Marriage-tab landing screen — deck of condensed candidate cards.
 *
 * Phase 13: replaces the phase-12 single-profile view with a swipeable deck.
 */
export function MarriageLandingScreen(): React.ReactElement {
  // ── Deck index state ────────────────────────────────────────────────────────
  const [currentDeckIndex, setCurrentDeckIndex] = useState(0);

  // ── Local snackbar state ───────────────────────────────────────────────────
  const [snackbarMsg, setSnackbarMsg] = useState<string | null>(null);

  // ── Scroll ref for position reset on card advance ──────────────────────────
  // Typed as ScrollView because the Reanimated mock renders ScrollView, and
  // the real Animated.ScrollView exposes the same scrollTo API.
  const scrollRef = useRef<ScrollView>(null);

  // ── Animated scroll handler for tab-bar collapse (phase 12, unchanged) ─────
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

  // ── Deck-advance resets (AC5 + S4) ─────────────────────────────────────────
  // On every index change: scroll back to the top AND reset the tab-bar hidden
  // value so the action bar springs back into view on the new card.
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    marriageTabBarHidden.value = withTiming(0, { duration: 220 });
  }, [currentDeckIndex]);

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleDislike = useCallback(() => {
    setCurrentDeckIndex((prev) => prev + 1);
  }, []);

  const handleLike = useCallback(() => {
    // TODO(mock-only): real request-create ships in phase 15
    setCurrentDeckIndex((prev) => prev + 1);
    setSnackbarMsg(t('landing.likeSent'));
  }, []);

  const handleUndo = useCallback(() => {
    setCurrentDeckIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleSuperLike = useCallback(() => {
    setSnackbarMsg(t('landing.actionUnavailable'));
  }, []);

  const handleSnackbarDismiss = useCallback(() => {
    setSnackbarMsg(null);
  }, []);

  // ── Exhausted state ────────────────────────────────────────────────────────
  const isExhausted = currentDeckIndex >= DECK_FIXTURES.length;

  return (
    <View testID="marriage-landing-screen" style={{ flex: 1 }}>
      {/* Sticky header — derived from current user, not deck card (AC4) */}
      <HeaderBar hasUnreadNotifications={CURRENT_USER_HAS_UNREAD} />

      {/* Scrollable content */}
      <Animated.ScrollView
        ref={scrollRef as React.RefObject<ScrollView>}
        testID="marriage-landing-scroll"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 200 }}
      >
        {isExhausted ? (
          /* Exhausted state — EmptyState replaces deck content (AC3) */
          <EmptyState
            title={t('landing.deckExhausted.title')}
            description={t('landing.deckExhausted.description')}
          />
        ) : (
          /* Active deck card — index is in bounds because !isExhausted */
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          <DeckCard deck={DECK_FIXTURES[currentDeckIndex]!} />
        )}
      </Animated.ScrollView>

      {/* Floating 4-button action bar — hidden entirely in exhausted state (S3 / AC3) */}
      {!isExhausted && (
        <CollapsingActionBar
          onPass={handleDislike}
          onLike={handleLike}
          onUndo={handleUndo}
          onSuperLike={handleSuperLike}
          hidden={marriageTabBarHidden}
        />
      )}

      {/* Local snackbar */}
      <Snackbar
        visible={snackbarMsg !== null}
        message={snackbarMsg ?? ''}
        onDismiss={handleSnackbarDismiss}
        duration={3000}
      />
    </View>
  );
}
