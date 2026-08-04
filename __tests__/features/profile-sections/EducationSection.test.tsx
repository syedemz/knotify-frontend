/**
 * Tests for EducationSection (story 12.2).
 *
 * (a) Full-data render — all 4 rows visible.
 * (b) Section-level hide — all primary fields null.
 * (c) Chip-level hide — year suffix hides when year is null.
 */

import React from 'react';
import { screen } from '@testing-library/react-native';
import { EducationSection } from '@/features/profile-sections/sections/EducationSection';
import { renderSection, fullProfile, buildProfile } from './_harness';

describe('EducationSection', () => {
  describe('(a) full-data render', () => {
    it('renders education-section testID', () => {
      renderSection(<EducationSection profile={fullProfile} />);
      expect(screen.getByTestId('education-section')).toBeTruthy();
    });

    it('renders degree row', () => {
      renderSection(<EducationSection profile={fullProfile} />);
      expect(screen.getByTestId('education-degree-row')).toBeTruthy();
    });

    it('renders college row', () => {
      renderSection(<EducationSection profile={fullProfile} />);
      expect(screen.getByTestId('education-college-row')).toBeTruthy();
      expect(screen.getByText('Test University')).toBeTruthy();
    });

    it('renders higher secondary row', () => {
      renderSection(<EducationSection profile={fullProfile} />);
      expect(screen.getByTestId('education-higher-secondary-row')).toBeTruthy();
    });

    it('renders high school row', () => {
      renderSection(<EducationSection profile={fullProfile} />);
      expect(screen.getByTestId('education-high-school-row')).toBeTruthy();
    });

    it('includes graduation year in degree row value', () => {
      renderSection(<EducationSection profile={fullProfile} />);
      expect(screen.getByText(/2019/)).toBeTruthy();
    });
  });

  describe('(b) section-level hide', () => {
    it('returns null when all education fields are null', () => {
      const profile = buildProfile({
        education_level: null,
        highest_degree: null,
        college_name: null,
        higher_secondary: null,
        high_school: null,
      });
      renderSection(<EducationSection profile={profile} />);
      expect(screen.queryByTestId('education-section')).toBeNull();
    });
  });

  describe('(c) chip-level hide — year suffix', () => {
    it('omits graduation year when null', () => {
      const profile = buildProfile({
        highest_degree: 'BSc Computer Science',
        graduation_year: null,
      });
      renderSection(<EducationSection profile={profile} />);
      expect(screen.getByTestId('education-degree-row')).toBeTruthy();
      // Year should not appear as a suffix
      expect(screen.queryByText(/\(\d{4}\)/)).toBeNull();
    });

    it('omits high school year when null', () => {
      const profile = buildProfile({
        high_school: 'Test Secondary School',
        high_school_passing_year: null,
      });
      renderSection(<EducationSection profile={profile} />);
      expect(screen.getByTestId('education-high-school-row')).toBeTruthy();
      expect(screen.queryByText(/\(\d{4}\)/)).toBeNull();
    });
  });
});
