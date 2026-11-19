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
import { View, StyleSheet, Text as RNText } from 'react-native';

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
      <RNText
        accessibilityLabel={label}
        style={styles.label}
      >
        {label}
      </RNText>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      // Transparent — ChatRoomScreen wraps us in its ImageBackground pattern,
      // so the pattern shows through behind this row (WhatsApp-style).
      backgroundColor: 'transparent',
    },
    // Fixed light colour — the chat screen's dark pattern background is
    // independent of app theme, so the typing-row text must be readable on it.
    label: {
      color: '#E9EDEF',
      fontSize: 13,
      fontStyle: 'italic',
    },
  });
}
