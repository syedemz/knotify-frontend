/**
 * Tests for PhotoBlockSection (story 12.2).
 *
 * (a) Full-data render — photos.length >= 2.
 * (b) Section-level hide — photos.length < 2 or undefined.
 * (c) Chip-level hide — N/A for this section (it either shows or hides wholesale).
 *     We test the boundary: exactly 1 photo hides, exactly 2 photos shows.
 */

import React from 'react';
import { screen } from '@testing-library/react-native';
import { PhotoBlockSection } from '@/features/profile-sections/sections/PhotoBlockSection';
import { renderSection, fullProfile, buildProfile } from './_harness';

describe('PhotoBlockSection', () => {
  describe('(a) full-data render', () => {
    it('renders photo-block-section testID when photos.length >= 2', () => {
      renderSection(<PhotoBlockSection profile={fullProfile} />);
      expect(screen.getByTestId('photo-block-section')).toBeTruthy();
    });
  });

  describe('(b) section-level hide', () => {
    it('returns null when photos is undefined', () => {
      const profile = buildProfile({ photos: undefined });
      renderSection(<PhotoBlockSection profile={profile} />);
      expect(screen.queryByTestId('photo-block-section')).toBeNull();
    });

    it('returns null when photos has only 1 entry', () => {
      const profile = buildProfile({ photos: ['assets/male/Male1.png'] });
      renderSection(<PhotoBlockSection profile={profile} />);
      expect(screen.queryByTestId('photo-block-section')).toBeNull();
    });

    it('returns null when photos is empty', () => {
      const profile = buildProfile({ photos: [] });
      renderSection(<PhotoBlockSection profile={profile} />);
      expect(screen.queryByTestId('photo-block-section')).toBeNull();
    });
  });

  describe('(c) boundary — exactly 2 photos shows', () => {
    it('renders when exactly 2 photos are present', () => {
      const profile = buildProfile({
        photos: ['assets/male/Male1.png', 'assets/male/Male2.png'],
      });
      renderSection(<PhotoBlockSection profile={profile} />);
      expect(screen.getByTestId('photo-block-section')).toBeTruthy();
    });
  });
});
