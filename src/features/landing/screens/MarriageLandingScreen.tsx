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
 * **Card-transition animation (post-story-13.5 polish):**
 * Dislike / Like / Undo run a three-phase Reanimated sequence on the deck
 * card so index changes are cinematic rather than instantaneous. Total
 * duration ≈ 1.75 s (250 ms pinch + 750 ms exit + 750 ms enter) with
 * `Easing.inOut(cubic)` on both slides so the visible motion stays evenly
 * paced end-to-end:
 * 1. **Pinch** — the outgoing card scales down to 0.86, easing out to a
 *    settled "receded" state (screenshot press beat).
 * 2. **Exit** — the outgoing card translates off-screen (up for Dislike/Like,
 *    down for Undo) while fading to zero opacity.
 * 3. **Enter** — the incoming card slides in from the opposite direction
 *    (from 65 % of the screen below for Dislike/Like, from above for Undo),
 *    scaling back up to 1 and fading in.
 * The index swap happens at the end of the exit phase via `runOnJS` so the
 * new card is offscreen when it mounts and never flashes into view at the
 * old card's position. A ref guards against overlapping presses.
 *
 * **Exhausted state (AC3):** when `currentDeckIndex >= DECK_FIXTURES.length`,
 * scroll content shows `EmptyState` and `CollapsingActionBar` returns `null`
 * (completely removed from the tree — no greyed-out buttons).
 *
 * **Deck-advance resets (AC5 + S4):** a `useEffect` on `currentDeckIndex`
 * resets `tabBarHidden.value` to 0 AND scrolls to the top, so both
 * the tab bar and the action bar spring back into view on every new card.
 * The reset happens between the exit and enter phases of the animation, so
 * the outer scroll snap is invisible (the card is offscreen at that moment).
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
import { Dimensions, ScrollView, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { EmptyState, Snackbar } from '@/components';
import { t } from '@/labels';
import { DECK_FIXTURES } from '@/features/discover/data/deckFixtures';
import { useBookmarks } from '@/state/bookmarks/BookmarksProvider';

import { HeaderBar } from '../components/HeaderBar';
import { DeckCard } from '../components/DeckCard';
import { CollapsingActionBar } from '../components/CollapsingActionBar';
import { SendRequestModal } from '../components/SendRequestModal';
import { tabBarHidden } from '@/state/ui/tabBarHidden';

// Current-user profile — read once at module scope for the bell-dot (AC4 / S1).
// The dot reflects THIS user's unread state, not the deck candidate's.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dummyprofile = require('../../../../assets/dummyprofile.json') as {
  __dummy_display_only?: { has_unread_notifications?: boolean };
};

// ── Constants ─────────────────────────────────────────────────────────────────

/** Minimum scroll delta (px) before the tab bar starts collapsing. */
const SCROLL_DELTA_THRESHOLD = 8;

/** Screen height — used to translate a deck card fully off-screen during exit. */
const SCREEN_HEIGHT = Dimensions.get('window').height;

/**
 * Distance (as a fraction of screen height) that the incoming card starts
 * off-screen before it slides into position. Larger fraction = more dramatic
 * slide-in that takes longer to travel and reinforces the cinematic feel.
 */
const ENTER_OFFSET_FRACTION = 0.65;

/**
 * Card-transition animation timings (ms). Total ≈ 1.75 s.
 * Tuned for a deliberate, cinematic feel — long enough that the fade + scale
 * are perceptibly gradual and the visible motion reads as a full "one second"
 * of slide, not a quick snap.
 */
const PINCH_DURATION_MS = 250;
const EXIT_DURATION_MS = 750;
const ENTER_DURATION_MS = 750;

/**
 * Scale value the outgoing card shrinks to during the pinch beat, and the
 * incoming card starts at before growing back to 1. Deeper (smaller) than
 * a screenshot pinch — reinforces the "pushed into the distance" feel.
 */
const PINCH_SCALE = 0.86;

/**
 * Easing curves for the three phases.
 *
 * Slides use `inOut` (smooth acceleration in the first half, symmetric
 * deceleration in the second) so the motion feels continuous and paced
 * throughout — a straight `Easing.in` on exit would compress most of the
 * visible motion into the last third, making the whole slide feel much
 * shorter than the actual duration.
 */
const PINCH_EASING = Easing.out(Easing.quad);
const EXIT_EASING = Easing.inOut(Easing.cubic);
const ENTER_EASING = Easing.inOut(Easing.cubic);

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
 */
export function MarriageLandingScreen(): React.ReactElement {
  // ── Bookmarks state ─────────────────────────────────────────────────────────
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();

  // ── Deck index state ────────────────────────────────────────────────────────
  const [currentDeckIndex, setCurrentDeckIndex] = useState(0);

  // ── Local snackbar state ───────────────────────────────────────────────────
  const [snackbarMsg, setSnackbarMsg] = useState<string | null>(null);

  // ── Send-request modal state ───────────────────────────────────────────────
  // Like now opens a two-step confirmation modal instead of advancing directly.
  // The modal's `onConfirmed` callback is what actually triggers the deck
  // slide-out animation + snackbar; No at any step just dismisses.
  const [requestModalVisible, setRequestModalVisible] = useState(false);

  // ── Scroll ref for position reset on card advance ──────────────────────────
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
        tabBarHidden.value = withTiming(1, { duration: 220 });
      } else if (delta < -SCROLL_DELTA_THRESHOLD) {
        // Scrolling up — show the tab bar.
        tabBarHidden.value = withTiming(0, { duration: 220 });
      }

      previousScrollY.value = currentY;
    },
  });

  // ── Card-transition animation shared values ────────────────────────────────
  const cardScale = useSharedValue(1);
  const cardTranslateY = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const isAnimatingRef = useRef(false);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: cardTranslateY.value },
      { scale: cardScale.value },
    ],
    opacity: cardOpacity.value,
  }));

  // ── Deck-advance resets (AC5 + S4) ─────────────────────────────────────────
  // Runs whenever the index actually changes (i.e. between the exit and enter
  // phases of the animation). At that moment the card is offscreen, so the
  // scroll snap and tab-bar reset are invisible.
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    tabBarHidden.value = withTiming(0, { duration: 220 });
  }, [currentDeckIndex]);

  // ── Card-transition helpers ────────────────────────────────────────────────

  /**
   * Runs the three-phase pinch → exit → enter animation on the deck card and
   * swaps `currentDeckIndex` by `delta` at the moment the card is offscreen.
   *
   * Guarded by `isAnimatingRef` so rapid taps queue at most one transition.
   * Direction:
   * - `delta = +1` (Dislike / Like): exit UP, enter from BELOW.
   * - `delta = -1` (Undo):           exit DOWN, enter from ABOVE.
   */
  const animateDeckTransition = useCallback(
    (delta: 1 | -1) => {
      if (isAnimatingRef.current) return;
      // Undo at index 0 is a no-op — do not animate, do not decrement.
      if (delta === -1 && currentDeckIndex === 0) return;

      isAnimatingRef.current = true;

      const exitTranslate = delta > 0 ? -SCREEN_HEIGHT : SCREEN_HEIGHT;
      const enterStart =
        delta > 0
          ? SCREEN_HEIGHT * ENTER_OFFSET_FRACTION
          : -SCREEN_HEIGHT * ENTER_OFFSET_FRACTION;

      const commitSwap = () => {
        setCurrentDeckIndex((prev) => prev + delta);
      };
      const unlock = () => {
        isAnimatingRef.current = false;
      };

      // Scale: hold 1 → pinch to PINCH_SCALE (screenshot press beat) → hold
      // small during exit → jump to PINCH_SCALE for the incoming card → grow
      // back to 1 with a decelerating ease (settles into position).
      cardScale.value = withSequence(
        withTiming(PINCH_SCALE, { duration: PINCH_DURATION_MS, easing: PINCH_EASING }),
        withTiming(PINCH_SCALE, { duration: EXIT_DURATION_MS }),
        withTiming(PINCH_SCALE, { duration: 0 }),
        withTiming(1, { duration: ENTER_DURATION_MS, easing: ENTER_EASING }),
      );

      // TranslateY: hold 0 during pinch → slide off in exit direction with an
      // accelerating ease (starts slow, picks up speed) → instant jump to
      // enterStart (offscreen on opposite side) → slide back to 0 with a
      // decelerating ease. The `runOnJS(commitSwap)` in the exit step ensures
      // the state update lands while the card is at translateY = exitTranslate;
      // the 0-duration jump to enterStart puts the incoming render offscreen.
      cardTranslateY.value = withSequence(
        withTiming(0, { duration: PINCH_DURATION_MS }),
        withTiming(
          exitTranslate,
          { duration: EXIT_DURATION_MS, easing: EXIT_EASING },
          (finished) => {
            if (finished === true) {
              runOnJS(commitSwap)();
            }
          },
        ),
        withTiming(enterStart, { duration: 0 }),
        withTiming(0, { duration: ENTER_DURATION_MS, easing: ENTER_EASING }),
      );

      // Opacity: 1 during pinch → fade to 0 across the exit (same easing as
      // translate so fade and motion stay locked together) → hold 0 during
      // the jump → fade back to 1 during enter. The final `finished` callback
      // unlocks the guard.
      cardOpacity.value = withSequence(
        withTiming(1, { duration: PINCH_DURATION_MS }),
        withTiming(0, { duration: EXIT_DURATION_MS, easing: EXIT_EASING }),
        withTiming(0, { duration: 0 }),
        withTiming(
          1,
          { duration: ENTER_DURATION_MS, easing: ENTER_EASING },
          (finished) => {
            if (finished === true) {
              runOnJS(unlock)();
            }
          },
        ),
      );
    },
    [currentDeckIndex, cardScale, cardTranslateY, cardOpacity],
  );

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleDislike = useCallback(() => {
    animateDeckTransition(1);
  }, [animateDeckTransition]);

  const handleLike = useCallback(() => {
    // Like opens the send-request confirmation modal. Only after the user
    // confirms twice AND the pleasewait animation completes does the deck
    // actually advance — see handleRequestConfirmed below.
    setRequestModalVisible(true);
  }, []);

  const handleRequestCancel = useCallback(() => {
    setRequestModalVisible(false);
  }, []);

  const handleRequestConfirmed = useCallback(() => {
    // TODO(mock-only): real request-create ships in phase 15
    animateDeckTransition(1);
    setSnackbarMsg(t('landing.likeSent'));
  }, [animateDeckTransition]);

  const handleUndo = useCallback(() => {
    animateDeckTransition(-1);
  }, [animateDeckTransition]);

  const handleSuperLike = useCallback(() => {
    // Defensive guard: if the deck is exhausted the Star button is hidden
    // (CollapsingActionBar returns null), but guard here as well.
    const currentDeck = DECK_FIXTURES[currentDeckIndex];
    if (!currentDeck) return;

    if (!isBookmarked(currentDeck.user_id)) {
      addBookmark(currentDeck).catch(console.warn);
      setSnackbarMsg(t('landing.bookmark.added'));
    } else {
      removeBookmark(currentDeck.user_id).catch(console.warn);
      setSnackbarMsg(t('landing.bookmark.removed'));
    }
    // Deck index does NOT change. tabBarHidden.value does NOT reset.
  }, [currentDeckIndex, isBookmarked, addBookmark, removeBookmark]);

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
        {/* Deck-transition wrapper — animates the card in/out on index
            change. The EmptyState also lives inside the wrapper so exhausting
            the deck slides into view rather than snapping. */}
        <Animated.View style={cardAnimatedStyle} testID="deck-card-wrapper">
          {isExhausted ? (
            <EmptyState
              title={t('landing.deckExhausted.title')}
              description={t('landing.deckExhausted.description')}
            />
          ) : (
            /* Active deck card — index is in bounds because !isExhausted */
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            <DeckCard deck={DECK_FIXTURES[currentDeckIndex]!} />
          )}
        </Animated.View>
      </Animated.ScrollView>

      {/* Floating 4-button action bar — hidden entirely in exhausted state (S3 / AC3) */}
      {!isExhausted && (
        <CollapsingActionBar
          onPass={handleDislike}
          onLike={handleLike}
          onUndo={handleUndo}
          onSuperLike={handleSuperLike}
          hidden={tabBarHidden}
          isSuperLikeActive={isBookmarked(DECK_FIXTURES[currentDeckIndex]?.user_id ?? '')}
        />
      )}

      {/* Local snackbar */}
      <Snackbar
        visible={snackbarMsg !== null}
        message={snackbarMsg ?? ''}
        onDismiss={handleSnackbarDismiss}
        duration={3000}
      />

      {/* Send-request confirmation modal — Like button opens it; the deck
          advance only fires after the two-step Yes + pleasewait sequence. */}
      <SendRequestModal
        visible={requestModalVisible}
        targetName={
          !isExhausted
            ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              `${DECK_FIXTURES[currentDeckIndex]!.first_name ?? ''} ${DECK_FIXTURES[currentDeckIndex]!.last_name ?? ''}`.trim()
            : ''
        }
        onCancel={handleRequestCancel}
        onConfirmed={handleRequestConfirmed}
      />
    </View>
  );
}
