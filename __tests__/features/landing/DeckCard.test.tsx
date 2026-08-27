/**
 * DeckCard.test.tsx (story 13.3 AC7a)
 *
 * Verifies that DeckCard renders CandidateHero + 4 sections (AboutMe,
 * MarriageIntentions, Education, ProfessionalCareer) and does NOT render the
 * other 10 sections (photos, faith, personality, address, parents, siblings,
 * verified-profile, contact-actions, future-plans, hero-block).
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { DeckCard } from '@/features/landing/components/DeckCard';
import type { DummyDeckProfile } from '@/types/DummyDeckProfile';

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

// ── Fixture ───────────────────────────────────────────────────────────────────

// Use the first deck fixture (Aisha) for rendering tests.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const deckFixture = require('../../../assets/dummyfemale.json') as DummyDeckProfile;

function renderCard() {
  return render(
    <ThemeProvider>
      <DeckCard deck={deckFixture} />
    </ThemeProvider>,
  );
}

// ── Included sections ─────────────────────────────────────────────────────────

describe('DeckCard renders the 4 required sections', () => {
  it('renders CandidateHero', () => {
    renderCard();
    expect(screen.getByTestId('candidate-hero')).toBeTruthy();
  });

  it('renders AboutMeSection', () => {
    renderCard();
    expect(screen.getByTestId('about-me-section')).toBeTruthy();
  });

  it('renders MarriageIntentionsSection', () => {
    renderCard();
    expect(screen.getByTestId('marriage-intentions-section')).toBeTruthy();
  });

  it('renders EducationSection', () => {
    renderCard();
    expect(screen.getByTestId('education-section')).toBeTruthy();
  });

  it('renders ProfessionalCareerSection', () => {
    renderCard();
    expect(screen.getByTestId('professional-career-section')).toBeTruthy();
  });
});

// ── Excluded sections ─────────────────────────────────────────────────────────

describe('DeckCard does NOT render excluded sections', () => {
  it('does NOT render HeroBlock', () => {
    renderCard();
    expect(screen.queryByTestId('hero-block')).toBeNull();
  });

  it('does NOT render PhotoBlockSection', () => {
    renderCard();
    expect(screen.queryByTestId('photo-block-section')).toBeNull();
  });

  it('does NOT render FaithSection', () => {
    renderCard();
    expect(screen.queryByTestId('faith-section')).toBeNull();
  });

  it('does NOT render PersonalitySection', () => {
    renderCard();
    expect(screen.queryByTestId('personality-section')).toBeNull();
  });

  it('does NOT render AddressSection', () => {
    renderCard();
    expect(screen.queryByTestId('address-section')).toBeNull();
  });

  it('does NOT render ParentsSection', () => {
    renderCard();
    expect(screen.queryByTestId('parents-section')).toBeNull();
  });

  it('does NOT render SiblingsSection', () => {
    renderCard();
    expect(screen.queryByTestId('siblings-section')).toBeNull();
  });

  it('does NOT render VerifiedProfileSection', () => {
    renderCard();
    expect(screen.queryByTestId('verified-profile-section')).toBeNull();
  });

  it('does NOT render ContactActionsSection', () => {
    renderCard();
    expect(screen.queryByTestId('contact-actions-section')).toBeNull();
  });

  it('does NOT render FuturePlansSection', () => {
    renderCard();
    expect(screen.queryByTestId('future-plans-section')).toBeNull();
  });
});
