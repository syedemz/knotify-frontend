/**
 * ChatRoomScreen — WhatsApp-style per-friend message thread.
 *
 * Reads `friendUserId` from the route param, resolves the friend's profile via
 * `useFriendship().getFullProfile(friendUserId)`, and renders:
 *
 * - A header with a back button, avatar, name, and triple-dot no-op menu button.
 * - A scrollable message thread on a tiled dark background image, with messages
 *   rendered as `MessageBubble` components in an inverted `FlatList`.
 * - A composer row with a pill-shaped `TextInput` and a circular trailing
 *   button that toggles between a Mic icon (empty input) and a Send icon
 *   (non-empty input).
 *
 * **Missing profile guard.** When `getFullProfile(friendUserId)` returns
 * `undefined` or `null` (the friend is not in the friendship registry), an
 * `EmptyState` is rendered with no header or composer.
 *
 * **KeyboardAvoidingView.** Wraps the entire screen so the composer lifts above
 * the software keyboard on both iOS (padding) and Android (height).
 *
 * **BGDark asset.** The tiled background is the project-local copy of the dark
 * chat texture. It is imported via a project-relative `require` — the external
 * source path (`animations/images/BGDark.jpg`) is intentionally not referenced.
 *
 * **Rules of Hooks.** ALL hooks are declared before any conditional return.
 * Derived values that depend on the resolved `profile` are computed after all
 * hooks are done. The conditional return follows.
 *
 * @module features/chat/screens/ChatRoomScreen
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, MoreVertical, Mic, Send } from 'lucide-react-native';

import { EmptyState, Heading, TouchableArea } from '@/components';
import { t } from '@/labels';
import { useFriendship } from '@/state/friendship/FriendshipProvider';
import { useChatHistory } from '@/state/chat/ChatProvider';
import { ProfileThumbnailCircle } from '@/features/profile/components/ProfileThumbnailCircle';
import { MessageBubble } from '@/features/chat/components/MessageBubble';
import { useTheme } from '@/theme';
import { textStyles } from '@/theme/typography';
import type { Theme } from '@/theme/theme';
import type { ChatStackParamList } from '@/navigation/types';
import type { ChatMessage } from '@/types/ChatMessage';

// ── Bundled background image ──────────────────────────────────────────────────
//
// This is the project-local copy of the dark chat background texture.
// Imported via a project-relative `require`. Do NOT reference the external
// source path (`animations/images/BGDark.jpg`) — the file is self-contained
// inside the project at `assets/chat/bgDark.jpg`.
// Metro requires a static require() path to bundle image assets at build time.
const BG_DARK = require('../../../../assets/chat/bgDark.jpg');

// ── Navigation typing ─────────────────────────────────────────────────────────

type ChatRoomRoute = RouteProp<ChatStackParamList, 'ChatRoomScreen'>;
type ChatRoomNav = NativeStackNavigationProp<ChatStackParamList, 'ChatRoomScreen'>;

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Per-friend message thread screen.
 *
 * Reads `friendUserId` from the route param, resolves the friend profile, and
 * renders the full WhatsApp-style thread with composer. If the profile cannot
 * be resolved, an `EmptyState` is shown instead.
 *
 * ALL React hooks are declared before any conditional return so the hook call
 * order is unconditional on every render (Rules of Hooks).
 */
export function ChatRoomScreen(): React.ReactElement {
  // ── Hooks — MUST be declared before any conditional return ─────────────────

  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ChatRoomNav>();
  const route = useRoute<ChatRoomRoute>();

  const { friendUserId } = route.params;
  const { getFullProfile } = useFriendship();
  const { messages, sendMessage } = useChatHistory(friendUserId);

  const [composerText, setComposerText] = useState('');

  // Ref for the message-thread FlatList so we can scroll to the latest
  // message on mount and whenever a new message is appended. The list is
  // rendered in natural chronological order (oldest at top, newest at
  // bottom) — no `inverted` prop — so we must actively pin the viewport
  // to the end to match the WhatsApp UX ("open at latest, scroll up for
  // history").
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleMenuPress = useCallback(() => {
    // No-op: chat room menu is not implemented yet.
    console.log('chat room menu — not implemented yet');
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = composerText.trim();
    if (trimmed.length === 0) return;
    await sendMessage(trimmed);
    setComposerText('');
  }, [composerText, sendMessage]);

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  const renderBubble = useCallback(
    ({ item }: { item: ChatMessage }) => <MessageBubble message={item} />,
    [],
  );

  // `onContentSizeChange` fires on initial layout AND whenever items are
  // added — perfect trigger for auto-scroll-to-end. Not animated on first
  // mount (jumps straight to the latest so the user never sees old messages
  // flash by); subsequent appends animate for a natural feel.
  const hasScrolledOnceRef = useRef(false);
  const handleContentSizeChange = useCallback(() => {
    const animated = hasScrolledOnceRef.current;
    hasScrolledOnceRef.current = true;
    flatListRef.current?.scrollToEnd({ animated });
  }, []);

  // ── Profile resolution — after all hooks ───────────────────────────────────

  const profile = getFullProfile(friendUserId) ?? null;

  // ── Missing profile guard ──────────────────────────────────────────────────
  //
  // Conditional return is AFTER all hooks — Rules of Hooks compliant.

  if (profile === null) {
    return (
      <View style={styles.root} testID="chat-room-missing">
        <EmptyState
          title={t('chat.room.missingTitle')}
          description={t('chat.room.missingDescription')}
          accessibilityLabel={t('chat.room.missingTitle')}
        />
      </View>
    );
  }

  // ── Derived values from resolved profile ───────────────────────────────────

  const photoPath = profile.photos?.[0] ?? profile.photo_url ?? '';
  const fullName = `${profile.first_name} ${profile.last_name}`;
  const hasText = composerText.trim().length > 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + theme.spacing.sm }]}>
        {/* Back button */}
        <TouchableArea
          onPress={handleBack}
          accessibilityLabel={t('chat.room.backAccessibility')}
          testID="chat-room-back-btn"
        >
          <View style={styles.iconBtn}>
            <ArrowLeft
              size={24}
              color={theme.colors.text.primary}
              strokeWidth={2}
            />
          </View>
        </TouchableArea>

        {/* Avatar */}
        <ProfileThumbnailCircle
          uri={photoPath}
          size={32}
          accessibilityLabel={fullName}
        />

        {/* Name column — grows to fill space */}
        <View style={styles.headerNameColumn}>
          <Heading variant="heading.sm" numberOfLines={1}>
            {fullName}
          </Heading>
        </View>

        {/* Triple-dot menu — no-op */}
        <TouchableArea
          onPress={handleMenuPress}
          accessibilityLabel={t('chat.room.menuAccessibility')}
          testID="chat-room-menu-btn"
        >
          <View style={styles.iconBtn}>
            <MoreVertical
              size={24}
              color={theme.colors.text.primary}
              strokeWidth={2}
            />
          </View>
        </TouchableArea>
      </View>

      {/* ── Message thread ──────────────────────────────────────────── */}
      <View style={styles.threadContainer}>
        <ImageBackground
          source={BG_DARK}
          resizeMode="repeat"
          style={styles.threadBackground}
        >
          {/*
            Chronological render (natural order): oldest message at the top,
            newest just above the composer. `onContentSizeChange` triggers
            `scrollToEnd` so the viewport pins to the latest message on mount
            AND when a new message is appended — matches the WhatsApp UX.
            No `inverted` prop: the seed data is already chronological and
            the mock has no back-pagination story to justify inverted-list
            memory savings.
          */}
          <FlatList
            ref={flatListRef}
            testID="chat-room-flatlist"
            data={messages as ChatMessage[]}
            keyExtractor={keyExtractor}
            renderItem={renderBubble}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={handleContentSizeChange}
          />
        </ImageBackground>
      </View>

      {/* ── Composer ────────────────────────────────────────────────── */}
      <View style={[styles.composer, { paddingBottom: insets.bottom + theme.spacing.sm }]}>
        {/* Input pill */}
        <View style={styles.inputPill}>
          <RNTextInput
            testID="chat-room-input"
            style={styles.textInput}
            value={composerText}
            onChangeText={setComposerText}
            placeholder={t('chat.room.composerPlaceholder')}
            placeholderTextColor={theme.colors.text.tertiary}
            multiline={true}
            maxLength={1000}
            returnKeyType="default"
          />
        </View>

        {/* Send / Mic circular button */}
        {hasText ? (
          <TouchableArea
            onPress={handleSend}
            accessibilityLabel={t('chat.room.sendAccessibility')}
            testID="chat-room-send-btn"
          >
            <View style={styles.circularBtn}>
              <Send
                size={22}
                color={theme.colors.text.inverse}
                strokeWidth={2}
              />
            </View>
          </TouchableArea>
        ) : (
          <TouchableArea
            onPress={() => {
              // Mic is a no-op in phase 15 — voice messages are not implemented.
            }}
            accessibilityLabel={t('chat.room.micAccessibility')}
            testID="chat-room-mic-btn"
          >
            <View style={styles.circularBtn}>
              <Mic
                size={22}
                color={theme.colors.text.inverse}
                strokeWidth={2}
              />
            </View>
          </TouchableArea>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.bg.primary,
    },
    // ── Header ──────────────────────────────────────────────────────────────
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.bg.surface,
      paddingHorizontal: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
      gap: theme.spacing.sm,
      ...theme.shadows.sm,
    },
    iconBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerNameColumn: {
      flex: 1,
      minWidth: 0,
    },
    // ── Thread ───────────────────────────────────────────────────────────────
    threadContainer: {
      flex: 1,
    },
    threadBackground: {
      flex: 1,
    },
    listContent: {
      paddingVertical: theme.spacing.sm,
    },
    // ── Composer ─────────────────────────────────────────────────────────────
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      backgroundColor: theme.colors.bg.primary,
      gap: theme.spacing.sm,
    },
    inputPill: {
      flex: 1,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.colors.bg.surface,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      minHeight: 44,
      justifyContent: 'center',
    },
    textInput: {
      ...textStyles.body.md,
      color: theme.colors.text.primary,
      // Remove default TextInput padding on Android
      padding: 0,
      margin: 0,
    },
    circularBtn: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.accent.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
