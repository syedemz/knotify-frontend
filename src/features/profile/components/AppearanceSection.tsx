/**
 * AppearanceSection — theme-mode selector for the Edit tab.
 *
 * Renders three segmented buttons — Light / Dark / System — and wires them
 * to `useThemeControls().setMode`. The currently-active mode (read from the
 * same hook) renders with the `primary` button variant; the others render
 * as `ghost`.
 *
 * `System` mode follows the OS color scheme via `useColorScheme()` inside
 * ThemeProvider.
 *
 * Mounted below `DevTriggersPanel` on `MyProfileScreen`'s Edit tab. Not a
 * production surface yet — phase 19 will build a proper SettingsScreen; this
 * widget is a dev-friendly shortcut in the meantime.
 *
 * @module features/profile/components/AppearanceSection
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Row, Text } from '@/components';
import { Button } from '@/components';
import { useTheme, useThemeControls } from '@/theme';
import type { Theme } from '@/theme/theme';
import type { ThemeMode } from '@/theme';
import { t } from '@/labels';

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Three-segment theme-mode selector. No props — reads and writes global
 * theme state via `useThemeControls`.
 */
export function AppearanceSection(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { mode, setMode } = useThemeControls();

  const buttonVariant = (target: ThemeMode): 'primary' | 'ghost' =>
    mode === target ? 'primary' : 'ghost';

  return (
    <View style={styles.panel} testID="appearance-section">
      <Text variant="label.sm" color="secondary">
        {t('menu.myProfile.editTab.appearance.sectionHeading')}
      </Text>
      <View style={styles.gap} />
      <Text variant="body.sm" color="secondary">
        {t('menu.myProfile.editTab.appearance.sectionDescription')}
      </Text>
      <View style={styles.gap} />
      <Row gap="sm">
        <Button
          label={t('menu.myProfile.editTab.appearance.light')}
          variant={buttonVariant('light')}
          size="sm"
          fullWidth={false}
          onPress={() => setMode('light')}
          testID="appearance-light-btn"
        />
        <Button
          label={t('menu.myProfile.editTab.appearance.dark')}
          variant={buttonVariant('dark')}
          size="sm"
          fullWidth={false}
          onPress={() => setMode('dark')}
          testID="appearance-dark-btn"
        />
        <Button
          label={t('menu.myProfile.editTab.appearance.system')}
          variant={buttonVariant('system')}
          size="sm"
          fullWidth={false}
          onPress={() => setMode('system')}
          testID="appearance-system-btn"
        />
      </Row>
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
