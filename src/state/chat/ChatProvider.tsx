/**
 * In-memory mirror of per-friend chat history, exposed via `useChatHistory(friendUserId)`.
 *
 * TODO(mock-only): remove when real messages endpoint ships (phase 17).
 * Replace `useChatHistory` with `useMessagesQuery` + `useOnMessageAddedSubscription`
 * from AppSync and delete `src/features/chat/storage/chatHistoryStorage.ts` along
 * with `assets/dummychat/chatMehvish.json`.
 *
 * **Per-friend cache at provider level.** The cache is a `Map<friendUserId, messages[]>`
 * held in a `useRef` inside the provider. Multiple `useChatHistory('mehvish')`
 * consumers share the same entry in this map — they do NOT each hold their own copy.
 * `useState` on a per-friend key triggers re-renders for all consumers of that key.
 *
 * **Hydration.** The first call to `useChatHistory(friendUserId)` for a given
 * `friendUserId` reads AsyncStorage. If the result is empty and the friend is
 * Mehvish, the provider seeds from `assets/dummychat/chatMehvish.json` (reading
 * only `.messages`, NOT the root — the root `_meta` block is fixture-only).
 * Subsequent calls for the same `friendUserId` hit the in-memory cache.
 *
 * **Why in-memory?** AsyncStorage reads are async; React render bodies are
 * synchronous. Holding an in-memory mirror allows all hook consumers to call
 * `sendMessage`, `updateMessage`, and `deleteMessage` synchronously from their
 * render trees and event handlers, without waiting on storage every time.
 *
 * @module state/chat/ChatProvider
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { ChatMessage } from '@/types/ChatMessage';
import {
  getHistory,
  saveHistory,
  appendMessage as storageAppendMessage,
  updateMessage as storageUpdateMessage,
  deleteMessage as storageDeleteMessage,
} from '@/features/chat/storage/chatHistoryStorage';

// ── Mehvish user_id constant ──────────────────────────────────────────────────

/**
 * The `user_id` of the Mehvish fixture profile.
 *
 * Derived once at module load from `assets/dummymehvish.json` so there is a
 * single source of truth. Story 15.7 imports this constant to resolve Mehvish's
 * profile for the `RequestAcceptedModal` dev trigger.
 *
 * TODO(mock-only): remove when real backend + fixture teardown ship
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
export const MEHVISH_USER_ID: string = (
  require('../../../assets/dummymehvish.json') as { user_id: string }
).user_id;

// ── Seed JSON type ────────────────────────────────────────────────────────────

interface ChatSeedJson {
  readonly _meta: {
    readonly base_timestamp_ms: number;
    readonly description: string;
  };
  readonly messages: ChatMessage[];
}

// ── Id generation ─────────────────────────────────────────────────────────────

/**
 * Generates a locally-unique message id.
 *
 * Uses `crypto.randomUUID()` when available (React Native ≥ 0.73 on both
 * platforms). Falls back to a timestamp + random suffix for older environments.
 * This is a mock-only detail; phase 17 replaces locally-generated ids with
 * server-assigned ids from AppSync.
 */
function generateMessageId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ── Context value type ────────────────────────────────────────────────────────

/**
 * The value returned by `useChatHistory(friendUserId)`.
 *
 * All mutable operations are `async` — they write through to AsyncStorage and
 * then update the in-memory mirror. Consumers do not need to poll or re-read
 * storage directly.
 *
 * TODO(mock-only): replace when real messages endpoint ships
 */
export interface ChatHistoryValue {
  /** Current messages for this friend. Reflects the in-memory mirror. */
  readonly messages: readonly ChatMessage[];

  /**
   * `true` while the initial AsyncStorage hydration is in-flight for this
   * `friendUserId`. Once hydrated, stays `false` — no re-fetch semantics.
   */
  readonly loading: boolean;

  /**
   * Sends a new message to the friend.
   *
   * Trims the input. Empty-after-trim is a no-op (logs `console.warn`).
   * Creates a `ChatMessage` with `sender: 'me'`, `status: 'sent'`, and the
   * current wall-clock timestamp. Writes to AsyncStorage via `appendMessage`,
   * then updates the in-memory mirror.
   *
   * @param text - The raw text typed by the user.
   */
  readonly sendMessage: (text: string) => Promise<void>;

  /**
   * Applies a partial patch to a message identified by `id`.
   *
   * Delegates to the storage layer's `updateMessage`, then refreshes the
   * in-memory mirror. Only the fields present in `patch` are changed.
   *
   * @param id - The id of the message to update.
   * @param patch - Fields to merge into the existing message (excluding `id`).
   */
  readonly updateMessage: (
    id: string,
    patch: Partial<Omit<ChatMessage, 'id'>>,
  ) => Promise<void>;

  /**
   * Hard-deletes a message from the history.
   *
   * Idempotent — deleting a non-existent id is a no-op. Delegates to the
   * storage layer's `deleteMessage`, then refreshes the in-memory mirror.
   *
   * @param id - The id of the message to remove.
   */
  readonly deleteMessage: (id: string) => Promise<void>;
}

// ── Internal context shape ────────────────────────────────────────────────────

/**
 * Internal context value held by the provider.
 *
 * Consumers never call this directly — they call `useChatHistory(friendUserId)`
 * which builds the per-friend view on top of this context.
 */
interface ChatContextValue {
  /**
   * Retrieves the messages for a given friend from the in-memory cache.
   * Returns `null` when the friend has not yet been hydrated (triggers hydration).
   */
  readonly getMessages: (friendUserId: string) => readonly ChatMessage[] | null;

  /** Returns `true` when hydration for `friendUserId` is in-flight. */
  readonly isLoading: (friendUserId: string) => boolean;

  /**
   * Triggers hydration for `friendUserId` if not already hydrated or loading.
   * Called by `useChatHistory` on mount.
   */
  readonly hydrateIfNeeded: (friendUserId: string) => void;

  /** Appends a new message to the in-memory mirror and storage. */
  readonly sendMessage: (friendUserId: string, text: string) => Promise<void>;

  /** Patches a message in the in-memory mirror and storage. */
  readonly updateMessage: (
    friendUserId: string,
    id: string,
    patch: Partial<Omit<ChatMessage, 'id'>>,
  ) => Promise<void>;

  /** Deletes a message from the in-memory mirror and storage. */
  readonly deleteMessage: (friendUserId: string, id: string) => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

interface ChatProviderProps {
  /** React subtree that can call `useChatHistory(friendUserId)`. */
  readonly children?: React.ReactNode;
}

/**
 * Provider for the per-friend chat history in-memory mirror.
 *
 * Holds a provider-level `Map<friendUserId, messages[]>` cache. All consumers
 * of `useChatHistory(friendUserId)` for the same `friendUserId` share a single
 * cache entry — mutations in one consumer are immediately visible to all others.
 *
 * Insert between `BookmarksProvider` and `NavigationContainer` in `App.tsx`:
 * ```
 * <BookmarksProvider>
 *   <ChatProvider>
 *     <NavigationContainer ...>
 * ```
 *
 * TODO(mock-only): remove when real messages endpoint ships (phase 17)
 *
 * @param props - {@link ChatProviderProps}
 */
export function ChatProvider({ children }: ChatProviderProps): React.JSX.Element {
  // Per-friend in-memory cache: Map<friendUserId, messages[]>
  // Stored in a ref so mutations don't trigger a top-level re-render of the
  // entire provider subtree — only the per-friend loading state changes.
  const cacheRef = useRef<Map<string, readonly ChatMessage[]>>(new Map());

  // Per-friend loading flags. Stored in state so changes propagate to consumers.
  const [loadingMap, setLoadingMap] = useState<ReadonlyMap<string, boolean>>(new Map());

  // Track which friends are already hydrating or hydrated to prevent duplicate
  // hydration calls when multiple consumers mount concurrently.
  const hydratingRef = useRef<Set<string>>(new Set());

  // Trigger state update counter per friendUserId. When we mutate cacheRef we
  // need to signal consumers to re-read. We do this via a per-friend version
  // counter held in state.
  const [versionMap, setVersionMap] = useState<ReadonlyMap<string, number>>(new Map());

  // ── Internal helpers ───────────────────────────────────────────────────────

  /** Bumps the version for `friendUserId` so hook consumers re-render. */
  const bumpVersion = useCallback((friendUserId: string): void => {
    setVersionMap((prev) => {
      const next = new Map(prev);
      next.set(friendUserId, (prev.get(friendUserId) ?? 0) + 1);
      return next;
    });
  }, []);

  /** Marks `friendUserId` as loading or not in the `loadingMap`. */
  const setLoading = useCallback((friendUserId: string, value: boolean): void => {
    setLoadingMap((prev) => {
      const next = new Map(prev);
      next.set(friendUserId, value);
      return next;
    });
  }, []);

  // ── hydrateIfNeeded ────────────────────────────────────────────────────────

  const hydrateIfNeeded = useCallback(
    (friendUserId: string): void => {
      // Already hydrated or currently hydrating — nothing to do.
      if (cacheRef.current.has(friendUserId) || hydratingRef.current.has(friendUserId)) {
        return;
      }

      hydratingRef.current.add(friendUserId);
      setLoading(friendUserId, true);

      const hydrate = async (): Promise<void> => {
        let messages = await getHistory(friendUserId);

        if (messages.length === 0 && friendUserId === MEHVISH_USER_ID) {
          // First mount for Mehvish with empty storage — seed from fixture.
          // Read only `.messages`; the `_meta` block is fixture-only and MUST
          // NOT be persisted to AsyncStorage.
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const seedJson = require('../../../assets/dummychat/chatMehvish.json') as ChatSeedJson;
          await saveHistory(friendUserId, seedJson.messages as ChatMessage[]);
          messages = await getHistory(friendUserId);
        }

        cacheRef.current.set(friendUserId, messages);
        setLoading(friendUserId, false);
        bumpVersion(friendUserId);
      };

      void hydrate();
    },
    [bumpVersion, setLoading],
  );

  // ── getMessages ────────────────────────────────────────────────────────────

  const getMessages = useCallback(
    (friendUserId: string): readonly ChatMessage[] | null =>
      cacheRef.current.get(friendUserId) ?? null,
    // versionMap is intentionally included so re-renders propagate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [versionMap],
  );

  // ── isLoading ──────────────────────────────────────────────────────────────

  const isLoading = useCallback(
    (friendUserId: string): boolean => loadingMap.get(friendUserId) ?? false,
    [loadingMap],
  );

  // ── sendMessage ────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (friendUserId: string, text: string): Promise<void> => {
      const trimmed = text.trim();
      if (trimmed.length === 0) {
        console.warn('[ChatProvider] sendMessage: empty or whitespace-only input — no-op');
        return;
      }

      const message: ChatMessage = {
        id: generateMessageId(),
        sender: 'me',
        text: trimmed,
        timestamp: Date.now(),
        status: 'sent',
      };

      await storageAppendMessage(friendUserId, message);
      const current = cacheRef.current.get(friendUserId) ?? [];
      cacheRef.current.set(friendUserId, [...current, message]);
      bumpVersion(friendUserId);
    },
    [bumpVersion],
  );

  // ── updateMessage ──────────────────────────────────────────────────────────

  const updateMessage = useCallback(
    async (
      friendUserId: string,
      id: string,
      patch: Partial<Omit<ChatMessage, 'id'>>,
    ): Promise<void> => {
      await storageUpdateMessage(friendUserId, id, patch);
      const current = cacheRef.current.get(friendUserId) ?? [];
      const updated = current.map((m) => (m.id === id ? { ...m, ...patch } : m));
      cacheRef.current.set(friendUserId, updated);
      bumpVersion(friendUserId);
    },
    [bumpVersion],
  );

  // ── deleteMessage ──────────────────────────────────────────────────────────

  const deleteMessage = useCallback(
    async (friendUserId: string, id: string): Promise<void> => {
      await storageDeleteMessage(friendUserId, id);
      const current = cacheRef.current.get(friendUserId) ?? [];
      cacheRef.current.set(friendUserId, current.filter((m) => m.id !== id));
      bumpVersion(friendUserId);
    },
    [bumpVersion],
  );

  // ── Context value ──────────────────────────────────────────────────────────

  const value: ChatContextValue = {
    getMessages,
    isLoading,
    hydrateIfNeeded,
    sendMessage,
    updateMessage,
    deleteMessage,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// ── useChatHistory hook ───────────────────────────────────────────────────────

/**
 * Returns the chat history and mutation actions for the given friend.
 *
 * On first mount for a given `friendUserId`, reads AsyncStorage. If empty and
 * `friendUserId === MEHVISH_USER_ID`, seeds from `assets/dummychat/chatMehvish.json`
 * (only `.messages` — the `_meta` block is never persisted). Subsequent calls
 * for the same `friendUserId` hit the in-memory cache at the provider level, so
 * multiple consumers see the same array.
 *
 * `loading` is `true` only during the initial hydration read. Once the in-memory
 * mirror is populated it stays `false`.
 *
 * @param friendUserId - The `user_id` of the friend whose history to load.
 * @returns {@link ChatHistoryValue}
 * @throws {Error} When called outside a {@link ChatProvider}.
 *
 * TODO(mock-only): replace with `useMessagesQuery` + `useOnMessageAddedSubscription`
 * when phase 17 ships the real AppSync backend.
 */
export function useChatHistory(friendUserId: string): ChatHistoryValue {
  const ctx = useContext(ChatContext);
  if (ctx === undefined) {
    throw new Error('useChatHistory must be used within a ChatProvider');
  }

  const { getMessages, isLoading, hydrateIfNeeded, sendMessage, updateMessage, deleteMessage } =
    ctx;

  // Trigger hydration on first mount for this friendUserId.
  useEffect(() => {
    hydrateIfNeeded(friendUserId);
  }, [friendUserId, hydrateIfNeeded]);

  const messages = getMessages(friendUserId) ?? [];
  const loading = isLoading(friendUserId);

  const sendMessageBound = useCallback(
    (text: string): Promise<void> => sendMessage(friendUserId, text),
    [friendUserId, sendMessage],
  );

  const updateMessageBound = useCallback(
    (id: string, patch: Partial<Omit<ChatMessage, 'id'>>): Promise<void> =>
      updateMessage(friendUserId, id, patch),
    [friendUserId, updateMessage],
  );

  const deleteMessageBound = useCallback(
    (id: string): Promise<void> => deleteMessage(friendUserId, id),
    [friendUserId, deleteMessage],
  );

  return {
    messages,
    loading,
    sendMessage: sendMessageBound,
    updateMessage: updateMessageBound,
    deleteMessage: deleteMessageBound,
  };
}
