/**
 * Tests for AboutMeSection (story 12.2).
 *
 * (a) Full-data render.
 * (b) Section-level hide — hides when both fields are null.
 * (c) Chip-level hide — individual chips hide on null.
 */

import React from 'react';
import { screen } from '@testing-library/react-native';
import { AboutMeSection } from '@/features/profile-sections/sections/AboutMeSection';
import { renderSection, fullProfile, buildProfile } from './_harness';

describe('AboutMeSection', () => {
  describe('(a) full-data render', () => {
    it('renders about-me-section testID', () => {
      renderSection(<AboutMeSection profile={fullProfile} />);
      expect(screen.getByTestId('about-me-section')).toBeTruthy();
    });

    it('renders marital_status chip', () => {
      renderSection(<AboutMeSection profile={fullProfile} />);
      expect(screen.getByTestId('about-marital-chip')).toBeTruthy();
      expect(screen.getByText('Never Married')).toBeTruthy();
    });

    it('renders has_children chip', () => {
      renderSection(<AboutMeSection profile={fullProfile} />);
      expect(screen.getByTestId('about-children-chip')).toBeTruthy();
    });
  });

  describe('(b) section-level hide', () => {
    it('returns null when both marital_status and has_children are null', () => {
      const profile = buildProfile({ marital_status: null, has_children: null });
      renderSection(<AboutMeSection profile={profile} />);
      expect(screen.queryByTestId('about-me-section')).toBeNull();
    });
  });

  describe('(c) chip-level hide', () => {
    it('hides marital_status chip when null but renders section if has_children is set', () => {
      const profile = buildProfile({ marital_status: null, has_children: false });
      renderSection(<AboutMeSection profile={profile} />);
      expect(screen.queryByTestId('about-marital-chip')).toBeNull();
      expect(screen.getByTestId('about-children-chip')).toBeTruthy();
    });

    it('hides has_children chip when null but renders section if marital_status is set', () => {
      const profile = buildProfile({ marital_status: 'Divorced', has_children: null });
      renderSection(<AboutMeSection profile={profile} />);
      expect(screen.queryByTestId('about-children-chip')).toBeNull();
      expect(screen.getByTestId('about-marital-chip')).toBeTruthy();
    });
  });
});
