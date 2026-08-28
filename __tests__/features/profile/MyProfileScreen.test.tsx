/**
 * Screen-wiring tests for MyProfileScreen (story 12.5).
 *
 * (a) Preview tab (default) renders HeroBlock (self variant), AboutMe,
 *     MarriageIntentions, Faith, FuturePlans, Personality, Education,
 *     ProfessionalCareer, Parents, Address, VerifiedProfile;
 *     SiblingsSection NOT rendered (dummyprofile.siblings is empty);
 *     PhotoBlockSection NOT rendered (dummyprofile.photos.length === 1);
 *     ContactActionsSection NOT rendered (viewer === 'self').
 * (b) Edit tab renders EmptyState "Coming soon".
 * (c) top-right icon-only Share triggers Share.share.
 * (d) bottom row-link Share triggers Share.share.
 * (e) tapping the close X calls navigation.goBack.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from 'react';
import { Share } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';

// ── FriendshipProvider mock ───────────────────────────────────────────────────
// MyProfileScreen now calls useFriendship() — mock it for these wiring tests.

const mockQuratProfile = require('../../../assets/dummyqurat.json') as {
  user_id: string;
  first_name: string;
  last_name: string;
  age: number;
  current_residence_city: string;
};

jest.mock('@/state/friendship/FriendshipProvider', () => ({
  useFriendship: () => ({
    acceptRequest: jest.fn(),
    declineRequest: jest.fn(),
    getFullProfile: (userId: string) => {
      if (userId === mockQuratProfile.user_id) return mockQuratProfile;
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
}));

// ── Native module mocks ───────────────────────────────────────────────────────

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

// ── Navigation mock ───────────────────────────────────────────────────────────

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native') as Record<string, unknown>;
  return {
    ...actual,
    useNavigation: () => ({ goBack: mockGoBack }),
    useRoute: () => ({ params: {} }),
  };
});

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import { ThemeProvider } from '@/theme';
import { MyProfileScreen } from '@/features/profile/screens/MyProfileScreen';

// ── Helper ────────────────────────────────────────────────────────────────────

function renderScreen(initialTab?: 'preview' | 'edit') {
  // Inject initialTab via the mocked useRoute.
  if (initialTab !== undefined) {
    (jest.requireMock('@react-navigation/native') as any).useRoute = () => ({
      params: { initialTab },
    });
  } else {
    (jest.requireMock('@react-navigation/native') as any).useRoute = () => ({
      params: {},
    });
  }

  return render(
    <ThemeProvider>
      <MyProfileScreen />
    </ThemeProvider>,
  );
}

// ── (a) Preview tab — sections present / absent ───────────────────────────────

describe('(a) Preview tab renders expected sections', () => {
  beforeEach(() => {
    renderScreen('preview');
  });

  it('HeroBlock (self variant) is in the tree', () => {
    expect(screen.getByTestId('hero-block')).toBeTruthy();
  });

  it('AboutMeSection is in the tree', () => {
    expect(screen.getByTestId('about-me-section')).toBeTruthy();
  });

  it('MarriageIntentionsSection is in the tree', () => {
    expect(screen.getByTestId('marriage-intentions-section')).toBeTruthy();
  });

  it('FaithSection is in the tree', () => {
    expect(screen.getByTestId('faith-section')).toBeTruthy();
  });

  it('FuturePlansSection is in the tree', () => {
    expect(screen.getByTestId('future-plans-section')).toBeTruthy();
  });

  it('PersonalitySection is in the tree', () => {
    expect(screen.getByTestId('personality-section')).toBeTruthy();
  });

  it('EducationSection is in the tree', () => {
    expect(screen.getByTestId('education-section')).toBeTruthy();
  });

  it('ProfessionalCareerSection is in the tree', () => {
    expect(screen.getByTestId('professional-career-section')).toBeTruthy();
  });

  it('ParentsSection is in the tree', () => {
    expect(screen.getByTestId('parents-section')).toBeTruthy();
  });

  it('AddressSection is in the tree', () => {
    expect(screen.getByTestId('address-section')).toBeTruthy();
  });

  it('VerifiedProfileSection is in the tree', () => {
    expect(screen.getByTestId('verified-profile-section')).toBeTruthy();
  });

  // SiblingsSection hides because dummyprofile.siblings is empty.
  it('SiblingsSection is NOT rendered (siblings is empty)', () => {
    expect(screen.queryByTestId('siblings-section')).toBeNull();
  });

  // PhotoBlockSection hides because dummyprofile.photos.length === 1.
  it('PhotoBlockSection is NOT rendered (photos.length === 1)', () => {
    expect(screen.queryByTestId('photo-block-section')).toBeNull();
  });

  // ContactActionsSection hides because viewer === 'self'.
  it('ContactActionsSection is NOT rendered (viewer === "self")', () => {
    expect(screen.queryByTestId('contact-actions-section')).toBeNull();
  });
});

// ── (b) Edit tab renders DevTriggersPanel (story 15.6) ───────────────────────

describe('(b) Edit tab renders DevTriggersPanel with dev triggers', () => {
  it('tapping the Edit tab shows the DevTriggersPanel', () => {
    renderScreen('preview');
    // Switch to Edit tab.
    fireEvent.press(screen.getByTestId('my-profile-tab-edit'));
    expect(screen.getByTestId('dev-triggers-panel')).toBeTruthy();
  });

  it('rendering with initialTab="edit" directly shows the DevTriggersPanel', () => {
    renderScreen('edit');
    expect(screen.getByTestId('dev-triggers-panel')).toBeTruthy();
  });

  it('Edit tab does NOT render ProfileScrollView sections', () => {
    renderScreen('edit');
    expect(screen.queryByTestId('profile-scroll-view')).toBeNull();
  });

  it('Edit tab does NOT show "Coming soon" EmptyState (replaced by DevTriggersPanel)', () => {
    renderScreen('edit');
    expect(screen.queryByText('Coming soon')).toBeNull();
  });
});

// ── (c) Top-right icon-only Share triggers Share.share ────────────────────────

describe('(c) icon-only Share triggers Share.share', () => {
  let shareSpy: jest.SpyInstance;

  beforeEach(() => {
    shareSpy = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.sharedAction });
  });

  afterEach(() => {
    shareSpy.mockRestore();
  });

  it('pressing the header icon-only Share calls Share.share', () => {
    renderScreen('preview');
    const shareIcon = screen.getByTestId('my-profile-share-icon');
    fireEvent.press(shareIcon);
    expect(shareSpy).toHaveBeenCalledTimes(1);
  });
});

// ── (d) Bottom row-link Share triggers Share.share ────────────────────────────

describe('(d) row-link Share triggers Share.share', () => {
  let shareSpy: jest.SpyInstance;

  beforeEach(() => {
    shareSpy = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.sharedAction });
  });

  afterEach(() => {
    shareSpy.mockRestore();
  });

  it('pressing the bottom row-link Share calls Share.share', () => {
    renderScreen('preview');
    const shareRowLink = screen.getByTestId('my-profile-share-row-link');
    fireEvent.press(shareRowLink);
    expect(shareSpy).toHaveBeenCalledTimes(1);
  });
});

// ── (e) Close X calls navigation.goBack ───────────────────────────────────────

describe('(e) close X calls navigation.goBack', () => {
  beforeEach(() => {
    mockGoBack.mockClear();
  });

  it('pressing the close button calls goBack', () => {
    renderScreen('preview');
    const closeBtn = screen.getByTestId('my-profile-close-button');
    fireEvent.press(closeBtn);
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
