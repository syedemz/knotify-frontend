/**
 * Tests for MarriageIntentionsSection (story 12.2).
 *
 * (a) Full-data render — Muzz-style timeline: match anchor + stage chips +
 *     four anchor labels (Match! / Let's chat / Agree together / marriage_time).
 * (b) Section-level hide — hides when marriage_time is null.
 * (c) Renders marriage_time in the final anchor label.
 */

import React from 'react';
import { screen } from '@testing-library/react-native';
import { MarriageIntentionsSection } from '@/features/profile-sections/sections/MarriageIntentionsSection';
import { renderSection, fullProfile, buildProfile } from './_harness';

describe('MarriageIntentionsSection', () => {
  describe('(a) full-data render', () => {
    it('renders marriage-intentions-section testID', () => {
      renderSection(<MarriageIntentionsSection profile={fullProfile} />);
      expect(screen.getByTestId('marriage-intentions-section')).toBeTruthy();
    });

    it('renders the Match! anchor label', () => {
      renderSection(<MarriageIntentionsSection profile={fullProfile} />);
      expect(screen.getByText('Match!')).toBeTruthy();
    });

    it('renders the match heart anchor', () => {
      renderSection(<MarriageIntentionsSection profile={fullProfile} />);
      expect(screen.getByTestId('intent-match-anchor')).toBeTruthy();
    });

    it('renders the stage chips (Chatting, Family, Marriage)', () => {
      renderSection(<MarriageIntentionsSection profile={fullProfile} />);
      expect(screen.getByText('Chatting')).toBeTruthy();
      expect(screen.getByText('Family')).toBeTruthy();
      expect(screen.getByText('Marriage')).toBeTruthy();
    });

    it("renders the Let's chat and Agree together anchor labels", () => {
      renderSection(<MarriageIntentionsSection profile={fullProfile} />);
      expect(screen.getByText("Let's chat")).toBeTruthy();
      expect(screen.getAllByText('Agree together').length).toBeGreaterThanOrEqual(1);
    });

    it('renders marriage_time in the final anchor label', () => {
      renderSection(<MarriageIntentionsSection profile={fullProfile} />);
      expect(screen.getByTestId('intent-marriage-label')).toBeTruthy();
      expect(screen.getByText(/Within 2 years/)).toBeTruthy();
    });
  });

  describe('(b) section-level hide', () => {
    it('returns null when marriage_time is null', () => {
      const profile = buildProfile({ marriage_time: null });
      renderSection(<MarriageIntentionsSection profile={profile} />);
      expect(screen.queryByTestId('marriage-intentions-section')).toBeNull();
    });
  });

  describe('(c) marriage_time drives the final anchor label', () => {
    it('renders the passed-in marriage_time verbatim', () => {
      const profile = buildProfile({ marriage_time: 'Within 1 year' });
      renderSection(<MarriageIntentionsSection profile={profile} />);
      expect(screen.getByTestId('marriage-intentions-section')).toBeTruthy();
      expect(screen.getByText('Within 1 year')).toBeTruthy();
    });
  });
});
