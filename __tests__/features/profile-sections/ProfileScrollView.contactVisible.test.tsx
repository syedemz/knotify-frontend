/**
 * Regression tests for ProfileScrollView's `contactVisible` prop (story 13.4).
 *
 * AC coverage:
 * (a) Prop omitted (default) + viewer="other" → ContactActionsSection IS in tree.
 * (b) contactVisible={true} + viewer="other" → ContactActionsSection IS in tree.
 * (c) contactVisible={false} + viewer="other" → ContactActionsSection NOT in tree.
 * (d) Phase-12 caller regression: MyProfileScreen uses viewer="self" (no prop)
 *     → ContactActionsSection NOT in tree (viewer=self guard already returns null).
 *
 * Note: viewer="self" already hides ContactActionsSection via the existing guard
 * in ContactActionsSection itself. The contactVisible prop only affects
 * viewer="other" paths. These tests confirm the default=true backward-compat
 * for phase-12 "other" viewers (the MarriageLandingScreen path before deck
 * refactoring was viewer="other" with no contactVisible prop set).
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
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
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { ProfileScrollView } from '@/features/profile-sections/ProfileScrollView';
import type { DummyOverlay } from '@/types/DummyOverlay';
import type { UserProfile } from '@/types/api/UserProfile';

import dummyfemaleJson from '../../../assets/dummyfemale.json';

type TestProfile = UserProfile & DummyOverlay;
const dummyfemale = dummyfemaleJson as unknown as TestProfile;

function renderScrollView(
  profile: TestProfile,
  viewer: 'self' | 'other',
  contactVisible?: boolean,
) {
  return render(
    <ThemeProvider>
      <ProfileScrollView
        profile={profile}
        viewer={viewer}
        contactVisible={contactVisible}
      />
    </ThemeProvider>,
  );
}

// ── AC (a): default (no prop) + viewer=other → section present ────────────────

describe('ProfileScrollView contactVisible — AC (a): prop omitted defaults to visible', () => {
  it('given viewer=other and contactVisible omitted, then ContactActionsSection IS in tree', () => {
    renderScrollView(dummyfemale, 'other');
    expect(screen.getByTestId('contact-actions-section')).toBeTruthy();
  });
});

// ── AC (b): contactVisible={true} + viewer=other → section present ────────────

describe('ProfileScrollView contactVisible — AC (b): explicit true keeps section visible', () => {
  it('given viewer=other and contactVisible={true}, then ContactActionsSection IS in tree', () => {
    renderScrollView(dummyfemale, 'other', true);
    expect(screen.getByTestId('contact-actions-section')).toBeTruthy();
  });
});

// ── AC (c): contactVisible={false} + viewer=other → section absent ─────────────

describe('ProfileScrollView contactVisible — AC (c): explicit false hides section', () => {
  it('given viewer=other and contactVisible={false}, then ContactActionsSection is NOT in tree', () => {
    renderScrollView(dummyfemale, 'other', false);
    expect(screen.queryByTestId('contact-actions-section')).toBeNull();
  });

  it('given viewer=other and contactVisible={false}, then phone row is NOT in tree', () => {
    renderScrollView(dummyfemale, 'other', false);
    expect(screen.queryByTestId('contact-phone-row')).toBeNull();
  });
});

// ── AC (d): Phase-12 regression — viewer=self always hides section ─────────────

describe('ProfileScrollView contactVisible — AC (d): phase-12 regression viewer=self', () => {
  it('given viewer=self and contactVisible omitted, then ContactActionsSection is NOT in tree', () => {
    renderScrollView(dummyfemale, 'self');
    expect(screen.queryByTestId('contact-actions-section')).toBeNull();
  });

  it('given viewer=self and contactVisible={true}, then ContactActionsSection is NOT in tree (viewer guard wins)', () => {
    renderScrollView(dummyfemale, 'self', true);
    expect(screen.queryByTestId('contact-actions-section')).toBeNull();
  });
});
