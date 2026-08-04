/**
 * Tests for VerifiedProfileSection (story 12.2).
 *
 * (a) Full-data render — faceSelfieUri is non-null.
 * (b) Section-level hide — faceSelfieUri is null.
 * (c) Chip-level hide — first_name fallback renders gracefully.
 */

import React from 'react';
import { screen } from '@testing-library/react-native';
import { VerifiedProfileSection } from '@/features/profile-sections/sections/VerifiedProfileSection';
import { renderSection, fullProfile, buildProfile } from './_harness';

describe('VerifiedProfileSection', () => {
  describe('(a) full-data render', () => {
    it('renders verified-profile-section testID', () => {
      renderSection(<VerifiedProfileSection profile={fullProfile} />);
      expect(screen.getByTestId('verified-profile-section')).toBeTruthy();
    });

    it('renders "Verified profile" heading', () => {
      renderSection(<VerifiedProfileSection profile={fullProfile} />);
      expect(screen.getByText('Verified profile')).toBeTruthy();
    });

    it('includes profile first_name in the body text', () => {
      renderSection(<VerifiedProfileSection profile={fullProfile} />);
      expect(screen.getByText(/Adnan/)).toBeTruthy();
    });
  });

  describe('(b) section-level hide', () => {
    it('returns null when faceSelfieUri is null', () => {
      const profile = buildProfile({ faceSelfieUri: null });
      renderSection(<VerifiedProfileSection profile={profile} />);
      expect(screen.queryByTestId('verified-profile-section')).toBeNull();
    });

    it('returns null when faceSelfieUri is undefined', () => {
      const profile = buildProfile({ faceSelfieUri: undefined });
      renderSection(<VerifiedProfileSection profile={profile} />);
      expect(screen.queryByTestId('verified-profile-section')).toBeNull();
    });
  });

  describe('(c) first_name fallback', () => {
    it('renders "This profile" when first_name is null', () => {
      const profile = buildProfile({
        faceSelfieUri: 'assets/test.png',
        first_name: null,
      });
      renderSection(<VerifiedProfileSection profile={profile} />);
      expect(screen.getByText(/This profile/)).toBeTruthy();
    });
  });
});
