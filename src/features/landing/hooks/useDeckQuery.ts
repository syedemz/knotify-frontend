/**
 * `useDeckQuery` — TanStack Query hook for the landing-page deck.
 *
 * Wraps `matchApi.getDeck()` with the project's standard query defaults
 * (staleTime 5 min, 2 retries on failure, 10 min gcTime — see
 * `QueryProvider`). Consumers get loading / error / success states, plus
 * `refetch()` for pull-to-refresh and `invalidate()` after a card is
 * actioned (accept / decline / skip).
 *
 * Query key: `['match', 'deck']` — scoped namespace so the match surface can
 * grow (`['match', 'search']`, etc.) without colliding.
 *
 * @module features/landing/hooks/useDeckQuery
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { matchApi } from '@/services/api/endpoints';
import type { DeckProfile } from '@/types/api/DeckProfile';

/** TanStack Query key used across the match surface. */
export const DECK_QUERY_KEY = ['match', 'deck'] as const;

/**
 * Fetches the current deck of candidate profiles.
 *
 * The backend returns `{ results, next_cursor }` — this hook plucks
 * `.results` so consumers see a plain `DeckProfile[]`. Pagination via
 * `next_cursor` isn't wired yet (future work); when it is, add a separate
 * `useDeckPagesQuery` or extend this hook to expose both fields.
 *
 * @returns TanStack Query result with `data: DeckProfile[]`, `isLoading`,
 *   `isError`, `error`, and `refetch` surfaced to the caller.
 */
export function useDeckQuery() {
  return useQuery<DeckProfile[], Error>({
    queryKey: DECK_QUERY_KEY,
    queryFn: async () => {
      const envelope = await matchApi.getDeck();
      return envelope.results;
    },
  });
}

/**
 * Invalidates the deck query so the next consumer re-fetches from the
 * backend. Use after a card is actioned (future: accept / decline / skip).
 */
export function useInvalidateDeck(): () => Promise<void> {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: DECK_QUERY_KEY });
}
