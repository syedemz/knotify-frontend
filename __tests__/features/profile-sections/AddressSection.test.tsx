/**
 * Tests for AddressSection (story 12.2).
 *
 * (a) Full-data render — all 3 rows.
 * (b) Section-level hide — all null.
 * (c) Chip-level hide — individual rows hide on null.
 */

import React from 'react';
import { screen } from '@testing-library/react-native';
import { AddressSection } from '@/features/profile-sections/sections/AddressSection';
import { renderSection, fullProfile, buildProfile } from './_harness';

describe('AddressSection', () => {
  describe('(a) full-data render', () => {
    it('renders address-section testID', () => {
      renderSection(<AddressSection profile={fullProfile} />);
      expect(screen.getByTestId('address-section')).toBeTruthy();
    });

    it('renders city row', () => {
      renderSection(<AddressSection profile={fullProfile} />);
      expect(screen.getByTestId('address-city-row')).toBeTruthy();
      expect(screen.getByText('Mannheim')).toBeTruthy();
    });

    it('renders district row', () => {
      renderSection(<AddressSection profile={fullProfile} />);
      expect(screen.getByTestId('address-district-row')).toBeTruthy();
      expect(screen.getByText('Quadrate')).toBeTruthy();
    });

    it('renders family address row', () => {
      renderSection(<AddressSection profile={fullProfile} />);
      expect(screen.getByTestId('address-family-row')).toBeTruthy();
    });
  });

  describe('(b) section-level hide', () => {
    it('returns null when all address fields are null', () => {
      const profile = buildProfile({
        current_residence_city: null,
        district: null,
        family_residence_address: null,
      });
      renderSection(<AddressSection profile={profile} />);
      expect(screen.queryByTestId('address-section')).toBeNull();
    });
  });

  describe('(c) chip-level hide', () => {
    it('hides district row when null but renders section for other rows', () => {
      const profile = buildProfile({
        current_residence_city: 'Berlin',
        district: null,
        family_residence_address: null,
      });
      renderSection(<AddressSection profile={profile} />);
      expect(screen.queryByTestId('address-district-row')).toBeNull();
      expect(screen.getByTestId('address-city-row')).toBeTruthy();
    });
  });
});
