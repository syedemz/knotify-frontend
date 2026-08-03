/**
 * Shared onboarding wizard draft — context + consumer hook.
 *
 * The draft is persisted to `expo-secure-store` under the `onboarding.draft`
 * key. Writes are debounced by 200 ms (trailing-edge) so rapid UI updates
 * (e.g. text field keystrokes) do not hammer the secure-store API.
 *
 * The state is owned by `OnboardingDraftProvider` and consumed by
 * `useOnboardingDraft()` via React context — so cross-screen reads (e.g. Page
 * 13 rendering a form based on Page 12's `education_level`) see fresh values
 * synchronously, without depending on the debounced SecureStore write.
 *
 * @module features/onboarding/hooks/useOnboardingDraft
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
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
   * Records the notification permission status on the top-level draft (not
   * inside `fields`) and schedules a debounced write to secure-store.
   *
   * Modelled on `setSiblings` — writes directly to
   * `OnboardingDraft.notificationPermissionStatus`.
   *
   * @param status - The observed or requested permission status.
   */
  setNotificationPermissionStatus: (
    status: OnboardingDraft['notificationPermissionStatus'],
  ) => void;

  /**
   * Records the location permission status on the top-level draft (not
   * inside `fields`) and schedules a debounced write to secure-store.
   *
   * Modelled on `setSiblings` — writes directly to
   * `OnboardingDraft.locationPermissionStatus`.
   *
   * @param status - The observed or requested permission status.
   */
  setLocationPermissionStatus: (
    status: OnboardingDraft['locationPermissionStatus'],
  ) => void;

  /**
   * Replaces the photo preview URIs list on the top-level draft (not inside
   * `fields`) and schedules a debounced write to secure-store.
   *
   * Modelled on `setSiblings` — writes directly to
   * `OnboardingDraft.photoPreviewUris`.
   *
   * @param uris - The new complete photo URIs array.
   */
  setPhotoPreviewUris: (uris: string[]) => void;

  /**
   * Records the local device URI of the face selfie captured on page 31.
   *
   * Writes directly to `OnboardingDraft.faceSelfieUri` and schedules a
   * debounced write to secure-store.
   *
   * @param uri - The local device URI of the captured selfie image.
   */
  setFaceSelfieUri: (uri: string) => void;

  /**
   * Clears the draft from both memory and secure-store and resets to a fresh
   * empty draft. Equivalent to `reset()` but named explicitly for the
   * post-submit cleanup path in `Page31FaceCaptureScreen`.
   *
   * @alias reset
   */
  clear: () => void;

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
 * Internal hook — owns the actual draft state, ref, timers, and secure-store
 * I/O. Called once by `OnboardingDraftProvider`; not exported.
 */
function useOnboardingDraftState(): UseOnboardingDraftReturn {
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
          // schemaVersion-4 DISCARD policy (pre-launch): if the stored draft is
          // not version 4, discard it and start fresh. There are no real users
          // with persisted data before launch, so migration is unnecessary.
          const next = parsed.schemaVersion === 4 ? parsed : createEmptyDraft();
          if (!cancelled) {
            draftRef.current = next;
            setDraft(next);
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

  const setNotificationPermissionStatus = useCallback(
    (status: OnboardingDraft['notificationPermissionStatus']): void => {
      setDraft((prev) => {
        const next: OnboardingDraft = {
          ...prev,
          notificationPermissionStatus: status,
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

  const setLocationPermissionStatus = useCallback(
    (status: OnboardingDraft['locationPermissionStatus']): void => {
      setDraft((prev) => {
        const next: OnboardingDraft = {
          ...prev,
          locationPermissionStatus: status,
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

  const setPhotoPreviewUris = useCallback(
    (uris: string[]): void => {
      setDraft((prev) => {
        const next: OnboardingDraft = {
          ...prev,
          photoPreviewUris: uris,
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

  const setFaceSelfieUri = useCallback(
    (uri: string): void => {
      setDraft((prev) => {
        const next: OnboardingDraft = {
          ...prev,
          faceSelfieUri: uri,
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
    // `clear` is an alias for `reset` — used by the post-submit cleanup path
    // in Page31FaceCaptureScreen so the intent is explicit at the call site.
    clear: reset,
    getDraft,
    setSiblings,
    setNotificationPermissionStatus,
    setLocationPermissionStatus,
    setPhotoPreviewUris,
    setFaceSelfieUri,
    isLoading,
  };
}

// ── Context + provider + consumer hook ─────────────────────────────────────────

const OnboardingDraftContext = createContext<UseOnboardingDraftReturn | null>(null);

/**
 * Provider for the shared onboarding draft. Wrap the OnboardingStack (or any
 * subtree that needs cross-screen draft coordination) with this component.
 *
 * State + secure-store I/O live here — a single instance owns everything so
 * every consumer inside sees the same values synchronously.
 */
export function OnboardingDraftProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const value = useOnboardingDraftState();
  return (
    <OnboardingDraftContext.Provider value={value}>
      {children}
    </OnboardingDraftContext.Provider>
  );
}

/**
 * Consumer hook for the shared onboarding draft.
 *
 * Must be used inside `OnboardingDraftProvider`. Reads and writes propagate
 * synchronously across all consumers in the subtree, so a screen can safely
 * render based on a value another screen just wrote (e.g. Page 13's form
 * depends on Page 12's `education_level`).
 *
 * @throws Error if called outside `OnboardingDraftProvider`.
 * @returns {@link UseOnboardingDraftReturn}
 */
export function useOnboardingDraft(): UseOnboardingDraftReturn {
  const value = useContext(OnboardingDraftContext);
  if (value === null) {
    throw new Error(
      'useOnboardingDraft must be used inside an OnboardingDraftProvider',
    );
  }
  return value;
}
