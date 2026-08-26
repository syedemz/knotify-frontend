/**
 * CountryFlag — thin wrapper around `react-native-country-flag`.
 *
 * The Android default font does not render Unicode regional-indicator
 * emoji as flag glyphs, so building flags from `String.fromCodePoint`
 * produces the two-letter placeholder tofu on real devices. This
 * component uses `react-native-country-flag` to render an SVG flag
 * asset instead, giving parity between iOS, Android, and web.
 *
 * @module components/CountryFlag
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import RNCountryFlag from 'react-native-country-flag';

/**
 * Props for {@link CountryFlag}.
 */
export interface CountryFlagProps {
  /**
   * ISO 3166-1 alpha-2 country code (e.g. `'DE'`, `'PK'`, `'US'`). Case
   * insensitive — normalized to upper-case before rendering.
   */
  readonly isoCode: string;
  /**
   * Rendered height of the flag in pixels. Width is derived automatically
   * by the underlying library to preserve the flag's aspect ratio.
   *
   * @default 14
   */
  readonly size?: number;
  /**
   * Optional test identifier.
   */
  readonly testID?: string;
}

const DEFAULT_SIZE = 14;

/**
 * Renders a country flag glyph as an SVG. Returns `null` when `isoCode` is
 * empty so callers can safely feed nullable values.
 */
export function CountryFlag({
  isoCode,
  size = DEFAULT_SIZE,
  testID,
}: CountryFlagProps): React.ReactElement | null {
  if (isoCode === '') {
    return null;
  }
  return (
    <View style={styles.wrapper} testID={testID}>
      <RNCountryFlag isoCode={isoCode.toUpperCase()} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    // Country-flag library renders an SVG; wrapping in a View makes
    // vertical alignment inside chip/text rows deterministic.
    alignItems: 'center',
    justifyContent: 'center',
  },
});
