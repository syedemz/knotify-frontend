/**
 * TypingIndicatorRow — lightweight "{friend} is typing…" row rendered above
 * the composer in ChatRoomScreen when the counterpart is actively typing.
 *
 * Rendered as a sibling of the message FlatList, NOT as a special message
 * inside the list (story 16.CH2 AC 4).
 *
 * @module features/chat/components/TypingIndicatorRow
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { Text } from '@/components';
import { useTheme } from '@/theme';
import { t } from '@/labels';
import type { Theme } from '@/theme/theme';

// ── Props ─────────────────────────────────────────────────────────────────────

/**
 * Props for {@link TypingIndicatorRow}.
 */
export interface TypingIndicatorRowProps {
  /**
   * Display name of the friend who is typing.
   *
   * Injected into the "{friend} is typing…" label string via
   * `.replace('{friend}', friendName)` following the project's label
   * interpolation pattern (no full i18n library).
   */
  readonly friendName: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Renders a slim "{friend} is typing…" indicator row.
 *
 * Visible only when the counterpart is actively typing. The calling component
 * (`ChatRoomScreen`) is responsible for conditional rendering — this component
 * always renders when mounted; the caller decides whether to mount it.
 *
 * @example
 * ```tsx
 * {isCounterpartTyping && (
 *   <TypingIndicatorRow friendName="Mehvish" />
 * )}
 * ```
 */
export function TypingIndicatorRow({ friendName }: TypingIndicatorRowProps): React.ReactElement {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const label = t('chat.room.typing').replace('{friend}', friendName);

  return (
    <View style={styles.row} testID="typing-indicator-row">
      <Text
        variant="body.sm"
        color="tertiary"
        accessibilityLabel={label}
      >
        {label}
      </Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      backgroundColor: theme.colors.bg.primary,
    },
  });
}
