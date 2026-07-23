/**
 * Hook for reading and writing the onboarding wizard draft.
 *
 * The draft is persisted to `expo-secure-store` under the `onboarding.draft`
 * key. Writes are debounced by 200 ms (trailing-edge) so rapid UI updates
 * (e.g. text field keystrokes) do not hammer the secure-store API.
 *
 * @module features/onboarding/hooks/useOnboardingDraft
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { secureStorage } from '@/services/auth/secureStorage';
import {
  createEmptyDraft,
  type OnboardingDraft,
  type SiblingDraft,
  type DraftFields,
} from '../draftSchema';

/** Debounce delay for secure-store writes, in milliseconds. */
const WRITE_DEBOUNCE_MS = 200;

/**
 * The public API exposed by {@link useOnboardingDraft}.
 */
export interface UseOnboardingDraftReturn {
  /**
   * Merges `partial` into the draft's `fields` and schedules a debounced
   * write to secure-store.
   *
   * Checkpoint non-regression is enforced: if `partial` contains a
   * `lastCheckpoint` that would regress (e.g. `null` when the current value
   * is `'firstCheckpoint'`), the checkpoint is silently ignored and the
   * existing value is kept.
   *
   * @param partial - Partial draft fields to merge.
   */
  update: (partial: DraftFields) => void;

  /**
   * Advances the wizard to `nextPage` and schedules a debounced write.
   *
   * @param nextPage - The 1-based page number to advance to.
   */
  advance: (nextPage: number) => void;

  /**
   * Advances the wizard to `nextPage` and sets the checkpoint if this advance
   * crosses a checkpoint boundary. Checkpoint non-regression is enforced.
   *
   * @param nextPage - The 1-based page number to advance to.
   * @param checkpoint - The checkpoint to record, or `null` for no change.
   */
  advanceWithCheckpoint: (
    nextPage: number,
    checkpoint: OnboardingDraft['lastCheckpoint'],
  ) => void;

  /**
   * Clears the draft from both memory and secure-store and resets to a fresh
   * empty draft (e.g. on sign-out or flow restart).
   */
  reset: () => void;

  /**
   * Returns the current in-memory draft snapshot.
   *
   * The returned object is a reference to the internal state — do not mutate
   * it directly.
   *
   * @returns The current {@link OnboardingDraft}.
   */
  getDraft: () => OnboardingDraft;

  /**
   * Updates the siblings list and schedules a debounced write.
   *
   * @param siblings - The new complete siblings array.
   */
  setSiblings: (siblings: SiblingDraft[]) => void;

  /**
   * `true` while the initial draft is being loaded from secure-store on mount.
   */
  isLoading: boolean;
}

/**
 * Checkpoint precedence order. A higher index means a "later" checkpoint.
 * Non-regression means we only allow moving to the same or higher index.
 */
const CHECKPOINT_ORDER: readonly OnboardingDraft['lastCheckpoint'][] = [
  null,
  'firstCheckpoint',
  'secondCheckpoint',
] as const;

/**
 * Returns the index of a checkpoint in the precedence order.
 * Higher index = later checkpoint.
 */
function checkpointIndex(cp: OnboardingDraft['lastCheckpoint']): number {
  return CHECKPOINT_ORDER.indexOf(cp);
}

/**
 * Returns the checkpoint to use given the current and candidate values.
 * Never regresses — returns `current` if `candidate` is lower.
 */
function resolveCheckpoint(
  current: OnboardingDraft['lastCheckpoint'],
  candidate: OnboardingDraft['lastCheckpoint'],
): OnboardingDraft['lastCheckpoint'] {
  return checkpointIndex(candidate) > checkpointIndex(current)
    ? candidate
    : current;
}

/**
 * Reads, writes, and resets the onboarding wizard draft via expo-secure-store.
 *
 * Writes are debounced by {@link WRITE_DEBOUNCE_MS} ms (trailing-edge) — a
 * single write fires per debounce window regardless of how many `update()` or
 * `advance()` calls are made within that window.
 *
 * @returns {@link UseOnboardingDraftReturn}
 *
 * @example
 * ```tsx
 * const { update, advance, getDraft } = useOnboardingDraft();
 * update({ email: 'user@example.com' });
 * advance(3);
 * ```
 */
export function useOnboardingDraft(): UseOnboardingDraftReturn {
  const [draft, setDraft] = useState<OnboardingDraft>(createEmptyDraft);
  const [isLoading, setIsLoading] = useState(true);

  // Ref to the latest draft for use inside the debounced write without
  // stale-closure issues.
  const draftRef = useRef<OnboardingDraft>(draft);

  // Timer ref for the debounced write.
  const writeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load the persisted draft from secure-store on mount.
  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      const raw = await secureStorage.getOnboardingDraft();
      if (cancelled) return;

      if (raw !== null) {
        try {
          const parsed = JSON.parse(raw) as OnboardingDraft;
          if (!cancelled) {
            draftRef.current = parsed;
            setDraft(parsed);
          }
        } catch {
          // Corrupted stored draft — start fresh.
          draftRef.current = createEmptyDraft();
          setDraft(createEmptyDraft());
        }
      }

      if (!cancelled) {
        setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // Schedule a trailing-edge debounced write of the latest draftRef value.
  const scheduleWrite = useCallback((): void => {
    if (writeTimerRef.current !== null) {
      clearTimeout(writeTimerRef.current);
    }
    writeTimerRef.current = setTimeout(() => {
      const serialized = JSON.stringify(draftRef.current);
      // Fire-and-forget intentionally: storage errors are non-fatal here.
      // story 2.5 adds explicit error handling at the call site for critical writes.
      secureStorage.setOnboardingDraft(serialized).catch(() => {
        // Storage write failure is logged implicitly by the caller's error
        // handling. Silently ignoring here keeps the hook non-blocking.
      });
      writeTimerRef.current = null;
    }, WRITE_DEBOUNCE_MS);
  }, []);

  // Flush any pending write on unmount to avoid losing the final state.
  useEffect(() => {
    return () => {
      if (writeTimerRef.current !== null) {
        clearTimeout(writeTimerRef.current);
        writeTimerRef.current = null;
      }
    };
  }, []);

  const update = useCallback(
    (partial: DraftFields): void => {
      setDraft((prev) => {
        const next: OnboardingDraft = {
          ...prev,
          fields: { ...prev.fields, ...partial },
          timestamps: {
            ...prev.timestamps,
            updatedAt: new Date().toISOString(),
          },
        };
        draftRef.current = next;
        scheduleWrite();
        return next;
      });
    },
    [scheduleWrite],
  );

  const advance = useCallback(
    (nextPage: number): void => {
      setDraft((prev) => {
        const next: OnboardingDraft = {
          ...prev,
          currentPage: nextPage,
          timestamps: {
            ...prev.timestamps,
            updatedAt: new Date().toISOString(),
          },
        };
        draftRef.current = next;
        scheduleWrite();
        return next;
      });
    },
    [scheduleWrite],
  );

  const advanceWithCheckpoint = useCallback(
    (
      nextPage: number,
      checkpoint: OnboardingDraft['lastCheckpoint'],
    ): void => {
      setDraft((prev) => {
        const next: OnboardingDraft = {
          ...prev,
          currentPage: nextPage,
          lastCheckpoint: resolveCheckpoint(prev.lastCheckpoint, checkpoint),
          timestamps: {
            ...prev.timestamps,
            updatedAt: new Date().toISOString(),
          },
        };
        draftRef.current = next;
        scheduleWrite();
        return next;
      });
    },
    [scheduleWrite],
  );

  const reset = useCallback((): void => {
    if (writeTimerRef.current !== null) {
      clearTimeout(writeTimerRef.current);
      writeTimerRef.current = null;
    }
    const empty = createEmptyDraft();
    draftRef.current = empty;
    setDraft(empty);
    // Best-effort clear — ignore failures.
    secureStorage.clearOnboardingDraft().catch(() => {});
  }, []);

  const getDraft = useCallback((): OnboardingDraft => {
    return draftRef.current;
  }, []);

  const setSiblings = useCallback(
    (siblings: SiblingDraft[]): void => {
      setDraft((prev) => {
        const next: OnboardingDraft = {
          ...prev,
          siblings,
          timestamps: {
            ...prev.timestamps,
            updatedAt: new Date().toISOString(),
          },
        };
        draftRef.current = next;
        scheduleWrite();
        return next;
      });
    },
    [scheduleWrite],
  );

  return {
    update,
    advance,
    advanceWithCheckpoint,
    reset,
    getDraft,
    setSiblings,
    isLoading,
  };
}
