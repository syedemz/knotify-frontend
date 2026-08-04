/**
 * Tests for FuturePlansSection (story 12.2).
 *
 * (a) Full-data render.
 * (b) Section-level hide — both null → section null.
 * (c) Chip-level hide — individual chips hide on null.
 */

import React from 'react';
import { screen } from '@testing-library/react-native';
import { FuturePlansSection } from '@/features/profile-sections/sections/FuturePlansSection';
import { renderSection, fullProfile, buildProfile } from './_harness';

describe('FuturePlansSection', () => {
  describe('(a) full-data render', () => {
    it('renders future-plans-section testID', () => {
      renderSection(<FuturePlansSection profile={fullProfile} />);
      expect(screen.getByTestId('future-plans-section')).toBeTruthy();
    });

    it('renders move_abroad chip as "Open to relocate globally" when true', () => {
      const profile = buildProfile({ move_abroad: true, has_children: false });
      renderSection(<FuturePlansSection profile={profile} />);
      expect(screen.getByText('Open to relocate globally')).toBeTruthy();
    });

    it('renders move_abroad chip as "Won\'t move abroad" when false', () => {
      const profile = buildProfile({ move_abroad: false });
      renderSection(<FuturePlansSection profile={profile} />);
      expect(screen.getByText("Won't move abroad")).toBeTruthy();
    });

    it('renders has_children chip as "Open to having children" when false', () => {
      const profile = buildProfile({ has_children: false, move_abroad: true });
      renderSection(<FuturePlansSection profile={profile} />);
      expect(screen.getByText('Open to having children')).toBeTruthy();
    });
  });

  describe('(b) section-level hide', () => {
    it('returns null when both move_abroad and has_children are null', () => {
      const profile = buildProfile({ move_abroad: null, has_children: null });
      renderSection(<FuturePlansSection profile={profile} />);
      expect(screen.queryByTestId('future-plans-section')).toBeNull();
    });
  });

  describe('(c) chip-level hide', () => {
    it('hides move_abroad chip when null but renders section if has_children is set', () => {
      const profile = buildProfile({ move_abroad: null, has_children: false });
      renderSection(<FuturePlansSection profile={profile} />);
      expect(screen.queryByTestId('future-move-abroad-chip')).toBeNull();
      expect(screen.getByTestId('future-children-chip')).toBeTruthy();
    });

    it('hides has_children chip when null but renders section if move_abroad is set', () => {
      const profile = buildProfile({ move_abroad: true, has_children: null });
      renderSection(<FuturePlansSection profile={profile} />);
      expect(screen.queryByTestId('future-children-chip')).toBeNull();
      expect(screen.getByTestId('future-move-abroad-chip')).toBeTruthy();
    });
  });
});
