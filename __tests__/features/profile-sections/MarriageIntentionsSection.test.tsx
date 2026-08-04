/**
 * Tests for MarriageIntentionsSection (story 12.2).
 *
 * (a) Full-data render.
 * (b) Section-level hide — hides when marriage_time is null.
 * (c) Chip-level hide — relation is optional (section still renders without it).
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

    it('renders Match! anchor', () => {
      renderSection(<MarriageIntentionsSection profile={fullProfile} />);
      expect(screen.getByText('Match!')).toBeTruthy();
    });

    it('renders marriage_time in the right anchor', () => {
      renderSection(<MarriageIntentionsSection profile={fullProfile} />);
      expect(screen.getByText(/Within 2 years/)).toBeTruthy();
    });

    it('renders relation alongside marriage_time when relation is set', () => {
      renderSection(<MarriageIntentionsSection profile={fullProfile} />);
      expect(screen.getByText(/Myself.*Within 2 years|Within 2 years.*Myself/)).toBeTruthy();
    });
  });

  describe('(b) section-level hide', () => {
    it('returns null when marriage_time is null', () => {
      const profile = buildProfile({ marriage_time: null });
      renderSection(<MarriageIntentionsSection profile={profile} />);
      expect(screen.queryByTestId('marriage-intentions-section')).toBeNull();
    });
  });

  describe('(c) chip-level hide — relation is optional', () => {
    it('renders section without relation label when relation is null', () => {
      const profile = buildProfile({ marriage_time: 'Within 1 year', relation: null });
      renderSection(<MarriageIntentionsSection profile={profile} />);
      expect(screen.getByTestId('marriage-intentions-section')).toBeTruthy();
      // Should still show just marriage_time without "null (...)"
      expect(screen.getByText('Within 1 year')).toBeTruthy();
    });
  });
});
