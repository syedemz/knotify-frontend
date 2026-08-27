/**
 * CandidateHero.deck.test.tsx (story 13.3 AC7e)
 *
 * Verifies that CandidateHero accepts a minimal `CandidateHeroProfile` literal
 * (only required fields) without any cast at the call site, and renders the
 * name correctly.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { CandidateHero } from '@/features/landing/components/CandidateHero';
import type { CandidateHeroProfile } from '@/features/landing/components/CandidateHero';

// ── Native-module mocks ───────────────────────────────────────────────────────

jest.mock('react-native-safe-area-context', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  const INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
  const ctx = Rct.createContext(INSETS);
  return {
    SafeAreaProvider: function (props: any) {
      return Rct.createElement(ctx.Provider, { value: INSETS }, props.children);
    },
    useSafeAreaInsets: function () { return INSETS; },
    SafeAreaConsumer: function (props: any) { return props.children(INSETS); },
    SafeAreaView: function (props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
    SafeAreaInsetsContext: ctx,
    initialWindowMetrics: { insets: INSETS, frame: { x: 0, y: 0, width: 375, height: 812 } },
  };
});

jest.mock('expo-image', () => {
  const Rct = require('react') as typeof import('react');
  const RN = require('react-native') as typeof import('react-native');
  return {
    Image: function (props: any) {
      return Rct.createElement(RN.View, { testID: props.testID, accessibilityLabel: props.accessibilityLabel });
    },
  };
});

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Minimal CandidateHeroProfile literal (no cast) ────────────────────────────

/**
 * This object is typed explicitly as `CandidateHeroProfile` — no cast.
 * If the type widening AC is not implemented, TypeScript will fail here.
 */
const minimalProfile: CandidateHeroProfile = {
  first_name: 'Zara',
  age: 25,
  current_residence_city: 'London',
  current_residence_country: 'United Kingdom',
  resident_country_code: 'GB',
  job_title: 'Designer',
  photos: null,
  photo_url: null,
  faceSelfieUri: null,
};

describe('CandidateHero accepts CandidateHeroProfile (widened type)', () => {
  it('renders without TypeScript cast using minimal CandidateHeroProfile', () => {
    render(
      <ThemeProvider>
        <CandidateHero profile={minimalProfile} />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('candidate-hero')).toBeTruthy();
  });

  it('renders first_name from minimal CandidateHeroProfile', () => {
    render(
      <ThemeProvider>
        <CandidateHero profile={minimalProfile} />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('candidate-hero-name')).toBeTruthy();
    expect(screen.getByText(/Zara/)).toBeTruthy();
  });

  it('shows no verified tick when faceSelfieUri is null', () => {
    render(
      <ThemeProvider>
        <CandidateHero profile={minimalProfile} />
      </ThemeProvider>,
    );
    expect(screen.queryByTestId('candidate-hero-verified-tick')).toBeNull();
  });

  it('shows active-today bubble when __dummy_display_only.is_active_today is true', () => {
    const profile: CandidateHeroProfile = {
      ...minimalProfile,
      __dummy_display_only: { is_active_today: true },
    };
    render(
      <ThemeProvider>
        <CandidateHero profile={profile} />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('hero-active-today-bubble')).toBeTruthy();
  });

  it('shows gold bubble when __dummy_display_only.membership_tier is "gold"', () => {
    const profile: CandidateHeroProfile = {
      ...minimalProfile,
      __dummy_display_only: { membership_tier: 'gold' },
    };
    render(
      <ThemeProvider>
        <CandidateHero profile={profile} />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('hero-gold-bubble')).toBeTruthy();
  });
});
