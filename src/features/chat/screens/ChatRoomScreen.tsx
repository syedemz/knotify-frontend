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
 * Story 16.6: adds subscription wiring (`useOnMessageInRoomSubscription`),
 * AppState-resume refetch/resubscribe (via a remount key), `ErrorState` for
 * messages-query failures, and 'sending' → 'sent' → 'delivered' status-icon
 * transitions (the 'sending' clock lives in MessageBubble).
 *
 * Story 16.CH1: adds read-receipt subscription (`useOnReadReceiptSubscription`),
 * mark-as-read on focus (`useMarkReadMutation` debounced via `useFocusEffect`),
 * and 'read' status tick — passes `lastReadMessageCreatedAt` hint to the shape
 * adapter so sent messages that have been read show two blue ticks.
 *
 * Story 16.CH2: adds typing-indicator subscription (`useOnTypingInRoomSubscription`)
 * and outbound typing events (`useSetTypingMutation`) with a 2-second idle timer
 * and ~2-second throttle on outbound `isTyping: true` calls. A `TypingIndicatorRow`
 * is shown above the composer when the counterpart is typing. On unmount, a final
 * `setTyping({ isTyping: false })` is fired so the counterpart's row dismisses
 * immediately.
 *
 * **Rules of Hooks.** ALL hooks are declared before any conditional return.
 * Derived values that depend on the resolved state are computed after all hooks.
 *
 * @module features/chat/screens/ChatRoomScreen
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  FlatList,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from 'react-native';
import type { AppStateStatus } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MoreVertical, Mic, Send } from 'lucide-react-native';

import { EmptyState, ErrorState, LoadingState, Heading, TouchableArea } from '@/components';
import { t } from '@/labels';
import {
  messagesQueryKey,
  useMarkReadMutation,
  useMessagesQuery,
  useOnMessageInRoomSubscription,
  useOnReadReceiptSubscription,
  useOnTypingInRoomSubscription,
  useReadReceiptQuery,
  useRoomsQuery,
  useSendMessageMutation,
  useSetTypingMutation,
} from '@/features/chat/api';
import { TypingIndicatorRow } from '@/features/chat/components/TypingIndicatorRow';
import { useProfileQuery } from '@/features/profile/api';
import { useOwnProfile } from '@/state/ownProfile/OwnProfileProvider';
import { useBlockUserMutation } from '@/features/blocks/api';
import { useUnfriendMutation } from '@/features/friends/api';
import { adaptMessageToChatMessage } from '@/features/chat/shapeAdapters';
import { ProfileThumbnailCircle } from '@/features/profile/components/ProfileThumbnailCircle';
import { MessageBubble } from '@/features/chat/components/MessageBubble';
import { UnfriendedBanner } from '@/features/chat/components/UnfriendedBanner';
import { useTheme } from '@/theme';
import { textStyles } from '@/theme/typography';
import type { Theme } from '@/theme/theme';
import type { TypingEvent } from '@/services/graphql/types';
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
  const queryClient = useQueryClient();

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

  // Block mutation (story 16.10): single-item action sheet on triple-dot.
  const blockMutation = useBlockUserMutation();

  // Unfriend mutation: adds a second destructive item to the action sheet.
  // Backend severs the `friendships` row and flips `friendship_active=false`
  // on the shared ChatRooms row so neither side can send new messages, but
  // the room record and message history are preserved.
  const unfriendMutation = useUnfriendMutation();

  const [composerText, setComposerText] = useState('');

  // ── Keyboard height tracker (Android) ──────────────────────────────────────
  //
  // On iOS we rely on KeyboardAvoidingView below. On Android, neither the
  // manifest's `adjustResize` nor `KeyboardAvoidingView` behavior variants
  // handle this screen's layout reliably (adjustResize alone lets the keyboard
  // cover the composer; KAV leaves a stuck strip after keyboard dismiss on
  // modern Android — see niddah4 / niddah5 reproductions on 2026-11-17).
  // Manual tracking via `Keyboard` listeners is the only approach that opens
  // AND closes cleanly.
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ── Subscription remount key ──────────────────────────────────────────────
  //
  // Bumped on AppState transition to 'active' after a background window so the
  // subscription is torn down and re-established (see AppState useEffect below).
  // The key is passed to a wrapper View so React reconciles the subscription
  // hook as a new mount.
  const [subscriptionKey, setSubscriptionKey] = useState(0);

  // ── AppState handler — refetch + resubscribe on foreground resume ─────────
  //
  // On transition to 'active': invalidate the messages cache so any messages
  // that arrived during the background window are picked up by a fresh fetch,
  // then bump subscriptionKey to remount the subscription hook.
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (prevState !== 'active' && nextState === 'active') {
        // Invalidate so missed messages are fetched rather than replayed.
        void queryClient.invalidateQueries({ queryKey: messagesQueryKey(roomId) });
        // Remount the subscription to re-establish the WebSocket after the
        // AppSync ~10-minute idle disconnection.
        setSubscriptionKey((k) => k + 1);
      }
    });

    return () => {
      sub.remove();
    };
  }, [roomId, queryClient]);

  // ── Subscription wiring ───────────────────────────────────────────────────
  //
  // `useOnMessageInRoomSubscription` manages the WebSocket lifecycle.
  // Passing `subscriptionKey` as `remountKey` causes the hook's internal
  // useEffect to tear down and re-establish the subscription whenever
  // `subscriptionKey` is incremented (on AppState resume).
  useOnMessageInRoomSubscription(roomId, currentUserId, subscriptionKey);

  // ── Read-receipt subscription (16.CH1) ────────────────────────────────────
  //
  // Subscribes to `onReadReceipt(roomId)`. On receipt, stores enriched
  // `ReadReceiptCacheEntry` in `['readReceipts', roomId]`. Unmount tears down.
  useOnReadReceiptSubscription(roomId);

  // ── Read-receipt cache query (16.CH1) ─────────────────────────────────────
  //
  // Reactive read of the latest receipt stored by the subscription above.
  // `enabled: false` — no network fetch, reads from setQueryData writes only.
  const readReceiptQuery = useReadReceiptQuery(roomId);
  const lastReadMessageCreatedAt = readReceiptQuery.data?.lastReadMessageCreatedAt ?? undefined;

  // ── Mark-as-read on focus (16.CH1) ────────────────────────────────────────
  //
  // Fires `markAsRead` once per focus event (not per render). The `useRef`
  // tracks the latest received message id so we always mark up to the
  // most-recently-visible message, even if the focus fires before the query
  // has fully resolved (the ref is updated separately after messages load).
  const markReadMutation = useMarkReadMutation();

  // A ref that tracks the latest *received* (from friend) message id visible
  // in the current page window. Updated after messages resolve (see useMemo).
  const latestReceivedMessageIdRef = useRef<string | null>(null);

  // ── Typing indicator — inbound (16.CH2) ──────────────────────────────────
  //
  // `isCounterpartTyping` drives the TypingIndicatorRow above the composer.
  // Set to `true` on `isTyping: true` events; auto-dismissed after 4 seconds
  // of silence via `counterpartTypingTimerRef`, or immediately on `isTyping: false`.
  const [isCounterpartTyping, setIsCounterpartTyping] = useState(false);
  const counterpartTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTypingEvent = useCallback(
    (event: TypingEvent) => {
      if (counterpartTypingTimerRef.current !== null) {
        clearTimeout(counterpartTypingTimerRef.current);
        counterpartTypingTimerRef.current = null;
      }
      if (event.isTyping) {
        setIsCounterpartTyping(true);
        // Auto-dismiss after 4 seconds of silence (AC 3).
        counterpartTypingTimerRef.current = setTimeout(() => {
          setIsCounterpartTyping(false);
          counterpartTypingTimerRef.current = null;
        }, 4000);
      } else {
        setIsCounterpartTyping(false);
      }
    },
    [],
  );

  useOnTypingInRoomSubscription(roomId, currentUserId, handleTypingEvent);

  // ── Typing indicator — outbound (16.CH2) ─────────────────────────────────
  //
  // Throttle: at most one `isTyping: true` call every ~2 seconds regardless
  // of keystroke frequency. Idle timer: 2 seconds of no input → `isTyping: false`.
  // On unmount: final `setTyping(false)` so counterpart's row dismisses.
  const setTypingMutation = useSetTypingMutation();
  const setTypingMutationRef = useRef(setTypingMutation);
  useEffect(() => {
    setTypingMutationRef.current = setTypingMutation;
  });

  // Ref stores the wall-clock timestamp of the last `isTyping: true` outbound call.
  const lastTypingTrueSentAtRef = useRef<number>(0);
  // Ref for the 2-second idle timer that sends `isTyping: false`.
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref for whether we have an active outbound typing session (sent true, not yet false).
  const isTypingActiveRef = useRef(false);

  // handleComposerChange: called on every input-change event.
  // Wire this into the TextInput's onChangeText alongside setComposerText.
  const handleComposerChange = useCallback(
    (text: string) => {
      setComposerText(text);

      if (text.length === 0) {
        // Input cleared — end typing session immediately.
        if (idleTimerRef.current !== null) {
          clearTimeout(idleTimerRef.current);
          idleTimerRef.current = null;
        }
        if (isTypingActiveRef.current) {
          isTypingActiveRef.current = false;
          setTypingMutationRef.current.mutate({ isTyping: false, roomId });
        }
        return;
      }

      // Non-empty: reset idle timer.
      if (idleTimerRef.current !== null) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      idleTimerRef.current = setTimeout(() => {
        idleTimerRef.current = null;
        isTypingActiveRef.current = false;
        setTypingMutationRef.current.mutate({ isTyping: false, roomId });
      }, 2000);

      // Throttle: only send `isTyping: true` if more than ~2s have elapsed
      // since the last true call (AC 2 throttle requirement).
      const now = Date.now();
      if (!isTypingActiveRef.current || now - lastTypingTrueSentAtRef.current >= 2000) {
        isTypingActiveRef.current = true;
        lastTypingTrueSentAtRef.current = now;
        setTypingMutationRef.current.mutate({ isTyping: true, roomId });
      }
    },
    [roomId],
  );

  // Unmount: clear timers and send final `setTyping(false)` (AC 5).
  useEffect(() => {
    return () => {
      if (idleTimerRef.current !== null) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      if (counterpartTypingTimerRef.current !== null) {
        clearTimeout(counterpartTypingTimerRef.current);
        counterpartTypingTimerRef.current = null;
      }
      if (isTypingActiveRef.current) {
        isTypingActiveRef.current = false;
        setTypingMutationRef.current.mutate({ isTyping: false, roomId });
      }
    };
    // roomId is a route param — stable for the lifetime of this screen mount.
  }, [roomId]);

  // Debounced mark-as-read: fires at most once per focus event.
  useFocusEffect(
    useCallback(() => {
      const latestId = latestReceivedMessageIdRef.current;
      if (latestId !== null) {
        markReadMutation.mutate({ roomId, lastMessageId: latestId });
      }
      // `markReadMutation.mutate` is stable across renders (TanStack mutation
      // object identity is stable); `roomId` is a route param — no extra deps.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]),
  );

  // Flatten pages of messages into a single array and adapt to ChatMessage.
  // The infinite query pages are ordered oldest-first; flatten preserves that.
  const messages: readonly ChatMessage[] = useMemo(() => {
    if (messagesQuery.data === undefined) return [];

    // Track the latest received-message id for the mark-read focus handler.
    // ISO-8601 string comparison is lexicographically equivalent to chronological
    // order (the server uses UTC ISO strings), so we find the max by createdAt.
    let latestReceivedId: string | null = null;
    let latestReceivedCreatedAt: string | null = null;

    const adapted = messagesQuery.data.pages.flatMap((page) =>
      page.items.map((msg) => {
        if (msg.senderId !== currentUserId) {
          if (
            latestReceivedCreatedAt === null ||
            msg.createdAt > latestReceivedCreatedAt
          ) {
            latestReceivedId = msg.messageId;
            latestReceivedCreatedAt = msg.createdAt;
          }
        }
        return adaptMessageToChatMessage(msg, currentUserId, {
          lastReadMessageCreatedAt,
        });
      }),
    );

    // Update the ref so the focus handler always has the latest id.
    latestReceivedMessageIdRef.current = latestReceivedId;

    return adapted;
  }, [messagesQuery.data, currentUserId, lastReadMessageCreatedAt]);

  // Reverse for the inverted FlatList (newest at index 0 = bottom of screen).
  const messagesDescending = useMemo(() => [...messages].reverse(), [messages]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleMenuPress = useCallback(() => {
    // Two-item action sheet: Unfriend + Block, each with a two-step confirm.
    // counterpartUserId is derived before this handler fires (see useMemo above).
    // Alert.alert is the accepted cross-platform pattern for this phase.
    Alert.alert(
      t('blocks.action.sheetTitle'),
      undefined,
      [
        {
          text: t('friends.action.unfriendLabel'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('friends.action.confirmTitle'),
              t('friends.action.confirmMessage'),
              [
                { text: t('friends.action.cancel'), style: 'cancel' },
                {
                  text: t('friends.action.confirmUnfriend'),
                  style: 'destructive',
                  onPress: () => {
                    if (counterpartUserId !== '') {
                      unfriendMutation.mutate({ userId: counterpartUserId });
                    }
                    navigation.goBack();
                  },
                },
              ],
            );
          },
        },
        {
          text: t('blocks.action.blockLabel'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('blocks.action.confirmTitle'),
              t('blocks.action.confirmMessage'),
              [
                { text: t('blocks.action.cancel'), style: 'cancel' },
                {
                  text: t('blocks.action.confirmBlock'),
                  style: 'destructive',
                  onPress: () => {
                    if (counterpartUserId !== '') {
                      blockMutation.mutate({ userId: counterpartUserId });
                    }
                    navigation.goBack();
                  },
                },
              ],
            );
          },
        },
        { text: t('blocks.action.cancel'), style: 'cancel' },
      ],
    );
    // counterpartUserId is a derived value (useMemo) but stable as long as the
    // room record and currentUserId are stable. We include it in deps rather
    // than using a ref because the hook order is unconditional and the dep
    // array keeps the closure fresh.
  }, [blockMutation, unfriendMutation, counterpartUserId, navigation]);

  const handleSend = useCallback(async () => {
    const trimmed = composerText.trim();
    if (trimmed.length === 0) return;

    // End the typing session before sending — clear idle timer and send false.
    if (idleTimerRef.current !== null) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (isTypingActiveRef.current) {
      isTypingActiveRef.current = false;
      setTypingMutationRef.current.mutate({ isTyping: false, roomId });
    }

    try {
      await sendMutation.mutateAsync({ content: trimmed, roomId, contentType: 'text' });
      setComposerText('');
    } catch (err) {
      // The optimistic rollback is handled by useSendMessageMutation.onError.
      // Log here so the error is not silently swallowed in development.
      console.warn('[ChatRoomScreen] sendMessage failed — rollback applied', err);
    }
  }, [composerText, roomId, sendMutation]);

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  const renderBubble = useCallback(
    ({ item }: { item: ChatMessage }) => <MessageBubble message={item} />,
    [],
  );

  // ── Profile resolution — after all hooks ───────────────────────────────────

  const profile = profileQuery.data ?? null;

  // ── Loading / error / missing guard ──────────────────────────────────────
  //
  // Conditional returns are AFTER all hooks — Rules of Hooks compliant.

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

  if (messagesQuery.isError) {
    return (
      <View style={styles.root} testID="chat-room-error">
        <ErrorState
          title={t('chat.room.errorTitle')}
          description={t('chat.room.errorDescription')}
        />
      </View>
    );
  }

  // ── Derived values from resolved profile ───────────────────────────────────

  const photoPath = profile.photo_url ?? '';
  const fullName = `${profile.first_name} ${profile.last_name}`;
  const hasText = composerText.trim().length > 0;

  // Read-only state: the backend flips `friendship_active=false` on the shared
  // ChatRooms row when either side unfriends or blocks. `sendMessage` from
  // either participant then returns `RoomReadOnly`. We render a banner in
  // place of the composer and skip the typing-indicator row so the surface
  // matches the server-side capability.
  //
  // `room` is `null` while rooms query is in flight but we've already
  // returned above for `roomsQuery.isLoading`, so we treat `null` here as
  // "flag not available → assume active" to avoid flashing the banner.
  const isReadOnly = room?.friendshipActive === false;

  // ── Render ─────────────────────────────────────────────────────────────────

  // iOS wraps in KeyboardAvoidingView with behavior="padding" because iOS does
  // not resize the window when the keyboard appears. Android passes undefined
  // — the manifest's `windowSoftInputMode="adjustResize"` resizes the window,
  // and the nested ImageBackground + FlatList layout shrinks + restores
  // cleanly. Combining KAV with adjustResize on Android leaves a stuck strip
  // at the bottom after the keyboard dismisses (known double-adjust bug —
  // see `niddah5.png` repro 2026-11-17).
  return (
    <KeyboardAvoidingView
      style={styles.root}
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
      {/*
        Chat area: a single ImageBackground wraps BOTH the message list AND
        the composer so the dark pattern shows through behind the pill
        instead of butting up against a solid-dark footer strip (WhatsApp
        aesthetic — pill floats over the pattern).
       */}
      <ImageBackground
        source={BG_DARK}
        resizeMode="repeat"
        style={styles.chatArea}
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
          style={styles.list}
        />

        {/* ── Typing indicator row (16.CH2) ──────────────────────────── */}
        {/* profile is non-null here (past the null guard above). */}
        {/* Hidden in read-only state — neither side can send, so typing is moot. */}
        {!isReadOnly && isCounterpartTyping && (
          <TypingIndicatorRow friendName={profile.first_name ?? ''} />
        )}

        {/* ── Composer or UnfriendedBanner (floats over the pattern) ─ */}
        {/*
          When the friendship is severed (unfriend / block from either side),
          the backend sets `friendship_active=false` on the shared ChatRooms
          row and `sendMessage` returns `RoomReadOnly`. We swap the composer
          for `UnfriendedBanner` so the UI matches the server capability.

          Android: paddingBottom = max(insets.bottom + sm, keyboardHeight).
          When the keyboard is hidden, keyboardHeight = 0 so only the
          safe-area + visual padding applies. When it opens, the composer
          lifts by exactly the keyboard height, keeping the pill visible
          above the IME. This replaces the broken KeyboardAvoidingView +
          adjustResize pipeline on Android.
          iOS: KeyboardAvoidingView (behavior="padding") lifts the whole root.
        */}
        {isReadOnly ? (
          <UnfriendedBanner friendName={profile.first_name ?? ''} />
        ) : (
          <View
            style={[
              styles.composer,
              {
                // When keyboard is open on Android, Keyboard.endCoordinates.height
                // reports the IME area but on some devices it excludes the
                // suggestion-bar / gesture-inset strip at the top of the IME.
                // Adding `insets.bottom` gives us enough margin that the pill
                // always sits clear of the keyboard top, matching WhatsApp's
                // visual gap.
                paddingBottom:
                  Platform.OS === 'android' && keyboardHeight > 0
                    ? keyboardHeight + insets.bottom + theme.spacing.sm
                    : insets.bottom + theme.spacing.sm,
              },
            ]}
          >
            {/* Input pill */}
            <View style={styles.inputPill}>
              <RNTextInput
                testID="chat-room-input"
                style={styles.textInput}
                value={composerText}
                onChangeText={handleComposerChange}
                placeholder={t('chat.room.composerPlaceholder')}
                placeholderTextColor="#8696A0"
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
        )}
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

// Chat-screen palette — fixed dark colors regardless of app theme, matching
// the dark-pattern bgDark.jpg background so there are no white flashes when
// the keyboard animates or when the text input grows/shrinks.
const CHAT_BG_DARK = '#0B141A';       // Base dark — blends with the pattern.
const CHAT_PILL_BG = '#1F2C33';       // Pill fill — subtly lighter than base.
const CHAT_TEXT_PRIMARY = '#E9EDEF';  // Input text on pill.
const CHAT_PLACEHOLDER = '#8696A0';   // Placeholder colour.

function createStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      // Fixed dark base so keyboard-animation frames never reveal a white
      // underlay. Matches the ImageBackground pattern base colour.
      backgroundColor: CHAT_BG_DARK,
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
    // ── Chat area (ImageBackground wraps list + composer) ────────────────────
    chatArea: {
      flex: 1,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingVertical: theme.spacing.sm,
    },
    // ── Composer ─────────────────────────────────────────────────────────────
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      // Tighter horizontal padding and gap so the pill reaches closer to the
      // screen edges (WhatsApp-style — more room to type).
      paddingHorizontal: theme.spacing.sm,
      paddingTop: theme.spacing.sm,
      // Transparent so the ImageBackground pattern shows through — pill
      // floats over the pattern (WhatsApp-style).
      backgroundColor: 'transparent',
      gap: theme.spacing.xs,
    },
    inputPill: {
      flex: 1,
      borderRadius: theme.radii.pill,
      backgroundColor: CHAT_PILL_BG,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      minHeight: 44,
      justifyContent: 'center',
    },
    textInput: {
      ...textStyles.body.md,
      color: CHAT_TEXT_PRIMARY,
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

/**
 * Exposed for `ChatRoomScreen` consumers who want the fixed dark base colour
 * (e.g. the `TypingIndicatorRow` underlay — must match the composer so its
 * background doesn't flash during the keyboard animation).
 */
export const CHAT_SCREEN_BG_DARK = CHAT_BG_DARK;
