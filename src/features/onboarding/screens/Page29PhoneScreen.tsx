/**
 * Page 29 — Phone number entry.
 *
 * This file is a stub created in story 10.1 so that the `Page29PhoneScreen`
 * route is resolvable by the TypeScript compiler and React Navigation, and so
 * that `Page28PhotosScreen` can navigate to it without a type error.
 *
 * The real implementation lands in story 10.2.
 *
 * @module features/onboarding/screens/Page29PhoneScreen
 */

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EmptyState } from '@/components';
import { t } from '@/labels';
import type { OnboardingStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page29PhoneScreen'>;

/**
 * Placeholder for the phone-number onboarding screen (page 29).
 *
 * Story 10.2 replaces this stub with the real implementation.
 */
export function Page29PhoneScreen(_props: Props): React.JSX.Element {
  return (
    <EmptyState
      title="Page29PhoneScreen"
      description={t('common.notImplemented')}
    />
  );
}
