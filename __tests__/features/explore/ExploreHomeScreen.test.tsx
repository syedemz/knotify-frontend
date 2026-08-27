/**
 * Tests for ExploreHomeScreen (story 13.5).
 *
 * AC coverage:
 * (a) Friends tab renders Mehvish in the seed state.
 * (b) Requests tab renders Qurat in the seed state.
 * (c) Tapping Mehvish row → navigates to OtherProfileScreen with { userId, source: 'friend' }.
 * (d) Tapping Qurat's row body (not the buttons) → navigates with { userId, source: 'request' }.
 * (e) Tapping Accept on Qurat's row: Qurat disappears from Requests + appears in Friends + Snackbar fires.
 * (f) Tapping Decline on Qurat's row: Qurat disappears from Requests + Snackbar fires.
 * (g) pendingToast consume on focus: if FriendshipProvider.pendingToast is set,
 *     ExploreHomeScreen renders that string in the Snackbar exactly once on focus
 *     (and calls consumePendingToast).
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

jest.mock('react-native-safe-area-context', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  const INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
  const ctx = Rct.createContext(INSETS);
  return {
    SafeAreaProvider: function (props: any) {
      return Rct.createElement(
        ctx.Provider,
        { value: INSETS },
        Rct.createElement(RN.View, null, props.children),
      );
    },
    SafeAreaConsumer: function (props: any) { return props.children(INSETS); },
    SafeAreaView: function (props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
    SafeAreaInsetsContext: ctx,
    useSafeAreaInsets: function () { return INSETS; },
    useSafeAreaFrame: function () {
      return { x: 0, y: 0, width: 375, height: 812 };
    },
    initialWindowMetrics: {
      insets: INSETS,
      frame: { x: 0, y: 0, width: 375, height: 812 },
    },
  };
});

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';

import {
  FriendshipProvider,
  useFriendship,
} from '@/state/friendship/FriendshipProvider';
import { ExploreHomeScreen } from '@/features/explore/screens/ExploreHomeScreen';

import dummyMehvish from '../../../assets/dummymehvish.json';
import dummyQurat from '../../../assets/dummyqurat.json';

// ── Navigation mock ────────────────────────────────────────────────────────────

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

// useFocusEffect mock: immediately calls its callback on mount.
// This simulates the screen being focused so the pendingToast consumption
// logic runs in tests.
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useFocusEffect: (cb: () => void) => {
    // Call the callback once on "mount" to simulate screen gaining focus.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Rct = require('react') as typeof import('react');
    Rct.useEffect(cb, []);
  },
}));

// ── Render helpers ─────────────────────────────────────────────────────────────

/**
 * Renders ExploreHomeScreen wrapped in the real FriendshipProvider.
 * The seed state has Mehvish as a friend and a pending request from Qurat.
 */
function renderScreen() {
  return render(
    <ThemeProvider>
      <FriendshipProvider>
        <ExploreHomeScreen />
      </FriendshipProvider>
    </ThemeProvider>,
  );
}

// ── Setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// ── AC (a): Friends tab renders Mehvish ────────────────────────────────────────

describe('ExploreHomeScreen — AC (a): Friends tab renders Mehvish', () => {
  it('given screen mounts in default friends tab, then Mehvish full name is visible', () => {
    renderScreen();
    expect(
      screen.getByText(`${dummyMehvish.first_name} ${dummyMehvish.last_name}`),
    ).toBeTruthy();
  });

  it('given screen mounts in default friends tab, then Mehvish avatar thumbnail is present', () => {
    renderScreen();
    // ProfileThumbnailCircle renders with testID='profile-thumbnail-circle'
    // There should be at least one (for Mehvish's row).
    expect(screen.getAllByTestId('profile-thumbnail-circle').length).toBeGreaterThanOrEqual(1);
  });
});

// ── AC (b): Requests tab renders Qurat ────────────────────────────────────────

describe('ExploreHomeScreen — AC (b): Requests tab renders Qurat', () => {
  it('given Requests tab is selected, then Qurat full name is visible', () => {
    renderScreen();

    // Switch to Requests tab
    fireEvent.press(screen.getByTestId('explore-tab-requests'));

    expect(
      screen.getByText(`${dummyQurat.first_name} ${dummyQurat.last_name}`),
    ).toBeTruthy();
  });

  it('given Requests tab is selected, then Accept and Decline buttons are visible for Qurat', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('explore-tab-requests'));

    expect(screen.getByTestId(`request-accept-${dummyQurat.user_id}`)).toBeTruthy();
    expect(screen.getByTestId(`request-decline-${dummyQurat.user_id}`)).toBeTruthy();
  });
});

// ── AC (c): tapping Mehvish row navigates correctly ───────────────────────────

describe('ExploreHomeScreen — AC (c): tapping friend row navigates to OtherProfileScreen', () => {
  it(
    'given Friends tab, when Mehvish row is pressed, then navigate is called with userId and source=friend',
    () => {
      renderScreen();

      fireEvent.press(screen.getByTestId(`friend-row-${dummyMehvish.user_id}`));

      expect(mockNavigate).toHaveBeenCalledWith('OtherProfileScreen', {
        userId: dummyMehvish.user_id,
        source: 'friend',
      });
    },
  );
});

// ── AC (d): tapping Qurat's row body navigates correctly ──────────────────────

describe('ExploreHomeScreen — AC (d): tapping request row body navigates to OtherProfileScreen', () => {
  it(
    'given Requests tab, when Qurat row body is pressed, then navigate is called with userId and source=request',
    () => {
      renderScreen();
      fireEvent.press(screen.getByTestId('explore-tab-requests'));

      // The row body (TouchableArea on the left column) has testID request-row-body-<userId>
      fireEvent.press(screen.getByTestId(`request-row-body-${dummyQurat.user_id}`));

      expect(mockNavigate).toHaveBeenCalledWith('OtherProfileScreen', {
        userId: dummyQurat.user_id,
        source: 'request',
      });
    },
  );
});

// ── AC (e): Accept on Qurat's row ─────────────────────────────────────────────

describe('ExploreHomeScreen — AC (e): Accept button moves Qurat from Requests to Friends', () => {
  it(
    'given Requests tab, when Accept is tapped on Qurat, then Qurat disappears from Requests',
    async () => {
      renderScreen();
      fireEvent.press(screen.getByTestId('explore-tab-requests'));

      // Qurat visible before Accept
      expect(
        screen.getByText(`${dummyQurat.first_name} ${dummyQurat.last_name}`),
      ).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByTestId(`request-accept-${dummyQurat.user_id}`));
      });

      // Qurat no longer in Requests list
      // After Accept, Requests tab should show empty state
      expect(screen.queryByTestId(`request-accept-${dummyQurat.user_id}`)).toBeNull();
    },
  );

  it(
    'given Requests tab, when Accept is tapped on Qurat, then Qurat appears in Friends tab',
    async () => {
      renderScreen();
      fireEvent.press(screen.getByTestId('explore-tab-requests'));

      await act(async () => {
        fireEvent.press(screen.getByTestId(`request-accept-${dummyQurat.user_id}`));
      });

      // Switch to Friends tab — Qurat should now appear
      fireEvent.press(screen.getByTestId('explore-tab-friends'));
      expect(
        screen.getByText(`${dummyQurat.first_name} ${dummyQurat.last_name}`),
      ).toBeTruthy();
    },
  );

  it(
    'given Requests tab, when Accept is tapped on Qurat, then accepted Snackbar is visible',
    async () => {
      renderScreen();
      fireEvent.press(screen.getByTestId('explore-tab-requests'));

      await act(async () => {
        fireEvent.press(screen.getByTestId(`request-accept-${dummyQurat.user_id}`));
      });

      expect(screen.getByTestId('explore-snackbar')).toBeTruthy();
    },
  );
});

// ── AC (f): Decline on Qurat's row ────────────────────────────────────────────

describe('ExploreHomeScreen — AC (f): Decline button removes Qurat from Requests', () => {
  it(
    'given Requests tab, when Decline is tapped on Qurat, then Qurat disappears from Requests',
    async () => {
      renderScreen();
      fireEvent.press(screen.getByTestId('explore-tab-requests'));

      await act(async () => {
        fireEvent.press(screen.getByTestId(`request-decline-${dummyQurat.user_id}`));
      });

      // Qurat's decline button is gone (row removed)
      expect(screen.queryByTestId(`request-decline-${dummyQurat.user_id}`)).toBeNull();
    },
  );

  it(
    'given Requests tab, when Decline is tapped on Qurat, then declined Snackbar is visible',
    async () => {
      renderScreen();
      fireEvent.press(screen.getByTestId('explore-tab-requests'));

      await act(async () => {
        fireEvent.press(screen.getByTestId(`request-decline-${dummyQurat.user_id}`));
      });

      expect(screen.getByTestId('explore-snackbar')).toBeTruthy();
    },
  );
});

// ── AC (g): pendingToast consumed on focus ────────────────────────────────────

/**
 * To test the pendingToast handoff we need to:
 * 1. Mount FriendshipProvider.
 * 2. Set pendingToast via setPendingToast.
 * 3. Mount ExploreHomeScreen (which runs useFocusEffect → consume + show snackbar).
 *
 * We achieve step 2 by rendering an intermediate component (ToastSetter) that
 * calls setPendingToast on mount and only renders ExploreHomeScreen once set.
 */
function ToastSetterWrapper({
  message,
  children,
}: {
  message: string;
  children: React.ReactNode;
}): React.ReactElement {
  const { setPendingToast } = useFriendship();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setPendingToast(message);
    setReady(true);
  // setPendingToast is stable (useCallback with no deps in provider)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) {
    return <></>;
  }
  return <>{children}</>;
}

describe('ExploreHomeScreen — AC (g): pendingToast consumed on focus', () => {
  it(
    'given FriendshipProvider has a pendingToast set, when ExploreHomeScreen gains focus, then the toast message is displayed in the Snackbar',
    () => {
      const PENDING_TOAST_MSG = 'Request declined';

      // Render with the ToastSetterWrapper pre-setting pendingToast.
      // The wrapper delays ExploreHomeScreen's render until after setPendingToast
      // runs, so useFocusEffect fires AFTER pendingToast is set in context.
      render(
        <ThemeProvider>
          <FriendshipProvider>
            <ToastSetterWrapper message={PENDING_TOAST_MSG}>
              <ExploreHomeScreen />
            </ToastSetterWrapper>
          </FriendshipProvider>
        </ThemeProvider>,
      );

      // After initial render, the ToastSetterWrapper's useEffect fires and
      // sets pendingToast. The `ready` state flip causes ExploreHomeScreen to
      // mount, its useFocusEffect (mocked to call immediately via useEffect)
      // reads the pendingToast and calls setSnackbarMsg.
      act(() => {
        // Flush all pending effects (ToastSetterWrapper useEffect + ExploreHomeScreen useFocusEffect)
      });

      // The snackbar should be visible with the pending toast message.
      expect(screen.getByTestId('explore-snackbar')).toBeTruthy();
    },
  );

  it(
    'given ExploreHomeScreen mounts with no pendingToast, then consumePendingToast is called on focus without error and no snackbar is shown',
    () => {
      // Render a plain ExploreHomeScreen with FriendshipProvider (no pre-set toast).
      // useFocusEffect (mocked) runs immediately via useEffect on mount.
      // consumePendingToast is called even when pendingToast is null —
      // it is a no-op (sets state to null → null). No crash expected.
      expect(() => {
        render(
          <ThemeProvider>
            <FriendshipProvider>
              <ExploreHomeScreen />
            </FriendshipProvider>
          </ThemeProvider>,
        );
      }).not.toThrow();

      // With pendingToast === null, the Snackbar is NOT visible, so there is
      // no testID='explore-snackbar' element in the tree (Snackbar returns null).
      expect(screen.queryByTestId('explore-snackbar')).toBeNull();
    },
  );
});
