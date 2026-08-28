/**
 * DevTriggersPanel — slot-based container for dev-only trigger buttons.
 *
 * TODO(mock-only): remove when subscription-driven modal triggers ship in phase 17.
 *
 * Renders a section heading + optional description above the provided
 * `children`. Trigger buttons are composed AS CHILDREN by the host
 * (`MyProfileScreen`) — this component does NOT define any triggers itself.
 *
 * Story 15.7 appends its trigger button as a second child sibling without
 * requiring any edits to this file.
 *
 * @module features/profile/components/DevTriggersPanel
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Column, Text } from '@/components';
import { useTheme } from '@/theme';
import { t } from '@/labels';
import type { Theme } from '@/theme/theme';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Props for `DevTriggersPanel`.
 *
 * All trigger buttons are composed as children; the panel only renders
 * the heading, description, and the child slot.
 */
export interface DevTriggersPanelProps {
  /**
   * Optional override for the section heading.
   *
   * @default t('menu.myProfile.editTab.devTriggers.sectionHeading')
   */
  readonly title?: string;

  /**
   * Optional description rendered below the heading.
   *
   * @default t('menu.myProfile.editTab.devTriggers.sectionDescription')
   */
  readonly description?: string;

  /**
   * Trigger button(s) to render below the description.
   *
   * Each button is composed by the host screen. This slot is open-ended —
   * story 15.7 will add a second child sibling without touching this component.
   */
  readonly children: React.ReactNode;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Slot-based dev-triggers panel.
 *
 * Renders heading + description above `{children}`. All trigger buttons
 * are owned by the host, not this component.
 *
 * @param props - {@link DevTriggersPanelProps}
 */
export function DevTriggersPanel({
  title,
  description,
  children,
}: DevTriggersPanelProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const heading = title ?? t('menu.myProfile.editTab.devTriggers.sectionHeading');
  const desc = description ?? t('menu.myProfile.editTab.devTriggers.sectionDescription');

  return (
    <View style={styles.panel} testID="dev-triggers-panel">
      <Text
        variant="label.sm"
        color="secondary"
      >
        {heading}
      </Text>
      <View style={styles.gap} />
      <Text
        variant="body.sm"
        color="secondary"
      >
        {desc}
      </Text>
      <View style={styles.gap} />
      <Column gap="sm">
        {children}
      </Column>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    panel: {
      padding: theme.spacing.lg,
    },
    gap: {
      height: theme.spacing.md,
    },
  });
}
