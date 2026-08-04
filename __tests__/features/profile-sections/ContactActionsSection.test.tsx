/**
 * Tests for ContactActionsSection (story 12.2).
 *
 * (a) Full-data render — viewer=other, phone_number set.
 * (b) Section-level hide — viewer=self returns null.
 * (c) Chip-level hide — phone row hides when phone_number is null.
 */

import React from 'react';
import { Share } from 'react-native';
import { screen, fireEvent } from '@testing-library/react-native';
import { ContactActionsSection } from '@/features/profile-sections/sections/ContactActionsSection';
import { renderSection, fullProfile, buildProfile } from './_harness';

describe('ContactActionsSection', () => {
  let shareSpy: jest.SpyInstance;

  beforeEach(() => {
    shareSpy = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.sharedAction });
  });

  afterEach(() => {
    shareSpy.mockRestore();
  });

  describe('(a) full-data render — viewer=other', () => {
    it('renders contact-actions-section testID', () => {
      renderSection(<ContactActionsSection profile={fullProfile} viewer="other" />);
      expect(screen.getByTestId('contact-actions-section')).toBeTruthy();
    });

    it('renders phone row when phone_number is set', () => {
      renderSection(<ContactActionsSection profile={fullProfile} viewer="other" />);
      expect(screen.getByTestId('contact-phone-row')).toBeTruthy();
    });

    it('renders the Share profile row-link button', () => {
      renderSection(<ContactActionsSection profile={fullProfile} viewer="other" />);
      expect(screen.getByTestId('share-profile-button-row-link')).toBeTruthy();
    });

    it('pressing Share calls Share.share', () => {
      renderSection(<ContactActionsSection profile={fullProfile} viewer="other" />);
      fireEvent.press(screen.getByTestId('share-profile-button-row-link'));
      expect(shareSpy).toHaveBeenCalledTimes(1);
    });

    it('renders disabled Favourite button', () => {
      renderSection(<ContactActionsSection profile={fullProfile} viewer="other" />);
      expect(screen.getByTestId('contact-favourite-btn')).toBeTruthy();
    });

    it('renders disabled Block button', () => {
      renderSection(<ContactActionsSection profile={fullProfile} viewer="other" />);
      expect(screen.getByTestId('contact-block-btn')).toBeTruthy();
    });

    it('renders disabled Report button', () => {
      renderSection(<ContactActionsSection profile={fullProfile} viewer="other" />);
      expect(screen.getByTestId('contact-report-btn')).toBeTruthy();
    });
  });

  describe('(b) section-level hide — viewer=self', () => {
    it('returns null for viewer=self', () => {
      renderSection(<ContactActionsSection profile={fullProfile} viewer="self" />);
      expect(screen.queryByTestId('contact-actions-section')).toBeNull();
    });
  });

  describe('(c) chip-level hide — phone row', () => {
    it('hides phone row when phone_number is null but still renders section', () => {
      const profile = buildProfile({ phone_number: null });
      renderSection(<ContactActionsSection profile={profile} viewer="other" />);
      expect(screen.queryByTestId('contact-phone-row')).toBeNull();
      // Section still renders (Share is always available)
      expect(screen.getByTestId('contact-actions-section')).toBeTruthy();
    });
  });
});
