/**
 * Unit tests for the `CountryPicker` catalog component (story 6.1).
 *
 * Covers:
 * 1. Basic render — mounts without throwing, full list visible.
 * 2. Search filtering — prefix match on name; dial code not matched.
 * 3. Row interaction — onSelect fires with correct name + iso2.
 * 4. Selection highlight — selectedIso prop highlights the matching row.
 * 5. Empty query — shows full list.
 * 6. No pre-selection — no row highlighted by default (selectedIso=null).
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

jest.mock('react-native-safe-area-context', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  const INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
  const ctx = Rct.createContext(INSETS);
  return {
    SafeAreaProvider: function (props: any) {
      return Rct.createElement(ctx.Provider, { value: INSETS }, Rct.createElement(RN.View, null, props.children));
    },
    SafeAreaConsumer: function (props: any) { return props.children(INSETS); },
    SafeAreaView: function (props: any) { return Rct.createElement(RN.View, null, props.children); },
    SafeAreaInsetsContext: ctx,
    useSafeAreaInsets: function () { return INSETS; },
    useSafeAreaFrame: function () { return { x: 0, y: 0, width: 375, height: 812 }; },
    initialWindowMetrics: { insets: INSETS, frame: { x: 0, y: 0, width: 375, height: 812 } },
  };
});

// Mock the flag library — renders a plain Image in tests.
jest.mock('react-native-country-flag', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  return {
    __esModule: true,
    default: function (props: any) {
      return Rct.createElement(RN.Image, {
        source: { uri: `https://flagcdn.com/w80/${props.isoCode.toLowerCase()}.png` },
        testID: `flag-${props.isoCode}`,
      });
    },
  };
});

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import { ThemeProvider } from '@/theme';
import { CountryPicker } from '@/components/CountryPicker';
import type { CountryEntry } from '@/config/countries';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SAMPLE_COUNTRIES: readonly CountryEntry[] = [
  { name: 'Afghanistan', dialCode: '+93', iso2: 'AF' },
  { name: 'Albania', dialCode: '+355', iso2: 'AL' },
  { name: 'Brazil', dialCode: '+55', iso2: 'BR' },
  { name: 'Canada', dialCode: '+1', iso2: 'CA' },
  { name: 'Denmark', dialCode: '+45', iso2: 'DK' },
  { name: 'Pakistan', dialCode: '+92', iso2: 'PK' },
  { name: 'United Kingdom', dialCode: '+44', iso2: 'GB' },
  { name: 'United States', dialCode: '+1', iso2: 'US' },
  { name: 'Zimbabwe', dialCode: '+263', iso2: 'ZW' },
];

const onSelect = jest.fn();

function renderPicker(
  props: Partial<{
    selectedIso: string | null;
    searchPlaceholder: string;
  }> = {},
) {
  return render(
    <ThemeProvider>
      <CountryPicker
        countries={SAMPLE_COUNTRIES}
        onSelect={onSelect}
        selectedIso={props.selectedIso ?? null}
        searchPlaceholder={props.searchPlaceholder ?? 'Search countries'}
        searchAccessibilityLabel="Search countries"
      />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  onSelect.mockClear();
});

// ── 1. Basic render ───────────────────────────────────────────────────────────

describe('CountryPicker — basic render', () => {
  it('given a country list, when rendered, then the component mounts without throwing', () => {
    expect(() => renderPicker()).not.toThrow();
  });

  it('given a country list, when rendered with empty query, then all countries are shown', () => {
    renderPicker();
    // Every country name in the sample set should be visible.
    for (const country of SAMPLE_COUNTRIES) {
      expect(screen.getByText(country.name)).toBeTruthy();
    }
  });

  it('given a country list, when rendered, then every row shows the dial code', () => {
    renderPicker();
    // Pakistan's dial code should appear
    expect(screen.getByText('+92')).toBeTruthy();
    // Brazil
    expect(screen.getByText('+55')).toBeTruthy();
  });

  it('given a country list, when rendered, then flag images are present for each row', () => {
    renderPicker();
    for (const country of SAMPLE_COUNTRIES) {
      expect(screen.getByTestId(`flag-${country.iso2}`)).toBeTruthy();
    }
  });
});

// ── 2. Search filtering ───────────────────────────────────────────────────────

describe('CountryPicker — search filtering', () => {
  it('given the user types "Pak", then only Pakistan is shown', () => {
    renderPicker();
    const searchInput = screen.getByLabelText('Search countries');
    fireEvent.changeText(searchInput, 'Pak');

    expect(screen.getByText('Pakistan')).toBeTruthy();
    expect(screen.queryByText('Afghanistan')).toBeNull();
    expect(screen.queryByText('Brazil')).toBeNull();
  });

  it('given the user types a lowercase prefix "uni", then United Kingdom and United States are shown', () => {
    renderPicker();
    const searchInput = screen.getByLabelText('Search countries');
    fireEvent.changeText(searchInput, 'uni');

    expect(screen.getByText('United Kingdom')).toBeTruthy();
    expect(screen.getByText('United States')).toBeTruthy();
    expect(screen.queryByText('Pakistan')).toBeNull();
    expect(screen.queryByText('Brazil')).toBeNull();
  });

  it('given the user types an uppercase prefix "BRAZ", then Brazil is shown (case-insensitive)', () => {
    renderPicker();
    fireEvent.changeText(screen.getByLabelText('Search countries'), 'BRAZ');

    expect(screen.getByText('Brazil')).toBeTruthy();
    expect(screen.queryByText('Denmark')).toBeNull();
  });

  it('given a dial code prefix "+93", then no countries are shown (dial code NOT matched)', () => {
    renderPicker();
    fireEvent.changeText(screen.getByLabelText('Search countries'), '+93');

    // Afghanistan has dial code +93, but dial codes are excluded from search.
    expect(screen.queryByText('Afghanistan')).toBeNull();
  });

  it('given a query that matches nothing, then no country rows are shown', () => {
    renderPicker();
    fireEvent.changeText(screen.getByLabelText('Search countries'), 'xyzzy');

    for (const country of SAMPLE_COUNTRIES) {
      expect(screen.queryByText(country.name)).toBeNull();
    }
  });

  it('given the user clears the query, then all countries are shown again', () => {
    renderPicker();
    const searchInput = screen.getByLabelText('Search countries');

    fireEvent.changeText(searchInput, 'Pak');
    expect(screen.queryByText('Brazil')).toBeNull();

    fireEvent.changeText(searchInput, '');
    expect(screen.getByText('Brazil')).toBeTruthy();
    expect(screen.getByText('Pakistan')).toBeTruthy();
  });
});

// ── 3. Row interaction ────────────────────────────────────────────────────────

describe('CountryPicker — row interaction', () => {
  it('given the user taps Pakistan, then onSelect is called with ("Pakistan", "PK")', () => {
    renderPicker();
    fireEvent.press(screen.getByTestId('country-row-PK'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('Pakistan', 'PK');
  });

  it('given the user taps United Kingdom, then onSelect is called with ("United Kingdom", "GB")', () => {
    renderPicker();
    fireEvent.press(screen.getByTestId('country-row-GB'));

    expect(onSelect).toHaveBeenCalledWith('United Kingdom', 'GB');
  });

  it('given the user searches for "Den" and taps Denmark, then onSelect fires with ("Denmark", "DK")', () => {
    renderPicker();
    fireEvent.changeText(screen.getByLabelText('Search countries'), 'Den');
    fireEvent.press(screen.getByTestId('country-row-DK'));

    expect(onSelect).toHaveBeenCalledWith('Denmark', 'DK');
  });
});

// ── 4. Selection highlight ────────────────────────────────────────────────────

describe('CountryPicker — selection highlight', () => {
  it('given selectedIso="PK", then the Pakistan row has accessibilityState.selected=true', () => {
    renderPicker({ selectedIso: 'PK' });
    const pkRow = screen.getByTestId('country-row-PK');
    expect(pkRow.props.accessibilityState?.selected).toBe(true);
  });

  it('given selectedIso="PK", then other rows do not have accessibilityState.selected=true', () => {
    renderPicker({ selectedIso: 'PK' });
    const brRow = screen.getByTestId('country-row-BR');
    expect(brRow.props.accessibilityState?.selected).not.toBe(true);
  });
});

// ── 5 & 6. No pre-selection ────────────────────────────────────────────────────

describe('CountryPicker — no pre-selection', () => {
  it('given selectedIso=null, then no row has accessibilityState.selected=true', () => {
    renderPicker({ selectedIso: null });
    for (const country of SAMPLE_COUNTRIES) {
      const row = screen.getByTestId(`country-row-${country.iso2}`);
      expect(row.props.accessibilityState?.selected).not.toBe(true);
    }
  });
});
