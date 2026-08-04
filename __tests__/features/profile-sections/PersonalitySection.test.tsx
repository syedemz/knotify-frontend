/**
 * Tests for PersonalitySection (story 12.2).
 *
 * (a) Full-data render.
 * (b) Section-level hide — missing or empty personalityTraits.
 * (c) Chip-level hide — one chip per trait; partial trait array renders partial chips.
 */

import React from 'react';
import { screen } from '@testing-library/react-native';
import { PersonalitySection } from '@/features/profile-sections/sections/PersonalitySection';
import { renderSection, fullProfile, buildProfile } from './_harness';

describe('PersonalitySection', () => {
  describe('(a) full-data render', () => {
    it('renders personality-section testID', () => {
      renderSection(<PersonalitySection profile={fullProfile} />);
      expect(screen.getByTestId('personality-section')).toBeTruthy();
    });

    it('renders a chip for each trait in fullProfile', () => {
      renderSection(<PersonalitySection profile={fullProfile} />);
      // fullProfile has ['Adventurous', 'Family-oriented']
      expect(screen.getByText('Adventurous')).toBeTruthy();
      expect(screen.getByText('Family-oriented')).toBeTruthy();
    });
  });

  describe('(b) section-level hide', () => {
    it('returns null when preferences is null', () => {
      const profile = buildProfile({ preferences: null });
      renderSection(<PersonalitySection profile={profile} />);
      expect(screen.queryByTestId('personality-section')).toBeNull();
    });

    it('returns null when personalityTraits is empty array', () => {
      const profile = buildProfile({ preferences: { personalityTraits: [] } });
      renderSection(<PersonalitySection profile={profile} />);
      expect(screen.queryByTestId('personality-section')).toBeNull();
    });

    it('returns null when personalityTraits is undefined inside preferences', () => {
      const profile = buildProfile({ preferences: {} });
      renderSection(<PersonalitySection profile={profile} />);
      expect(screen.queryByTestId('personality-section')).toBeNull();
    });
  });

  describe('(c) chip-level hide — single trait', () => {
    it('renders only the chip for the one trait present', () => {
      const profile = buildProfile({
        preferences: { personalityTraits: ['Night owl'] },
      });
      renderSection(<PersonalitySection profile={profile} />);
      expect(screen.getByText('Night owl')).toBeTruthy();
    });
  });
});
