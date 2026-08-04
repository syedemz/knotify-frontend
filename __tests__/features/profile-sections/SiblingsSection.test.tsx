/**
 * Tests for SiblingsSection (story 12.2).
 *
 * (a) Full-data render — siblings array populated.
 * (b) Section-level hide — empty or undefined siblings array.
 * (c) Chip-level hide — individual fields inside a sibling card hide on null.
 */

import React from 'react';
import { screen } from '@testing-library/react-native';
import { SiblingsSection } from '@/features/profile-sections/sections/SiblingsSection';
import { renderSection, buildProfile } from './_harness';

describe('SiblingsSection', () => {
  describe('(a) full-data render', () => {
    it('renders siblings-section testID', () => {
      const profile = buildProfile({
        siblings: [
          {
            name: 'Zara Malik',
            age: 24,
            marital_status: 'Never Married',
            gender: 'Female',
            profession: 'Medical Student',
          },
        ],
      });
      renderSection(<SiblingsSection profile={profile} />);
      expect(screen.getByTestId('siblings-section')).toBeTruthy();
    });

    it('renders a card for each sibling', () => {
      const profile = buildProfile({
        siblings: [
          {
            name: 'Zara',
            age: 24,
            marital_status: 'Never Married',
            gender: 'Female',
            profession: 'Doctor',
          },
          {
            name: 'Omar',
            age: 30,
            marital_status: 'Married',
            gender: 'Male',
            profession: 'Engineer',
          },
        ],
      });
      renderSection(<SiblingsSection profile={profile} />);
      expect(screen.getByTestId('sibling-card-0')).toBeTruthy();
      expect(screen.getByTestId('sibling-card-1')).toBeTruthy();
    });

    it('renders sibling name inside each card', () => {
      const profile = buildProfile({
        siblings: [{ name: 'Zara', age: null, marital_status: null, gender: null, profession: null }],
      });
      renderSection(<SiblingsSection profile={profile} />);
      expect(screen.getByText('Zara')).toBeTruthy();
    });
  });

  describe('(b) section-level hide', () => {
    it('returns null when siblings is empty array', () => {
      const profile = buildProfile({ siblings: [] });
      renderSection(<SiblingsSection profile={profile} />);
      expect(screen.queryByTestId('siblings-section')).toBeNull();
    });

    it('returns null when siblings is undefined', () => {
      const profile = buildProfile({ siblings: undefined });
      renderSection(<SiblingsSection profile={profile} />);
      expect(screen.queryByTestId('siblings-section')).toBeNull();
    });
  });

  describe('(c) chip-level hide within sibling card', () => {
    it('hides name when null', () => {
      const profile = buildProfile({
        siblings: [{ name: null, age: 24, marital_status: null, gender: null, profession: null }],
      });
      renderSection(<SiblingsSection profile={profile} />);
      expect(screen.queryByTestId('sibling-name-0')).toBeNull();
    });

    it('hides gender chip when null', () => {
      const profile = buildProfile({
        siblings: [{ name: 'Zara', age: 24, marital_status: null, gender: null, profession: null }],
      });
      renderSection(<SiblingsSection profile={profile} />);
      expect(screen.queryByTestId('sibling-gender-chip-0')).toBeNull();
    });

    it('hides profession chip when null', () => {
      const profile = buildProfile({
        siblings: [{ name: 'Zara', age: 24, marital_status: 'Single', gender: 'Female', profession: null }],
      });
      renderSection(<SiblingsSection profile={profile} />);
      expect(screen.queryByTestId('sibling-profession-chip-0')).toBeNull();
      // Other chips still render
      expect(screen.getByTestId('sibling-gender-chip-0')).toBeTruthy();
    });
  });
});
