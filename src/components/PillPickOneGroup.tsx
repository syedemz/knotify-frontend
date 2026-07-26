import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/theme';
import { Text } from './Text';
import { PillButton } from './PillButton';

/**
 * Props for the `PillPickOneGroup` component.
 */
export interface PillPickOneGroupProps {
  /**
   * Sub-heading text rendered above the pill grid.
   */
  label: string;

  /**
   * The list of option strings to display as pill buttons.
   */
  options: readonly string[];

  /**
   * The currently selected option value, or `null` when nothing is selected.
   *
   * @default null
   */
  selected: string | null;

  /**
   * Callback invoked with the selected option string when a pill is tapped.
   */
  onSelect: (option: string) => void;

  /**
   * Accessibility label prefix used to namespace each pill's accessible label.
   *
   * Each pill will be labelled `"<accessibilityPrefix> <option>"`.
   * Defaults to the `label` prop value.
   *
   * @default label prop value
   */
  accessibilityPrefix?: string;
}

/**
 * A subheader + horizontally-wrapping grid of single-select pill buttons.
 *
 * Renders a `Text` subheader followed by a wrapping `View` that lays out each
 * option as a `PillButton`. Exactly one option may be selected at a time
 * (`selected` is a controlled value). Tapping a pill fires `onSelect` with
 * that option string.
 *
 * Used on pages where pick-one choices appear as pill-shaped chips rather
 * than full-width list rows (e.g., Page 20 Marriage Timeline).
 *
 * @example
 * ```tsx
 * <PillPickOneGroup
 *   label="I'd like to be married within"
 *   options={options.marriageTime}
 *   selected={marriageTime}
 *   onSelect={handleMarriageTimeSelect}
 * />
 * ```
 */
export function PillPickOneGroup({
  label,
  options,
  selected,
  onSelect,
  accessibilityPrefix,
}: PillPickOneGroupProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const prefix = accessibilityPrefix ?? label;

  return (
    <View style={styles.container}>
      <Text variant="body.md" color="primary">
        {label}
      </Text>
      <View style={styles.pillGrid}>
        {options.map((option) => (
          <PillButton
            key={option}
            label={option}
            variant={selected === option ? 'selected' : 'default'}
            onPress={() => onSelect(option)}
            accessibilityLabel={`${prefix} ${option}`}
          />
        ))}
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      gap: theme.spacing.sm,
    },
    pillGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
  });
}
