/**
 * AccountSection — account actions panel for the Edit tab.
 *
 * Mirrors the shape of `AppearanceSection` (heading + description + action
 * row) and sits directly below it on `MyProfileScreen`'s Edit tab. For now
 * the only action is a Log-out button that calls `useAuth().signOut()`
 * after a two-step `Alert.alert` confirmation.
 *
 * Logout path (mock-mode aware): `signOut` → `cognitoClient.signOut()` (in
 * mock mode this is a no-op token wipe via `secureStorage.clearAuthTokens`)
 * → `queryClient.clear()` → status flips to `'unauthenticated'`. The root
 * navigator observes `useAuth().status` and swaps to the auth stack.
 *
 * @module features/profile/components/AccountSection
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, Row, Text } from '@/components';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/theme';
import { useAuth } from '@/state/auth/AuthProvider';
import { t } from '@/labels';

/**
 * Account actions section with a destructive Log-out button.
 * No props — reads auth via `useAuth`.
 */
export function AccountSection(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { signOut } = useAuth();

  // Local pending flag disables the button while signOut is in flight so a
  // double-tap can't fire two concurrent logout flows.
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogoutPress = useCallback(() => {
    Alert.alert(
      t('menu.myProfile.editTab.account.logoutConfirmTitle'),
      t('menu.myProfile.editTab.account.logoutConfirmMessage'),
      [
        {
          text: t('menu.myProfile.editTab.account.logoutConfirmCancel'),
          style: 'cancel',
        },
        {
          text: t('menu.myProfile.editTab.account.logoutConfirmConfirm'),
          style: 'destructive',
          onPress: () => {
            setIsSigningOut(true);
            // signOut rejects only on unexpected failures; the finally
            // re-enables the button so a retry is possible. On success the
            // root navigator will unmount this screen before the finally
            // runs, so the setState is a no-op in that happy path.
            signOut()
              .catch((err: unknown) => {
                // eslint-disable-next-line no-console
                console.warn('[AccountSection] signOut failed', err);
              })
              .finally(() => {
                setIsSigningOut(false);
              });
          },
        },
      ],
    );
  }, [signOut]);

  return (
    <View style={styles.panel} testID="account-section">
      <Text variant="label.sm" color="secondary">
        {t('menu.myProfile.editTab.account.sectionHeading')}
      </Text>
      <View style={styles.gap} />
      <Text variant="body.sm" color="secondary">
        {t('menu.myProfile.editTab.account.sectionDescription')}
      </Text>
      <View style={styles.gap} />
      <Row gap="sm">
        <Button
          label={t('menu.myProfile.editTab.account.logoutButton')}
          variant="ghost"
          size="sm"
          fullWidth={false}
          onPress={handleLogoutPress}
          disabled={isSigningOut}
          testID="account-logout-btn"
        />
      </Row>
    </View>
  );
}

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
