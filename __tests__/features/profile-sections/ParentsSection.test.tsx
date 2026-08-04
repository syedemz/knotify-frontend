/**
 * Tests for ParentsSection (story 12.2).
 *
 * (a) Full-data render — both parent blocks visible.
 * (b) Section-level hide — both names null → section null.
 * (c) Chip-level hide — job/retired chips hide on null inside a parent block.
 */

import React from 'react';
import { screen } from '@testing-library/react-native';
import { ParentsSection } from '@/features/profile-sections/sections/ParentsSection';
import { renderSection, fullProfile, buildProfile } from './_harness';

describe('ParentsSection', () => {
  describe('(a) full-data render', () => {
    it('renders parents-section testID', () => {
      renderSection(<ParentsSection profile={fullProfile} />);
      expect(screen.getByTestId('parents-section')).toBeTruthy();
    });

    it('renders father block', () => {
      renderSection(<ParentsSection profile={fullProfile} />);
      expect(screen.getByTestId('parents-father-block')).toBeTruthy();
      expect(screen.getByText('Khalid Malik')).toBeTruthy();
    });

    it('renders father job chip', () => {
      renderSection(<ParentsSection profile={fullProfile} />);
      expect(screen.getByTestId('parents-father-job-chip')).toBeTruthy();
    });

    it('renders father retired chip', () => {
      renderSection(<ParentsSection profile={fullProfile} />);
      expect(screen.getByTestId('parents-father-retired-chip')).toBeTruthy();
      expect(screen.getByText('Retired')).toBeTruthy();
    });

    it('renders mother block', () => {
      renderSection(<ParentsSection profile={fullProfile} />);
      expect(screen.getByTestId('parents-mother-block')).toBeTruthy();
      expect(screen.getByText('Samina Malik')).toBeTruthy();
    });
  });

  describe('(b) section-level hide', () => {
    it('returns null when both fathers_name and mothers_name are null', () => {
      const profile = buildProfile({ fathers_name: null, mothers_name: null });
      renderSection(<ParentsSection profile={profile} />);
      expect(screen.queryByTestId('parents-section')).toBeNull();
    });
  });

  describe('(c) chip-level hide inside parent block', () => {
    it('hides father job chip when fathers_job is null', () => {
      const profile = buildProfile({
        fathers_name: 'Ahmad',
        fathers_job: null,
        father_retired: 'YES',
      });
      renderSection(<ParentsSection profile={profile} />);
      expect(screen.queryByTestId('parents-father-job-chip')).toBeNull();
      expect(screen.getByTestId('parents-father-retired-chip')).toBeTruthy();
    });

    it('hides father retired chip when father_retired is null', () => {
      const profile = buildProfile({
        fathers_name: 'Ahmad',
        fathers_job: 'Engineer',
        father_retired: null,
      });
      renderSection(<ParentsSection profile={profile} />);
      expect(screen.queryByTestId('parents-father-retired-chip')).toBeNull();
      expect(screen.getByTestId('parents-father-job-chip')).toBeTruthy();
    });

    it('renders only mother block when only mothers_name is set', () => {
      const profile = buildProfile({
        fathers_name: null,
        mothers_name: 'Fatima',
      });
      renderSection(<ParentsSection profile={profile} />);
      expect(screen.queryByTestId('parents-father-block')).toBeNull();
      expect(screen.getByTestId('parents-mother-block')).toBeTruthy();
    });
  });
});
