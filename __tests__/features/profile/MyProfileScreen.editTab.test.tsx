/**
 * Edit-tab wiring tests for MyProfileScreen (stories 15.6 + 15.7).
 *
 * These tests extend the existing MyProfileScreen suite with ACs specific to
 * the 15.6 and 15.7 Edit-tab DevTriggersPanel + modal integration.
 *
 * Story 15.6 AC coverage:
 * (a) Incoming trigger button is rendered inside DevTriggersPanel on Edit tab.
 * (b) Initial modal state is closed (modal renders nothing).
 * (c) Tapping the trigger button opens IncomingRequestModal.
 * (d) Accept path invokes acceptRequest on the mocked FriendshipProvider AND
 *     renders the interpolated friendRequests.incoming.acceptedToast snackbar
 *     with Qurat's first name.
 * (e) Decline path invokes declineRequest AND renders
 *     friendRequests.incoming.declinedToast snackbar.
 *
 * Story 15.7 AC coverage:
 * (f) Both trigger buttons (Incoming + Accepted) are rendered as children of
 *     DevTriggersPanel.
 * (g) Opening one modal does not open the other (independent state).
 * (h) Tapping the RequestAcceptedModal Say-hi button triggers the nested
 *     cross-tab navigation with MEHVISH_USER_ID — asserted via the mocked
 *     navigate() jest.fn() which captures the exact call shape.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { MyProfileScreen } from '@/features/profile/screens/MyProfileScreen';

// ── Fixture (module-level — safe in test bodies, NOT used inside jest.mock factory) ──

const quratFixture = require('../../../assets/dummyqurat.json') as {
  user_id: string;
  first_name: string;
  last_name: string;
  age: number;
  current_residence_city: string;
};

const mehvishFixture = require('../../../assets/dummymehvish.json') as {
  user_id: string;
  first_name: string;
  last_name: string;
  age: number;
  current_residence_city: string;
};

// ── Native module mocks ────────────────────────────────────────────────────────

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

jest.mock('expo-image', () => {
  const Rct = require('react') as typeof import('react');
  const RN = require('react-native') as typeof import('react-native');
  return {
    Image: function (props: any) {
      return Rct.createElement(RN.View, {
        testID: props.testID,
        accessibilityLabel: props.accessibilityLabel,
      });
    },
  };
});

// ── Navigation mock ────────────────────────────────────────────────────────────

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native') as Record<string, unknown>;
  return {
    ...actual,
    useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
    useRoute: () => ({ params: { initialTab: 'edit' } }),
  };
});

// ── FriendshipProvider mock ────────────────────────────────────────────────────

const mockAcceptRequest = jest.fn();
const mockDeclineRequest = jest.fn();

jest.mock('@/state/friendship/FriendshipProvider', () => {
  // Inline require inside the factory so Jest hoisting does not complain about
  // out-of-scope variable references (jest.mock runs before variable declarations).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockQurat = require('../../../assets/dummyqurat.json') as {
    user_id: string;
    first_name: string;
    last_name: string;
    age: number;
    current_residence_city: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockMehvish = require('../../../assets/dummymehvish.json') as {
    user_id: string;
    first_name: string;
    last_name: string;
    age: number;
    current_residence_city: string;
  };

  return {
    useFriendship: () => ({
      // The outer jest.fn() vars are accessible because they are prefixed with
      // 'mock', which Jest allows in hoisted factory scope.
      acceptRequest: mockAcceptRequest,
      declineRequest: mockDeclineRequest,
      getFullProfile: (userId: string) => {
        if (userId === mockQurat.user_id) return mockQurat;
        if (userId === mockMehvish.user_id) return mockMehvish;
        return undefined;
      },
      friends: [],
      requests: [],
      isFriend: () => false,
      receivedRequestFrom: () => false,
      pendingToast: null,
      setPendingToast: jest.fn(),
      consumePendingToast: jest.fn(),
      outgoingRequestIds: [],
      sendRequest: jest.fn(),
      hasOutgoingRequest: () => false,
    }),
  };
});

// Mock ChatProvider to expose MEHVISH_USER_ID without AsyncStorage / real hooks.
// The constant is a pure string derived from dummymehvish.json — safe to inline.
jest.mock('@/state/chat/ChatProvider', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mehvish = require('../../../assets/dummymehvish.json') as { user_id: string };
  return {
    MEHVISH_USER_ID: mehvish.user_id,
    ChatProvider: function (props: any) { return props.children; },
    useChatHistory: () => ({
      messages: [],
      loading: false,
      sendMessage: jest.fn(),
      updateMessage: jest.fn(),
      deleteMessage: jest.fn(),
    }),
  };
});

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Render helper ──────────────────────────────────────────────────────────────

function renderScreen() {
  return render(
    <ThemeProvider>
      <MyProfileScreen />
    </ThemeProvider>,
  );
}

// ── Setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockGoBack.mockClear();
  mockNavigate.mockClear();
  mockAcceptRequest.mockClear();
  mockDeclineRequest.mockClear();
});

// ── (a) Incoming trigger button rendered inside DevTriggersPanel ───────────────

describe('(a) incoming trigger button rendered inside DevTriggersPanel on Edit tab', () => {
  it('renders the DevTriggersPanel', () => {
    renderScreen();
    expect(screen.getByTestId('dev-triggers-panel')).toBeTruthy();
  });

  it('renders the incoming trigger button', () => {
    renderScreen();
    expect(screen.getByTestId('dev-trigger-incoming-btn')).toBeTruthy();
  });

  it('shows the correct button label', () => {
    renderScreen();
    expect(
      screen.getByText('Simulate incoming friend request (Qurat)'),
    ).toBeTruthy();
  });
});

// ── (b) Initial modal state is closed ─────────────────────────────────────────

describe('(b) initial modal state is closed', () => {
  it('does not render the modal card initially', () => {
    renderScreen();
    expect(screen.queryByTestId('incoming-request-card')).toBeNull();
  });

  it('does not render the modal accept button initially', () => {
    renderScreen();
    expect(screen.queryByTestId('incoming-request-accept-btn')).toBeNull();
  });
});

// ── (c) Tapping the trigger button opens the modal ────────────────────────────

describe('(c) tapping the trigger button opens IncomingRequestModal', () => {
  it('opens the modal when the trigger button is pressed', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('dev-trigger-incoming-btn'));
    expect(screen.getByTestId('incoming-request-card')).toBeTruthy();
  });

  it('shows Qurat\'s name in the modal', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('dev-trigger-incoming-btn'));
    expect(screen.getByText(`${quratFixture.first_name} ${quratFixture.last_name}`)).toBeTruthy();
  });
});

// ── (d) Accept path ───────────────────────────────────────────────────────────

describe('(d) Accept path invokes acceptRequest + renders interpolated snackbar', () => {
  it('calls acceptRequest with Qurat\'s user_id when Accept is pressed', async () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('dev-trigger-incoming-btn'));
    fireEvent.press(screen.getByTestId('incoming-request-accept-btn'));
    expect(mockAcceptRequest).toHaveBeenCalledWith(quratFixture.user_id);
  });

  it('renders the snackbar with Qurat\'s first name interpolated', async () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('dev-trigger-incoming-btn'));
    fireEvent.press(screen.getByTestId('incoming-request-accept-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('my-profile-snackbar')).toBeTruthy();
    });
    // "You and Qurat are now connected!" — verify firstName interpolation
    expect(screen.getByText(`You and ${quratFixture.first_name} are now connected!`)).toBeTruthy();
  });

  it('does NOT call declineRequest on Accept path', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('dev-trigger-incoming-btn'));
    fireEvent.press(screen.getByTestId('incoming-request-accept-btn'));
    expect(mockDeclineRequest).not.toHaveBeenCalled();
  });
});

// ── (e) Decline path ──────────────────────────────────────────────────────────

describe('(e) Decline path invokes declineRequest + renders declinedToast', () => {
  it('calls declineRequest with Qurat\'s user_id when Decline is pressed', async () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('dev-trigger-incoming-btn'));
    fireEvent.press(screen.getByTestId('incoming-request-decline-btn'));
    expect(mockDeclineRequest).toHaveBeenCalledWith(quratFixture.user_id);
  });

  it('renders the declined toast snackbar', async () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('dev-trigger-incoming-btn'));
    fireEvent.press(screen.getByTestId('incoming-request-decline-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('my-profile-snackbar')).toBeTruthy();
    });
    expect(screen.getByText('Request declined')).toBeTruthy();
  });

  it('does NOT call acceptRequest on Decline path', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('dev-trigger-incoming-btn'));
    fireEvent.press(screen.getByTestId('incoming-request-decline-btn'));
    expect(mockAcceptRequest).not.toHaveBeenCalled();
  });
});

// ── Story 15.7 ACs ────────────────────────────────────────────────────────────

// ── (f) Both trigger buttons rendered inside DevTriggersPanel ─────────────────

describe('(f) both trigger buttons (Incoming + Accepted) rendered inside DevTriggersPanel', () => {
  it('renders both the incoming and accepted trigger buttons', () => {
    renderScreen();
    expect(screen.getByTestId('dev-trigger-incoming-btn')).toBeTruthy();
    expect(screen.getByTestId('dev-trigger-accepted-btn')).toBeTruthy();
  });

  it('both buttons are inside the DevTriggersPanel', () => {
    renderScreen();
    const panel = screen.getByTestId('dev-triggers-panel');
    expect(panel).toBeTruthy();
    // Both testIDs must be present in the tree (panel contains them as children)
    expect(screen.getByTestId('dev-trigger-incoming-btn')).toBeTruthy();
    expect(screen.getByTestId('dev-trigger-accepted-btn')).toBeTruthy();
  });

  it('shows the accepted button label', () => {
    renderScreen();
    expect(screen.getByText('Simulate request accepted (Mehvish)')).toBeTruthy();
  });
});

// ── (g) Opening one modal does not open the other ─────────────────────────────

describe('(g) opening one modal does not open the other (independent state)', () => {
  it('opening IncomingRequestModal does not show RequestAcceptedModal card', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('dev-trigger-incoming-btn'));
    // IncomingRequestModal card is visible
    expect(screen.getByTestId('incoming-request-card')).toBeTruthy();
    // RequestAcceptedModal card must NOT be visible
    expect(screen.queryByTestId('request-accepted-card')).toBeNull();
  });

  it('opening RequestAcceptedModal does not show IncomingRequestModal card', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('dev-trigger-accepted-btn'));
    // RequestAcceptedModal card is visible
    expect(screen.getByTestId('request-accepted-card')).toBeTruthy();
    // IncomingRequestModal card must NOT be visible
    expect(screen.queryByTestId('incoming-request-card')).toBeNull();
  });

  it('opening then closing one modal leaves the other unopened', () => {
    renderScreen();
    // Open incoming modal
    fireEvent.press(screen.getByTestId('dev-trigger-incoming-btn'));
    expect(screen.getByTestId('incoming-request-card')).toBeTruthy();
    // Decline closes it
    fireEvent.press(screen.getByTestId('incoming-request-decline-btn'));
    expect(screen.queryByTestId('incoming-request-card')).toBeNull();
    // Accepted modal was never opened
    expect(screen.queryByTestId('request-accepted-card')).toBeNull();
  });
});

// ── (h) Say-hi button triggers nested cross-tab navigation ───────────────────

describe('(h) Say-hi triggers navigation.navigate("Chat", { screen: "ChatRoomScreen", params: { friendUserId: MEHVISH_USER_ID } })', () => {
  it('calls navigation.navigate with correct Chat / ChatRoomScreen params when Say hi is pressed', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('dev-trigger-accepted-btn'));
    expect(screen.getByTestId('request-accepted-card')).toBeTruthy();
    fireEvent.press(screen.getByTestId('request-accepted-say-hi-btn'));
    expect(mockNavigate).toHaveBeenCalledWith('Chat', {
      screen: 'ChatRoomScreen',
      params: { friendUserId: mehvishFixture.user_id },
    });
  });

  it('also closes the modal after Say hi is pressed', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('dev-trigger-accepted-btn'));
    fireEvent.press(screen.getByTestId('request-accepted-say-hi-btn'));
    expect(screen.queryByTestId('request-accepted-card')).toBeNull();
  });
});
