/**
 * Screen-wiring tests for MarriageLandingScreen (story 12.4).
 *
 * (a) Renders hero with `dummyfemale.first_name` ("Aisha") visible.
 * (b) 13 ProfileScrollView sections + 1 CandidateHero mount on the female
 *     fixture. (HeroBlock is skipped because viewer === 'other'.)
 * (c) Tapping the ✓ (like) button renders the toast text
 *     t('landing.actionUnavailable') — queried via `getByText`, not a mock.
 * (d) HeaderBar renders filter icon button + bell icon button; NO Sort pill /
 *     green lightning bubble test IDs are present.
 *
 * Animation is NOT tested — Reanimated worklets are mocked to no-op by the
 * global `jest.setup.ts` (registered via `setupFiles` in `jest.config.js`).
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { t } from '@/labels';

// ── Native-module mocks ───────────────────────────────────────────────────────

// react-native-safe-area-context — stubs the provider so ThemeProvider and
// any screen component using useSafeAreaInsets does not hit a native module.
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
    SafeAreaConsumer: function (props: any) {
      return props.children(INSETS);
    },
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

// expo-image — avoid native module in test environment.
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

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import { MarriageLandingScreen } from '@/features/landing/screens/MarriageLandingScreen';

// ── Helper ────────────────────────────────────────────────────────────────────

function renderScreen() {
  return render(
    <ThemeProvider>
      <MarriageLandingScreen />
    </ThemeProvider>,
  );
}

// ── (a) Hero renders with first_name "Aisha" ─────────────────────────────────

describe('(a) hero renders Aisha', () => {
  it('renders candidate-hero testID', () => {
    renderScreen();
    expect(screen.getByTestId('candidate-hero')).toBeTruthy();
  });

  it('shows dummyfemale.first_name "Aisha" in the hero name', () => {
    renderScreen();
    // The name text renders as "Aisha, 27" — the candidate-hero-name testID
    // targets the specific Text element so we don't hit duplicates from sections.
    const nameEl = screen.getByTestId('candidate-hero-name');
    expect(nameEl).toBeTruthy();
    // At least one element in the tree contains "Aisha" (hero name + possibly sections).
    expect(screen.getAllByText(/Aisha/).length).toBeGreaterThanOrEqual(1);
  });
});

// ── (b) 13 sections + 1 CandidateHero mount on female fixture ────────────────

describe('(b) 13 ProfileScrollView sections + CandidateHero present', () => {
  beforeEach(() => {
    renderScreen();
  });

  it('CandidateHero is in the tree', () => {
    expect(screen.getByTestId('candidate-hero')).toBeTruthy();
  });

  // HeroBlock returns null for viewer=other — not present.
  it('HeroBlock is NOT in the tree (viewer=other)', () => {
    expect(screen.queryByTestId('hero-block')).toBeNull();
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

  it('PhotoBlockSection is in the tree (photos.length === 2)', () => {
    expect(screen.getByTestId('photo-block-section')).toBeTruthy();
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

  it('SiblingsSection is in the tree (siblings.length === 2)', () => {
    expect(screen.getByTestId('siblings-section')).toBeTruthy();
  });

  it('VerifiedProfileSection is in the tree', () => {
    expect(screen.getByTestId('verified-profile-section')).toBeTruthy();
  });

  it('ContactActionsSection is in the tree (viewer=other)', () => {
    expect(screen.getByTestId('contact-actions-section')).toBeTruthy();
  });
});

// ── (c) Tapping ✓ button shows actionUnavailable toast ───────────────────────

describe('(c) action button triggers snackbar toast', () => {
  it('tapping the like (✓) button shows t("landing.actionUnavailable")', () => {
    renderScreen();
    const likeButton = screen.getByTestId('action-button-like');
    fireEvent.press(likeButton);
    expect(screen.getByText(t('landing.actionUnavailable'))).toBeTruthy();
  });

  it('snackbar message matches "Available in a later phase"', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('action-button-like'));
    expect(screen.getByText('Available in a later phase')).toBeTruthy();
  });

  it('tapping the pass (X) button also shows the toast', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('action-button-pass'));
    expect(screen.getByText(t('landing.actionUnavailable'))).toBeTruthy();
  });
});

// ── (d) HeaderBar: filter + bell icons present; no Sort pill / lightning ──────

describe('(d) HeaderBar renders filter and bell; no Sort pill or lightning', () => {
  beforeEach(() => {
    renderScreen();
  });

  it('renders the landing header bar', () => {
    expect(screen.getByTestId('landing-header-bar')).toBeTruthy();
  });

  it('renders the filter icon button', () => {
    expect(screen.getByTestId('landing-header-filter-button')).toBeTruthy();
  });

  it('renders the bell icon button', () => {
    expect(screen.getByTestId('landing-header-bell-button')).toBeTruthy();
  });

  it('does NOT render a Sort pill test ID', () => {
    expect(screen.queryByTestId('landing-header-sort-pill')).toBeNull();
  });

  it('does NOT render a lightning bubble test ID', () => {
    expect(screen.queryByTestId('landing-header-lightning-bubble')).toBeNull();
  });

  it('renders the unread notification dot (dummyfemale has_unread_notifications=true)', () => {
    // dummyfemale.__dummy_display_only.has_unread_notifications === true
    expect(screen.getByTestId('landing-header-unread-dot')).toBeTruthy();
  });
});
