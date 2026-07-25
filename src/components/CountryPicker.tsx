/**
 * Generic reusable country picker component.
 *
 * Renders a search bar followed by a scrollable list of country rows. Each row
 * shows a flag image (via `react-native-country-flag`), the country name, and
 * its dial code. Search is a case-insensitive prefix match on `name` only —
 * dial codes are excluded from search to avoid confusion.
 *
 * - No default pre-selection: no country is highlighted until the caller's
 *   `onSelect` fires and they update their own `selectedIso` prop.
 * - Tapping a row fires `onSelect` with both the display name and ISO-2 code
 *   so the caller can write both fields atomically in a single draft update.
 * - Empty query shows the full alphabetical list.
 * - No debounce — plain `Array.filter` on every keystroke is fast enough for
 *   ~200 entries on mobile hardware.
 *
 * @module components/CountryPicker
 */

import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
} from 'react-native';
import CountryFlag from 'react-native-country-flag';

import { useTheme } from '@/theme';
import { textStyles } from '@/theme/typography';
import type { Theme } from '@/theme/theme';
import { SearchInput } from '@/components/SearchInput';
import type { CountryEntry } from '@/config/countries';

/**
 * Props for the `CountryPicker` component.
 */
export interface CountryPickerProps {
  /**
   * Full alphabetical list of country entries to display.
   * Typically sourced from `src/config/countries.ts`.
   */
  countries: readonly CountryEntry[];

  /**
   * Callback fired when the user taps a country row.
   *
   * Receives both the display name and ISO-2 code so the caller can write
   * BOTH draft fields in a single atomic update.
   *
   * @param name - The human-readable country display name.
   * @param iso2 - The ISO 3166-1 alpha-2 country code.
   */
  onSelect: (name: string, iso2: string) => void;

  /**
   * ISO-2 code of the currently selected country. When provided, the matching
   * row is visually highlighted. Pass `null` for no pre-selection.
   *
   * @default null
   */
  selectedIso?: string | null;

  /**
   * Placeholder text shown inside the search bar when empty.
   *
   * @default 'Search countries'
   */
  searchPlaceholder?: string;

  /**
   * Accessibility label for the search input.
   *
   * @default 'Search countries'
   */
  searchAccessibilityLabel?: string;

  /**
   * Flag render size in logical pixels.
   *
   * @default 24
   */
  flagSize?: number;
}

/**
 * Searchable country list with flag, name, and dial code per row.
 *
 * Designed for the onboarding wizard's country-selection screens (page 15 and
 * any future country pickers). Keeps the search state internally — the caller
 * only receives `onSelect` callbacks; no query state is exposed upward.
 *
 * @example
 * ```tsx
 * <CountryPicker
 *   countries={countries}
 *   onSelect={(name, iso2) => {
 *     update({ current_residence_country: name, resident_country_code: iso2 });
 *   }}
 *   selectedIso={null}
 *   searchPlaceholder={t('onboarding.country.searchPlaceholder')}
 * />
 * ```
 */
export function CountryPicker({
  countries,
  onSelect,
  selectedIso = null,
  searchPlaceholder = 'Search countries',
  searchAccessibilityLabel = 'Search countries',
  flagSize = 24,
}: CountryPickerProps): React.JSX.Element {
  const theme = useTheme();
  const [query, setQuery] = useState('');

  const styles = useMemo(() => createStyles(theme), [theme]);

  /** Case-insensitive prefix match on name only. Empty query returns full list. */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === '') return countries;
    return countries.filter((c) => c.name.toLowerCase().startsWith(q));
  }, [countries, query]);

  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder={searchPlaceholder}
          accessibilityLabel={searchAccessibilityLabel}
        />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled">
        {filtered.map((item) => (
          <CountryRow
            key={item.iso2}
            entry={item}
            selected={item.iso2 === selectedIso}
            onPress={() => onSelect(item.name, item.iso2)}
            flagSize={flagSize}
            theme={theme}
            pressedStyle={styles.rowPressed}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Internal sub-component: CountryRow
// ---------------------------------------------------------------------------

interface CountryRowProps {
  entry: CountryEntry;
  selected: boolean;
  onPress: () => void;
  flagSize: number;
  theme: Theme;
  pressedStyle: ReturnType<typeof createStyles>['rowPressed'];
}

/**
 * Single country row: flag + name + dial code.
 *
 * Not exported — consumed only by `CountryPicker`. Renders a pressable row
 * with a highlight border when `selected` is true, matching `ListRowSelectable`
 * visual language from the component catalog.
 */
function CountryRow({
  entry,
  selected,
  onPress,
  flagSize,
  theme,
  pressedStyle,
}: CountryRowProps): React.JSX.Element {
  const rowStyles = useMemo(
    () => createRowStyles(theme, selected),
    [theme, selected],
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [rowStyles.row, pressed && pressedStyle]}
      accessibilityRole="button"
      accessibilityLabel={`${entry.name} ${entry.dialCode}`}
      accessibilityState={{ selected }}
      testID={`country-row-${entry.iso2}`}
    >
      <CountryFlag isoCode={entry.iso2} size={flagSize} />
      <View style={rowStyles.nameContainer}>
        <RNText style={rowStyles.label} numberOfLines={1}>
          {entry.name}
        </RNText>
      </View>
      <RNText style={rowStyles.dialCode}>{entry.dialCode}</RNText>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles factories
// ---------------------------------------------------------------------------

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    searchWrapper: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    rowPressed: {
      backgroundColor: theme.colors.bg.muted,
    },
  });
}

function createRowStyles(theme: Theme, selected: boolean) {
  return StyleSheet.create({
    row: {
      backgroundColor: theme.colors.bg.surface,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: selected
        ? theme.colors.accent.primary
        : theme.colors.border.default,
      marginBottom: theme.spacing.sm,
      marginHorizontal: theme.spacing.lg,
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    nameContainer: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    label: {
      ...textStyles.heading.sm,
      color: selected
        ? theme.colors.accent.primary
        : theme.colors.text.primary,
    },
    dialCode: {
      ...textStyles.body.md,
      color: theme.colors.text.secondary,
      marginLeft: theme.spacing.sm,
    },
  });
}
