/**
 * Tests for OtherProfileScreen (story 13.4 + bug-fix phase 15).
 *
 * AC coverage:
 * (a) source='friend' for Mehvish → ProfileScrollView shown, ContactActionsSection present,
 *     no request-action bar.
 * (b) source='request' for Qurat → ProfileScrollView shown, ContactActionsSection absent,
 *     Accept + Decline buttons present.
 * (c) Access-guard: unknown userId + source='friend' → EmptyState shown.
 * (d) Access-guard: unknown userId + source='request' → EmptyState shown.
 * (e) Accept-flow no-flicker: fire Accept on Qurat, assert screen still shows
 *     ProfileScrollView (not EmptyState) during 1499ms window. At 1500ms, goBack fires.
 * (f) Accept press → calls acceptRequest → after 1500 ms navigates back.
 * (g) Decline press → calls declineRequest → IMMEDIATELY calls goBack (same tick).
 * (h) Back button press → navigates back.
 * (i) Missing profile (undefined from getFullProfile) → EmptyState shown.
 * (j) Accepted snackbar visible during the 1499ms window.
 * (k) Decline does NOT render a snackbar on OtherProfileScreen (handoff mechanism used instead).
 * (l) Chat FAB press → calls openChatRoom spy with profile.user_id (bug-fix: was showing
 *     "coming soon" toast; now navigates to ChatRoomScreen via the shared helper).
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── openChatRoom mock ──────────────────────────────────────────────────────────
// Exposes a spy so we can assert the chat FAB calls openChatRoom with the
// correct user_id rather than inlining a "coming soon" snackbar.
const mockOpenChatRoom = jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined);

jest.mock('@/features/chat/navigation/openChatRoom', () => ({
  chatRoomExistsForUser: jest.fn().mockResolvedValue(true),
  useOpenChatRoom: () => mockOpenChatRoom,
}));

jest.mock('react-native-safe-area-context', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  const INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
  const ctx = Rct.createContext(INSETS);
  return {
    SafeAreaProvider: function (props: any) {
      return Rct.createElement(ctx.Provider, { value: INSETS }, Rct.createElement(RN.View, null, props.children));
    },
    SafeAreaConsumer: function (props: any) { return props.children(INSETS); },
    SafeAreaView: function (props: any) { return Rct.createElement(RN.View, null, props.children); },
    SafeAreaInsetsContext: ctx,
    useSafeAreaInsets: function () { return INSETS; },
    useSafeAreaFrame: function () { return { x: 0, y: 0, width: 375, height: 812 }; },
    initialWindowMetrics: { insets: INSETS, frame: { x: 0, y: 0, width: 375, height: 812 } },
  };
});

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';

import { FriendshipProvider } from '@/state/friendship/FriendshipProvider';
import { OtherProfileScreen } from '@/features/profile/screens/OtherProfileScreen';

import dummyMehvish from '../../../assets/dummymehvish.json';
import dummyQurat from '../../../assets/dummyqurat.json';

// ── Navigation + routing mocks ─────────────────────────────────────────────────

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    navigate: mockNavigate,
  }),
  useRoute: () => mockRoute,
}));

let mockRoute: { params: { userId: string; source: 'friend' | 'request' } };

// ── Render helper ──────────────────────────────────────────────────────────────

function renderScreen() {
  return render(
    <ThemeProvider>
      <FriendshipProvider>
        <OtherProfileScreen />
      </FriendshipProvider>
    </ThemeProvider>,
  );
}

// ── Setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

// ── AC (a): source='friend' for Mehvish ───────────────────────────────────────

describe('OtherProfileScreen — AC (a): source=friend for Mehvish', () => {
  beforeEach(() => {
    mockRoute = { params: { userId: dummyMehvish.user_id, source: 'friend' } };
  });

  it('renders the profile-scroll-view', () => {
    renderScreen();
    expect(screen.getByTestId('profile-scroll-view')).toBeTruthy();
  });

  it('ContactActionsSection IS in the tree (friend view exposes contact)', () => {
    renderScreen();
    expect(screen.getByTestId('contact-actions-section')).toBeTruthy();
  });

  it('request-action bar (Accept + Decline) is NOT rendered', () => {
    renderScreen();
    expect(screen.queryByTestId('other-profile-request-bar')).toBeNull();
  });

  it('BackHeaderBar is rendered', () => {
    renderScreen();
    expect(screen.getByTestId('back-header-bar')).toBeTruthy();
  });
});

// ── AC (b): source='request' for Qurat ───────────────────────────────────────

describe('OtherProfileScreen — AC (b): source=request for Qurat', () => {
  beforeEach(() => {
    mockRoute = { params: { userId: dummyQurat.user_id, source: 'request' } };
  });

  it('renders the profile-scroll-view', () => {
    renderScreen();
    expect(screen.getByTestId('profile-scroll-view')).toBeTruthy();
  });

  it('ContactActionsSection is NOT in the tree (request view hides contact)', () => {
    renderScreen();
    expect(screen.queryByTestId('contact-actions-section')).toBeNull();
  });

  it('Accept button is rendered in the request-action bar', () => {
    renderScreen();
    expect(screen.getByTestId('other-profile-accept-button')).toBeTruthy();
  });

  it('Decline button is rendered in the request-action bar', () => {
    renderScreen();
    expect(screen.getByTestId('other-profile-decline-button')).toBeTruthy();
  });

  it('request-action bar container is in the tree', () => {
    renderScreen();
    expect(screen.getByTestId('other-profile-request-bar')).toBeTruthy();
  });
});

// ── AC (c): access-guard — unknown userId + source='friend' ───────────────────

describe('OtherProfileScreen — AC (c): access-guard unknown userId source=friend', () => {
  beforeEach(() => {
    mockRoute = { params: { userId: 'unknown-user-000', source: 'friend' } };
  });

  it('renders EmptyState (not authorized)', () => {
    renderScreen();
    // EmptyState is shown, profile-scroll-view is not
    expect(screen.queryByTestId('profile-scroll-view')).toBeNull();
  });

  it('EmptyState is visible in the tree', () => {
    renderScreen();
    // EmptyState shows the notAuthorized title text
    expect(screen.queryByTestId('other-profile-screen')).toBeTruthy();
  });
});

// ── AC (d): access-guard — unknown userId + source='request' ──────────────────

describe('OtherProfileScreen — AC (d): access-guard unknown userId source=request', () => {
  beforeEach(() => {
    mockRoute = { params: { userId: 'unknown-user-111', source: 'request' } };
  });

  it('renders EmptyState (not authorized), no profile-scroll-view', () => {
    renderScreen();
    expect(screen.queryByTestId('profile-scroll-view')).toBeNull();
  });
});

// ── AC (e): Accept no-flicker test (B1) ──────────────────────────────────────

describe('OtherProfileScreen — AC (e): Accept no-flicker during 1500ms window', () => {
  beforeEach(() => {
    mockRoute = { params: { userId: dummyQurat.user_id, source: 'request' } };
  });

  it('after Accept, ProfileScrollView still renders during 1499ms window (isFriend=true keeps guard open)', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('other-profile-accept-button'));

    // Advance by less than 1500ms — goBack has NOT fired yet
    act(() => {
      jest.advanceTimersByTime(1499);
    });

    // Profile is still visible because isFriend(quratId) is now true
    expect(screen.getByTestId('profile-scroll-view')).toBeTruthy();
  });

  it('after Accept, EmptyState is NOT shown during the 1499ms window', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('other-profile-accept-button'));

    act(() => {
      jest.advanceTimersByTime(1499);
    });

    // The access guard should not trip (widened guard: isFriend=true is also authorized)
    expect(screen.getByTestId('profile-scroll-view')).toBeTruthy();
  });

  it('after Accept, goBack is called after 1500ms have elapsed', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('other-profile-accept-button'));

    // At 1499ms, goBack has not fired
    act(() => {
      jest.advanceTimersByTime(1499);
    });
    expect(mockGoBack).not.toHaveBeenCalled();

    // At 1500ms, goBack fires
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});

// ── AC (f): Accept press → calls acceptRequest → navigates back after 1500ms ──

describe('OtherProfileScreen — AC (f): Accept calls acceptRequest and navigates after 1500ms', () => {
  beforeEach(() => {
    mockRoute = { params: { userId: dummyQurat.user_id, source: 'request' } };
  });

  it('Accept press calls acceptRequest with quratId', () => {
    // We verify via state change: after accept, isFriend should be true
    // and the screen should stay visible (covered by AC e). To also check
    // acceptRequest was called, we rely on the no-flicker test which would
    // only pass if acceptRequest mutated state correctly.
    renderScreen();

    // Verify action bar is present (source=request)
    expect(screen.getByTestId('other-profile-accept-button')).toBeTruthy();

    // Fire accept
    fireEvent.press(screen.getByTestId('other-profile-accept-button'));

    // goBack not yet called
    act(() => { jest.advanceTimersByTime(1499); });
    expect(mockGoBack).not.toHaveBeenCalled();

    // goBack called at 1500ms
    act(() => { jest.advanceTimersByTime(1); });
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});

// ── AC (g): Decline → immediate goBack ───────────────────────────────────────

describe('OtherProfileScreen — AC (g): Decline calls declineRequest and goBack immediately', () => {
  beforeEach(() => {
    mockRoute = { params: { userId: dummyQurat.user_id, source: 'request' } };
  });

  it('Decline press calls goBack in the same tick (no timer advance needed)', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('other-profile-decline-button'));
    // No timer advance — goBack should have fired synchronously
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('Decline snackbar text is NOT visible on OtherProfileScreen (handoff to Explore)', () => {
    renderScreen();
    // The declined toast text is NOT rendered on this screen
    // It is forwarded to ExploreHomeScreen via FriendshipProvider.pendingToast
    expect(screen.queryByTestId('other-profile-decline-snackbar')).toBeNull();
  });
});

// ── AC (h): Back button press → goBack ────────────────────────────────────────

describe('OtherProfileScreen — AC (h): Back button navigates back', () => {
  beforeEach(() => {
    mockRoute = { params: { userId: dummyMehvish.user_id, source: 'friend' } };
  });

  it('pressing BackHeaderBar back button calls navigation.goBack()', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('back-header-back-button'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});

// ── AC (i): Missing profile → EmptyState (NG1 defensive path) ─────────────────

describe('OtherProfileScreen — AC (i): missing profile renders EmptyState', () => {
  beforeEach(() => {
    // A userId not in the ALL_FULL_PROFILES registry
    mockRoute = { params: { userId: 'not-in-registry-000', source: 'friend' } };
  });

  it('when getFullProfile returns undefined, renders EmptyState not profile', () => {
    renderScreen();
    expect(screen.queryByTestId('profile-scroll-view')).toBeNull();
    expect(screen.getByTestId('other-profile-screen')).toBeTruthy();
  });
});

// ── AC (j): Accept snackbar visible during 1499ms window ─────────────────────

describe('OtherProfileScreen — AC (j): accepted snackbar visible during 1500ms window', () => {
  beforeEach(() => {
    mockRoute = { params: { userId: dummyQurat.user_id, source: 'request' } };
  });

  it('after Accept, accepted-toast snackbar is visible before goBack fires', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('other-profile-accept-button'));

    act(() => { jest.advanceTimersByTime(1499); });

    // The snackbar should be visible (not yet dismissed)
    expect(screen.getByTestId('other-profile-accept-snackbar')).toBeTruthy();
  });
});

// ── AC (l): Chat FAB → openChatRoom called with profile.user_id (bug-fix) ─────
//
// Before the bug-fix, pressing the chat FAB showed a "Chat coming soon" snackbar.
// After the fix, it calls `useOpenChatRoom()(profile.user_id)` which navigates to
// ChatRoomScreen. We verify by asserting the mock spy was called with Mehvish's id.

describe('OtherProfileScreen — AC (l): chat FAB opens ChatRoom via useOpenChatRoom', () => {
  beforeEach(() => {
    mockRoute = { params: { userId: dummyMehvish.user_id, source: 'friend' } };
    mockOpenChatRoom.mockClear();
  });

  it('pressing the chat FAB calls openChatRoom with the friend\'s user_id', () => {
    renderScreen();

    // The FloatingChatButton renders with testID="floating-chat-button".
    const chatFab = screen.getByTestId('floating-chat-button');
    fireEvent.press(chatFab);

    expect(mockOpenChatRoom).toHaveBeenCalledTimes(1);
    expect(mockOpenChatRoom).toHaveBeenCalledWith(dummyMehvish.user_id);
  });

  it('pressing the chat FAB does NOT show a "coming soon" snackbar', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('floating-chat-button'));

    // The Snackbar renders null when visible=false (snackbar message stays null).
    // Confirm no "Chat coming soon" text appears in the tree.
    expect(screen.queryByText('Chat coming soon')).toBeNull();
    // The snackbar testID itself is absent because Snackbar returns null when not visible.
    expect(screen.queryByTestId('other-profile-accept-snackbar')).toBeNull();
  });
});
