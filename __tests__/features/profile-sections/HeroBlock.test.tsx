/**
 * Tests for HeroBlock (story 12.2).
 *
 * (a) Full-data render — self viewer, all fields populated.
 * (b) Section-level hide — other viewer returns null.
 * (c) Chip-level hide — individual chips hide when their field is null.
 */

import React from 'react';
import { screen } from '@testing-library/react-native';
import { HeroBlock } from '@/features/profile-sections/sections/HeroBlock';
import { renderSection, fullProfile, buildProfile } from './_harness';

describe('HeroBlock', () => {
  describe('(a) full-data render — viewer=self', () => {
    it('renders hero-block testID', () => {
      renderSection(<HeroBlock profile={fullProfile} viewer="self" />);
      expect(screen.getByTestId('hero-block')).toBeTruthy();
    });

    it('renders the profile name', () => {
      renderSection(<HeroBlock profile={fullProfile} viewer="self" />);
      expect(screen.getByText(/Adnan/)).toBeTruthy();
    });

    it('renders the age alongside the name', () => {
      renderSection(<HeroBlock profile={fullProfile} viewer="self" />);
      expect(screen.getByText(/29/)).toBeTruthy();
    });

    it('renders the city/country subtitle in uppercase', () => {
      renderSection(<HeroBlock profile={fullProfile} viewer="self" />);
      expect(screen.getByTestId('hero-city-country')).toBeTruthy();
      expect(screen.getByText(/MANNHEIM, GERMANY/)).toBeTruthy();
    });

    it('renders country-flag chip', () => {
      renderSection(<HeroBlock profile={fullProfile} viewer="self" />);
      expect(screen.getByTestId('hero-country-chip')).toBeTruthy();
    });

    it('renders job-title chip', () => {
      renderSection(<HeroBlock profile={fullProfile} viewer="self" />);
      expect(screen.getByTestId('hero-job-chip')).toBeTruthy();
      expect(screen.getByText('Software Engineer')).toBeTruthy();
    });

    it('renders religious-level chip', () => {
      renderSection(<HeroBlock profile={fullProfile} viewer="self" />);
      expect(screen.getByTestId('hero-religious-level-chip')).toBeTruthy();
    });

    it('renders verified tick when faceSelfieUri is non-null', () => {
      renderSection(<HeroBlock profile={fullProfile} viewer="self" />);
      expect(screen.getByTestId('hero-verified-tick')).toBeTruthy();
    });
  });

  describe('(b) section-level hide — viewer=other returns null', () => {
    it('returns null (no hero-block in tree) for viewer=other', () => {
      renderSection(<HeroBlock profile={fullProfile} viewer="other" />);
      expect(screen.queryByTestId('hero-block')).toBeNull();
    });
  });

  describe('(c) chip-level hide', () => {
    it('hides country-flag chip when resident_country_code is null', () => {
      const profile = buildProfile({ resident_country_code: null });
      renderSection(<HeroBlock profile={profile} viewer="self" />);
      expect(screen.queryByTestId('hero-country-chip')).toBeNull();
    });

    it('hides job-title chip when job_title is null', () => {
      const profile = buildProfile({ job_title: null });
      renderSection(<HeroBlock profile={profile} viewer="self" />);
      expect(screen.queryByTestId('hero-job-chip')).toBeNull();
    });

    it('hides religious-level chip when religious_level is null', () => {
      const profile = buildProfile({ religious_level: null });
      renderSection(<HeroBlock profile={profile} viewer="self" />);
      expect(screen.queryByTestId('hero-religious-level-chip')).toBeNull();
    });

    it('hides verified tick when faceSelfieUri is null', () => {
      const profile = buildProfile({ faceSelfieUri: null });
      renderSection(<HeroBlock profile={profile} viewer="self" />);
      expect(screen.queryByTestId('hero-verified-tick')).toBeNull();
    });
  });
});
