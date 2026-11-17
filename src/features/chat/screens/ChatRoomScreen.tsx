/**
 * ChatRoomScreen — WhatsApp-style per-room message thread.
 *
 * Story 15.5: initial shell.
 * Story 16.5 (partial): switches route param from `friendUserId` to `roomId`.
 * Replaces `useChatHistory` with `useMessagesQuery` + `useSendMessageMutation`.
 * Profile resolution moves from `useFriendship().getFullProfile` to deriving
 * the counterpart `user_id` from `ChatRoom.userA`/`userB` via `useRoomsQuery`
 * cache lookup, then calling `useProfileQuery(counterpartUserId)`.
 *
 * Story 16.6 finishes this screen (subscription wiring, AppState resubscribe,
 * status-icon transitions). This story keeps the existing visual intact.
 *
 * **Rules of Hooks.** ALL hooks are declared before any conditional return.
 * Derived values that depend on the resolved state are computed after all hooks.
 *
 * @module features/chat/screens/ChatRoomScreen
 */

import React, { useCallback, useMemo, useState } from 'react';
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

import { EmptyState, LoadingState, Heading, TouchableArea } from '@/components';
import { t } from '@/labels';
import { useMessagesQuery, useRoomsQuery, useSendMessageMutation } from '@/features/chat/api';
import { useProfileQuery } from '@/features/profile/api';
import { useOwnProfile } from '@/state/ownProfile/OwnProfileProvider';
import { adaptMessageToChatMessage } from '@/features/chat/shapeAdapters';
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
 * Per-room message thread screen.
 *
 * Reads `roomId` from the route param. Derives the counterpart user from
 * `useRoomsQuery` cache (looking up the room by `roomId`, then taking
 * whichever of `userA`/`userB` is not `currentUserId`). Resolves the
 * counterpart's display profile via `useProfileQuery`. Renders the full
 * WhatsApp-style thread with composer.
 *
 * Message data comes from `useMessagesQuery(roomId)`. Send goes through
 * `useSendMessageMutation` (optimistic append + rollback).
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

  const { roomId } = route.params;

  // Own profile — needed to derive counterpart user_id.
  const { profile: ownProfile } = useOwnProfile();
  const currentUserId = ownProfile?.user_id ?? '';

  // Rooms cache lookup — find the room to derive counterpart user_id.
  const roomsQuery = useRoomsQuery();
  const room = useMemo(
    () => (roomsQuery.data ?? []).find((r) => r.roomId === roomId) ?? null,
    [roomsQuery.data, roomId],
  );

  // Counterpart user_id from the room record.
  const counterpartUserId = useMemo(() => {
    if (room === null || currentUserId === '') return '';
    return room.userA === currentUserId ? room.userB : room.userA;
  }, [room, currentUserId]);

  // Profile for the counterpart (used in the header).
  const profileQuery = useProfileQuery(counterpartUserId);

  // Messages for this room.
  const messagesQuery = useMessagesQuery(roomId);

  // Send mutation (optimistic append per 16.4).
  const sendMutation = useSendMessageMutation(currentUserId);

  const [composerText, setComposerText] = useState('');

  // Flatten pages of messages into a single array and adapt to ChatMessage.
  // The infinite query pages are ordered oldest-first; flatten preserves that.
  const messages: readonly ChatMessage[] = useMemo(() => {
    if (messagesQuery.data === undefined) return [];
    return messagesQuery.data.pages.flatMap((page) =>
      page.items.map((msg) => adaptMessageToChatMessage(msg, currentUserId)),
    );
  }, [messagesQuery.data, currentUserId]);

  // Reverse for the inverted FlatList (newest at index 0 = bottom of screen).
  const messagesDescending = useMemo(() => [...messages].reverse(), [messages]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleMenuPress = useCallback(() => {
    // No-op: chat room menu is not fully implemented in story 16.5.
    // Story 16.10 adds the block action via a single-item action sheet.
    console.log('chat room menu — not fully implemented yet');
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = composerText.trim();
    if (trimmed.length === 0) return;
    await sendMutation.mutateAsync({ content: trimmed, roomId, contentType: 'text' });
    setComposerText('');
  }, [composerText, roomId, sendMutation]);

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  const renderBubble = useCallback(
    ({ item }: { item: ChatMessage }) => <MessageBubble message={item} />,
    [],
  );

  // ── Profile resolution — after all hooks ───────────────────────────────────

  const profile = profileQuery.data ?? null;

  // ── Loading / missing guard ───────────────────────────────────────────────
  //
  // Conditional return is AFTER all hooks — Rules of Hooks compliant.

  if (profileQuery.isLoading || roomsQuery.isLoading) {
    return (
      <View style={styles.root} testID="chat-room-loading">
        <LoadingState message={t('common.loading')} />
      </View>
    );
  }

  if (profile === null || profileQuery.isError) {
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

  const photoPath = profile.photo_url ?? '';
  const fullName = `${profile.first_name} ${profile.last_name}`;
  const hasText = composerText.trim().length > 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.root}
      // iOS uses 'padding' to add bottom padding equal to the keyboard height.
      // On Android we pass `undefined` so KeyboardAvoidingView becomes a
      // passthrough — the manifest's `windowSoftInputMode="adjustResize"` already
      // resizes the window to make room for the keyboard.
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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

        {/* Triple-dot menu */}
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
            Inverted list rendering the DESCENDING-order copy of `messages`
            (see `messagesDescending` useMemo above). Result: newest just
            above the composer, oldest at the top of the scrollback.
          */}
          <FlatList
            testID="chat-room-flatlist"
            data={messagesDescending}
            keyExtractor={keyExtractor}
            renderItem={renderBubble}
            inverted={true}
            contentContainerStyle={styles.listContent}
            initialNumToRender={30}
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
              // Mic is a no-op in phase 15/16 — voice messages are not yet implemented.
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
