/**
 * Tests for ProfessionalCareerSection (story 12.2).
 *
 * (a) Full-data render — all rows visible.
 * (b) Section-level hide — all fields null.
 * (c) Chip-level hide — individual rows hide on null.
 */

import React from 'react';
import { screen } from '@testing-library/react-native';
import { ProfessionalCareerSection } from '@/features/profile-sections/sections/ProfessionalCareerSection';
import { renderSection, fullProfile, buildProfile } from './_harness';

describe('ProfessionalCareerSection', () => {
  describe('(a) full-data render', () => {
    it('renders professional-career-section testID', () => {
      renderSection(<ProfessionalCareerSection profile={fullProfile} />);
      expect(screen.getByTestId('professional-career-section')).toBeTruthy();
    });

    it('renders category row', () => {
      renderSection(<ProfessionalCareerSection profile={fullProfile} />);
      expect(screen.getByTestId('career-category-chip')).toBeTruthy();
    });

    it('renders job_title row', () => {
      renderSection(<ProfessionalCareerSection profile={fullProfile} />);
      expect(screen.getByTestId('career-job-title-chip')).toBeTruthy();
      expect(screen.getByText('Software Engineer')).toBeTruthy();
    });

    it('renders employer row', () => {
      renderSection(<ProfessionalCareerSection profile={fullProfile} />);
      expect(screen.getByTestId('career-employer-chip')).toBeTruthy();
    });

    it('renders employment_type row', () => {
      renderSection(<ProfessionalCareerSection profile={fullProfile} />);
      expect(screen.getByTestId('career-employment-type-chip')).toBeTruthy();
    });

    it('renders office_address row', () => {
      renderSection(<ProfessionalCareerSection profile={fullProfile} />);
      expect(screen.getByTestId('career-office-address-chip')).toBeTruthy();
    });

    it('renders salary_range row', () => {
      renderSection(<ProfessionalCareerSection profile={fullProfile} />);
      expect(screen.getByTestId('career-salary-chip')).toBeTruthy();
    });
  });

  describe('(b) section-level hide', () => {
    it('returns null when all career fields are null', () => {
      const profile = buildProfile({
        professional_category: null,
        job_title: null,
        employer_name: null,
        employment_type: null,
        office_address: null,
        salary_range: null,
      });
      renderSection(<ProfessionalCareerSection profile={profile} />);
      expect(screen.queryByTestId('professional-career-section')).toBeNull();
    });
  });

  describe('(c) chip-level hide', () => {
    it('hides salary row when salary_range is null but renders section for other fields', () => {
      const profile = buildProfile({
        job_title: 'Developer',
        salary_range: null,
        employer_name: null,
        employment_type: null,
        office_address: null,
        professional_category: null,
      });
      renderSection(<ProfessionalCareerSection profile={profile} />);
      expect(screen.queryByTestId('career-salary-chip')).toBeNull();
      expect(screen.getByTestId('career-job-title-chip')).toBeTruthy();
    });
  });
});
