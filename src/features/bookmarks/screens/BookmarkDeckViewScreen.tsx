/**
 * BookmarkDeckViewScreen — full deck view for a bookmarked profile.
 *
 * Story 14.4. Opened from `ExploreHomeScreen` (Bookmarks tab) when the user
 * taps a `BookmarkCard`. Renders the full `DeckCard` body for the bookmarked
 * profile, a `BackHeaderBar` at the top, and a `FloatingAddRequestButton`
 * in the bottom-right corner that opens `SendRequestModal`.
 *
 * **Profile resolution:** Resolved exclusively via
 * `useBookmarks().getBookmark(userId)`. If the bookmark has been removed
 * concurrently (e.g. by untapping Star on the Marriage tab), renders an
 * `EmptyState` instead — does NOT crash, does NOT fall back to `DECK_FIXTURES`.
 *
 * **SendRequestModal wiring:** The FAB opens the modal; pressing Yes → Yes
 * fires `handleConfirmed`, which closes the modal and calls `navigation.goBack()`
 * so the user lands back on `ExploreHomeScreen` with the Bookmarks subtab
 * preserved (native-stack keeps ExploreHomeScreen mounted across push/pop, so
 * `activeTab === 'bookmarks'` is preserved in its local `useState`). Pressing No
 * at any step closes the modal without navigating.
 *
 * **Bookmark persistence:** The bookmark is NOT removed on request confirm.
 * Bookmarks are a persistent save list independent of requests. Do not call
 * `removeBookmark` in `handleConfirmed`.
 *
 * **Scroll-driven tab-bar collapse:** Uses the same `tabBarHidden` shared
 * value and `useAnimatedScrollHandler` pattern as `OtherProfileScreen` so
 * scrolling on this screen drives the tab bar and FAB in lock-step with all
 * other stack-detail screens.
 *
 * @module features/bookmarks/screens/BookmarkDeckViewScreen
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { EmptyState, Button } from '@/components';
import { t } from '@/labels';
import { useBookmarks } from '@/state/bookmarks/BookmarksProvider';
import { useFriendship } from '@/state/friendship/FriendshipProvider';
import type { ExploreStackParamList } from '@/navigation/types';
import { DeckCard } from '@/features/landing/components/DeckCard';
import type { DummyDeckProfile } from '@/types/DummyDeckProfile';
import { SendRequestModal } from '@/features/landing/components/SendRequestModal';
import { tabBarHidden } from '@/state/ui/tabBarHidden';

import { BackHeaderBar } from '../../profile/components/BackHeaderBar';
import { FloatingAddRequestButton } from '../components/FloatingAddRequestButton';

// ── Route types ────────────────────────────────────────────────────────────────

type BookmarkDeckViewNav = NativeStackNavigationProp<
  ExploreStackParamList,
  'BookmarkDeckViewScreen'
>;
type BookmarkDeckViewRoute = RouteProp<
  ExploreStackParamList,
  'BookmarkDeckViewScreen'
>;

// ── Constants ─────────────────────────────────────────────────────────────────

/** Minimum scroll delta (px) before the tab bar starts collapsing. Matches
 *  OtherProfileScreen and MarriageLandingScreen so all surfaces feel identical. */
const SCROLL_DELTA_THRESHOLD = 8;

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Full deck view for a bookmarked profile.
 *
 * Resolves the profile from `useBookmarks().getBookmark(userId)`. If the
 * bookmark is missing (removed from another surface), renders an `EmptyState`
 * with a Back button — no crash, no DECK_FIXTURES fallback.
 */
export function BookmarkDeckViewScreen(): React.ReactElement {
  const navigation = useNavigation<BookmarkDeckViewNav>();
  const route = useRoute<BookmarkDeckViewRoute>();
  const { userId } = route.params;

  const { getBookmark } = useBookmarks();
  const profile: DummyDeckProfile | undefined = getBookmark(userId);

  // ── Friendship state (outgoing requests) ────────────────────────────────────
  const { sendRequest } = useFriendship();

  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // ── Tab-bar-hidden lifecycle reset ─────────────────────────────────────────
  // Reset to 0 on mount (arrive with tab bar visible) and on unmount (so
  // ExploreHomeScreen always sees the bar visible after we leave).
  useEffect(() => {
    tabBarHidden.value = withTiming(0, { duration: 220 });
    return () => {
      tabBarHidden.value = withTiming(0, { duration: 220 });
    };
  }, []);

  // ── Scroll handler → drives tabBarHidden ───────────────────────────────────
  const previousScrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      const currentY = event.contentOffset.y;
      const delta = currentY - previousScrollY.value;

      if (delta > SCROLL_DELTA_THRESHOLD) {
        tabBarHidden.value = withTiming(1, { duration: 220 });
      } else if (delta < -SCROLL_DELTA_THRESHOLD) {
        tabBarHidden.value = withTiming(0, { duration: 220 });
      }

      previousScrollY.value = currentY;
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleFabPress = useCallback(() => {
    setModalVisible(true);
  }, []);

  const handleCancel = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handleConfirmed = useCallback(() => {
    setModalVisible(false);
    // TODO(mock-only): real request-create ships in phase 15
    if (profile !== undefined) {
      sendRequest(profile.user_id).catch(console.warn);
    }
    navigation.goBack();
  }, [navigation, profile, sendRequest]);

  // ── Derived values ─────────────────────────────────────────────────────────

  const fabAccessibilityLabel = useMemo(() => {
    if (profile === undefined) {
      return t('bookmarks.deckView.sendRequestAccessibility');
    }
    return t('bookmarks.deckView.sendRequestAccessibility').replace(
      '{name}',
      `${profile.first_name} ${profile.last_name}`,
    );
  }, [profile]);

  const targetName = profile !== undefined
    ? `${profile.first_name} ${profile.last_name}`
    : '';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View testID="bookmark-deck-view-screen" style={styles.root}>
      {/* Sticky back-arrow header */}
      <BackHeaderBar
        onBack={handleBack}
        accessibilityLabel={t('bookmarks.deckView.back')}
      />

      {profile === undefined ? (
        /* Missing bookmark — removed from another surface concurrently */
        <View testID="bookmark-missing-state" style={styles.missingContainer}>
          <EmptyState
            title={t('bookmarks.deckView.missingTitle')}
            description={t('bookmarks.deckView.missingDescription')}
            accessibilityLabel={t('bookmarks.deckView.missingTitle')}
          />
          <Button
            label={t('bookmarks.deckView.back')}
            variant="ghost"
            size="md"
            onPress={handleBack}
            testID="bookmark-missing-back-button"
          />
        </View>
      ) : (
        /* Valid bookmark — render deck card in scrollable body */
        <Animated.ScrollView
          testID="bookmark-deck-view-scroll"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
        >
          <DeckCard deck={profile} />
        </Animated.ScrollView>
      )}

      {/* Floating add-request button — always rendered so layout is stable,
          but only meaningful when profile is defined. Collapse animation
          runs via the shared tabBarHidden value regardless of profile state. */}
      {profile !== undefined && (
        <FloatingAddRequestButton
          onPress={handleFabPress}
          accessibilityLabel={fabAccessibilityLabel}
          hidden={tabBarHidden}
        />
      )}

      {/* SendRequestModal — rendered at the root so it sits above all content */}
      <SendRequestModal
        visible={modalVisible}
        targetName={targetName}
        onCancel={handleCancel}
        onConfirmed={handleConfirmed}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  missingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
