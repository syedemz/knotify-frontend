/**
 * MessageBubble — a single message rendered inside the ChatRoomScreen thread.
 *
 * Renders a WhatsApp-style speech bubble with:
 * - Sent messages (sender === 'me') aligned right, accent.primary background.
 * - Received messages (sender === 'friend') aligned left, bg.surface background.
 * - A tail-corner border-radius reduction on the edge nearest the screen edge
 *   (bottom-right for sent, bottom-left for received) to produce the WhatsApp
 *   "tail" effect.
 * - A timestamp at bottom-right inside the bubble.
 * - For sent messages: a status icon (Check / CheckCheck / tinted CheckCheck).
 * - An "· edited" suffix when `editedAt` is set.
 *
 * **Semantic testID.** The outermost `View` carries `testID='bubble-sent'` or
 * `testID='bubble-received'`. Tests query via these testIDs. Do NOT assert on
 * literal style values — RNTL flattens styles unpredictably.
 *
 * @module features/chat/components/MessageBubble
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Check, CheckCheck } from 'lucide-react-native';

import { Text } from '@/components';
import { useTheme } from '@/theme';
import { t } from '@/labels';
import type { Theme } from '@/theme/theme';
import type { ChatMessage } from '@/types/ChatMessage';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Props for {@link MessageBubble}.
 */
export interface MessageBubbleProps {
  /** The chat message to render. All fields are readonly. */
  readonly message: ChatMessage;
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Status icon size in pixels. */
const STATUS_ICON_SIZE = 14;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Formats a unix-millisecond timestamp as "HH:mm".
 *
 * @param ms - Unix milliseconds.
 * @returns A "HH:mm" string in local time.
 */
function formatTime(ms: number): string {
  const d = new Date(ms);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * A single speech bubble inside the chat message thread.
 *
 * The outermost `View` carries a semantic `testID` (`'bubble-sent'` or
 * `'bubble-received'`) so tests can query by sender branch without relying on
 * flattened style values.
 *
 * @param props - {@link MessageBubbleProps}
 */
export function MessageBubble({ message }: MessageBubbleProps): React.ReactElement {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const isSent = message.sender === 'me';
  const testID = isSent ? 'bubble-sent' : 'bubble-received';

  const bubbleStyle = isSent ? styles.bubbleSent : styles.bubbleReceived;
  const textColor: 'inverse' | 'primary' = isSent ? 'inverse' : 'primary';

  const timestampText = formatTime(message.timestamp);
  const editedSuffix = message.editedAt !== undefined ? ` ${t('chat.room.editedSuffix')}` : '';

  return (
    <View
      testID={testID}
      style={[styles.bubbleBase, bubbleStyle]}
    >
      {/* Message body text */}
      <Text variant="body.md" color={textColor}>
        {message.text}
      </Text>

      {/* Footer row: timestamp + edited suffix + status icon */}
      <View style={styles.footer}>
        <Text variant="label.sm" color={isSent ? 'inverse' : 'secondary'}>
          {timestampText}{editedSuffix}
        </Text>

        {/* Status icon — only for sent messages */}
        {isSent && (
          <StatusIcon status={message.status} theme={theme} />
        )}
      </View>
    </View>
  );
}

// ── StatusIcon ────────────────────────────────────────────────────────────────

interface StatusIconProps {
  readonly status: ChatMessage['status'];
  readonly theme: Theme;
}

/**
 * Renders the delivery status icon for a sent message.
 *
 * - `'sent'`      → single `Check`
 * - `'delivered'` → `CheckCheck` in inverse text color
 * - `'read'`      → `CheckCheck` tinted `status.info`
 *
 * The icon is wrapped in a `View` with a semantic `testID` because
 * `lucide-react-native` SVG icons do not forward `testID` to a native node.
 * Tests query for the wrapper `View` by testID.
 */
function StatusIcon({ status, theme }: StatusIconProps): React.ReactElement {
  const iconColor =
    status === 'read'
      ? theme.colors.status.info
      : theme.colors.text.inverse;

  if (status === 'sent') {
    return (
      <View testID="status-icon-sent">
        <Check
          size={STATUS_ICON_SIZE}
          color={iconColor}
          strokeWidth={2.5}
        />
      </View>
    );
  }

  return (
    <View testID={status === 'read' ? 'status-icon-read' : 'status-icon-delivered'}>
      <CheckCheck
        size={STATUS_ICON_SIZE}
        color={iconColor}
        strokeWidth={2.5}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    bubbleBase: {
      maxWidth: '75%',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      marginVertical: theme.spacing.xs,
      marginHorizontal: theme.spacing.md,
      borderRadius: theme.radii.lg,
    },
    bubbleSent: {
      alignSelf: 'flex-end',
      backgroundColor: theme.colors.accent.primary,
      // Reduce the bottom-right corner to create the WhatsApp "tail" effect
      // for messages sent by the current user (right side of screen).
      borderBottomRightRadius: theme.radii.sm,
    },
    bubbleReceived: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.bg.surface,
      // Reduce the bottom-left corner to create the WhatsApp "tail" effect
      // for messages received from the friend (left side of screen).
      borderBottomLeftRadius: theme.radii.sm,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xxs,
    },
  });
}
