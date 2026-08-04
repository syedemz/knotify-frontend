/**
 * Tests for FaithSection (story 12.2).
 *
 * (a) Full-data render — all 8 chips present.
 * (b) Section-level hide — all 8 chips absent → section null.
 * (c) Chip-level hide — individual chips hide on null/absent.
 */

import React from 'react';
import { screen } from '@testing-library/react-native';
import { FaithSection } from '@/features/profile-sections/sections/FaithSection';
import { renderSection, fullProfile, buildProfile } from './_harness';

describe('FaithSection', () => {
  describe('(a) full-data render', () => {
    it('renders faith-section testID', () => {
      renderSection(<FaithSection profile={fullProfile} />);
      expect(screen.getByTestId('faith-section')).toBeTruthy();
    });

    it('renders religion chip', () => {
      renderSection(<FaithSection profile={fullProfile} />);
      expect(screen.getByTestId('faith-religion-chip')).toBeTruthy();
      expect(screen.getByText('Islam')).toBeTruthy();
    });

    it('renders subsect chip', () => {
      renderSection(<FaithSection profile={fullProfile} />);
      expect(screen.getByTestId('faith-subsect-chip')).toBeTruthy();
      expect(screen.getByText('Sunni')).toBeTruthy();
    });

    it('renders religious_level chip', () => {
      renderSection(<FaithSection profile={fullProfile} />);
      expect(screen.getByTestId('faith-religious-level-chip')).toBeTruthy();
    });

    it('renders dress_code chip', () => {
      renderSection(<FaithSection profile={fullProfile} />);
      expect(screen.getByTestId('faith-dress-code-chip')).toBeTruthy();
      expect(screen.getByText('Modest')).toBeTruthy();
    });

    it('renders eats_halal chip', () => {
      renderSection(<FaithSection profile={fullProfile} />);
      expect(screen.getByTestId('faith-halal-chip')).toBeTruthy();
    });

    it('renders smokes chip', () => {
      renderSection(<FaithSection profile={fullProfile} />);
      expect(screen.getByTestId('faith-smokes-chip')).toBeTruthy();
    });

    it('renders drinks chip', () => {
      renderSection(<FaithSection profile={fullProfile} />);
      expect(screen.getByTestId('faith-drinks-chip')).toBeTruthy();
    });

    it('renders fasts chip', () => {
      renderSection(<FaithSection profile={fullProfile} />);
      expect(screen.getByTestId('faith-fasts-chip')).toBeTruthy();
    });
  });

  describe('(b) section-level hide', () => {
    it('returns null when all 8 fields are null/absent', () => {
      const profile = buildProfile({
        religion: null,
        subsect: null,
        religious_level: null,
        // No __dummy_display_only set (undefined)
      });
      renderSection(<FaithSection profile={profile} />);
      expect(screen.queryByTestId('faith-section')).toBeNull();
    });
  });

  describe('(c) chip-level hide', () => {
    it('hides religion chip when null', () => {
      const profile = buildProfile({ religion: null, subsect: 'Sunni', religious_level: 'Practicing' });
      renderSection(<FaithSection profile={profile} />);
      expect(screen.queryByTestId('faith-religion-chip')).toBeNull();
      // section still renders because subsect is set
      expect(screen.getByTestId('faith-section')).toBeTruthy();
    });

    it('hides dummy chips when __dummy_display_only is absent', () => {
      const profile = buildProfile({
        religion: 'Islam',
        __dummy_display_only: undefined,
      });
      renderSection(<FaithSection profile={profile} />);
      expect(screen.queryByTestId('faith-dress-code-chip')).toBeNull();
      expect(screen.queryByTestId('faith-halal-chip')).toBeNull();
      expect(screen.queryByTestId('faith-smokes-chip')).toBeNull();
      expect(screen.queryByTestId('faith-drinks-chip')).toBeNull();
      expect(screen.queryByTestId('faith-fasts-chip')).toBeNull();
    });
  });
});
