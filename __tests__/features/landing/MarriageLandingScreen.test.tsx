/**
 * Screen-wiring tests for MarriageLandingScreen (phase 12 → phase 13 update).
 *
 * Phase 13 refactor: the screen now renders a deck of condensed DeckCards
 * (CandidateHero + 4 sections each) instead of a single full-profile
 * ProfileScrollView. This file has been updated to match the phase-13 behavior.
 *
 * (a) Renders hero with the first deck card's first_name "Aisha" visible.
 * (b) DeckCard sections: 4 sections rendered, 10 sections NOT rendered.
 * (c) Action buttons: Like → "Friend request sent"; Pass → no toast;
 *     Star → "Available in a later phase".
 * (d) HeaderBar: filter + bell present; NO Sort pill / lightning bubble;
 *     unread-dot derived from dummyprofile (defaults to false → dot absent).
 *
 * Animation is NOT tested — Reanimated worklets are mocked to no-op by the
 * global `jest.setup.ts` (registered via `setupFiles` in `jest.config.js`).
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { FriendshipProvider } from '@/state/friendship/FriendshipProvider';
import { t } from '@/labels';

// ── Native-module mocks ───────────────────────────────────────────────────────

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
      <FriendshipProvider>
        <MarriageLandingScreen />
      </FriendshipProvider>
    </ThemeProvider>,
  );
}

// ── (a) Hero renders with first_name "Aisha" (first deck card) ───────────────

describe('(a) hero renders Aisha (first deck card)', () => {
  it('renders candidate-hero testID', () => {
    renderScreen();
    expect(screen.getByTestId('candidate-hero')).toBeTruthy();
  });

  it('shows first deck card name "Aisha" in the hero name', () => {
    renderScreen();
    const nameEl = screen.getByTestId('candidate-hero-name');
    expect(nameEl).toBeTruthy();
    expect(screen.getAllByText(/Aisha/).length).toBeGreaterThanOrEqual(1);
  });
});

// ── (b) DeckCard sections — 4 present, 10 absent ─────────────────────────────

describe('(b) DeckCard sections present/absent', () => {
  beforeEach(() => {
    renderScreen();
  });

  it('CandidateHero is in the tree', () => {
    expect(screen.getByTestId('candidate-hero')).toBeTruthy();
  });

  it('HeroBlock is NOT in the tree (not used in DeckCard)', () => {
    expect(screen.queryByTestId('hero-block')).toBeNull();
  });

  it('AboutMeSection is in the tree', () => {
    expect(screen.getByTestId('about-me-section')).toBeTruthy();
  });

  it('MarriageIntentionsSection is in the tree', () => {
    expect(screen.getByTestId('marriage-intentions-section')).toBeTruthy();
  });

  it('EducationSection is in the tree', () => {
    expect(screen.getByTestId('education-section')).toBeTruthy();
  });

  it('ProfessionalCareerSection is in the tree', () => {
    expect(screen.getByTestId('professional-career-section')).toBeTruthy();
  });

  // Sections excluded from DeckCard (condensed view)
  it('FaithSection is NOT in the tree (deck card shows condensed view)', () => {
    expect(screen.queryByTestId('faith-section')).toBeNull();
  });

  it('FuturePlansSection is NOT in the tree', () => {
    expect(screen.queryByTestId('future-plans-section')).toBeNull();
  });

  it('PhotoBlockSection is NOT in the tree', () => {
    expect(screen.queryByTestId('photo-block-section')).toBeNull();
  });

  it('PersonalitySection is NOT in the tree', () => {
    expect(screen.queryByTestId('personality-section')).toBeNull();
  });

  it('ParentsSection is NOT in the tree', () => {
    expect(screen.queryByTestId('parents-section')).toBeNull();
  });

  it('AddressSection is NOT in the tree', () => {
    expect(screen.queryByTestId('address-section')).toBeNull();
  });

  it('SiblingsSection is NOT in the tree', () => {
    expect(screen.queryByTestId('siblings-section')).toBeNull();
  });

  it('VerifiedProfileSection is NOT in the tree', () => {
    expect(screen.queryByTestId('verified-profile-section')).toBeNull();
  });

  it('ContactActionsSection is NOT in the tree (deck card shows condensed view)', () => {
    expect(screen.queryByTestId('contact-actions-section')).toBeNull();
  });
});

// ── (c) Action button behaviour ───────────────────────────────────────────────

describe('(c) action button behaviour', () => {
  it('tapping the like (✓) button opens the send-request modal (not the snackbar directly)', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('action-button-like'));
    // Like now opens a confirmation modal instead of firing the snackbar
    // directly — see SendRequestModal. The snackbar only appears after the
    // full ask → confirm → sending flow completes.
    expect(screen.getByTestId('send-request-card')).toBeTruthy();
    expect(screen.queryByText(t('landing.likeSent'))).toBeNull();
  });

  it('completing the send-request modal flow fires t("landing.likeSent") snackbar', () => {
    jest.useFakeTimers();
    try {
      renderScreen();
      fireEvent.press(screen.getByTestId('action-button-like'));
      // Step 1: ask → Yes
      fireEvent.press(screen.getByTestId('send-request-yes-ask'));
      // Step 2: confirm → Yes
      fireEvent.press(screen.getByTestId('send-request-yes-confirm'));
      // Step 3: sending — advance past the 1000 ms pleasewait hold
      act(() => {
        jest.advanceTimersByTime(1100);
      });
      expect(screen.getByText(t('landing.likeSent'))).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  it('cancelling the send-request modal (No at first step) does NOT fire the snackbar', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('action-button-like'));
    fireEvent.press(screen.getByTestId('send-request-no-ask'));
    expect(screen.queryByText(t('landing.likeSent'))).toBeNull();
  });

  it('tapping the pass (X) button does NOT show any snackbar', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('action-button-pass'));
    expect(screen.queryByText(t('landing.actionUnavailable'))).toBeNull();
    expect(screen.queryByText(t('landing.likeSent'))).toBeNull();
  });

  it('tapping the star (⭐) button shows t("landing.actionUnavailable")', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('action-button-super-like'));
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

  it('does NOT render the unread-dot (dummyprofile has_unread_notifications=false)', () => {
    // Phase 13: unread-dot is derived from dummyprofile.json (current user),
    // not from dummyfemale.json (deck candidate). The real dummyprofile.json
    // has has_unread_notifications: false, so no dot appears.
    expect(screen.queryByTestId('landing-header-unread-dot')).toBeNull();
  });
});
