/**
 * Auto-capture state machine for face detection on page 31.
 *
 * Consumes a stream of `faceInsideOval: boolean` events and emits
 * `shouldCapture: boolean` after `CONSECUTIVE_FRAMES_REQUIRED` consecutive
 * `true` events. Once `shouldCapture` flips to `true`, it stays `true` until
 * `reset()` is called by the caller (e.g. after a capture is taken).
 *
 * This is a pure state machine — it is directly unit-testable with synthetic
 * event streams and requires no camera hardware.
 *
 * @module features/onboarding/hooks/useAutoCaptureController
 */

import { useCallback, useRef, useState } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Number of consecutive frames with `faceInsideOval === true` required before
 * the state machine signals capture. Configurable via this constant.
 */
export const CONSECUTIVE_FRAMES_REQUIRED = 15;

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * The value returned by {@link useAutoCaptureController}.
 */
export interface AutoCaptureController {
  /**
   * `true` when the state machine has accumulated enough consecutive
   * `faceInsideOval: true` events to trigger auto-capture.
   *
   * Stays `true` until `reset()` is called.
   */
  readonly shouldCapture: boolean;

  /**
   * Feed one frame event into the state machine.
   *
   * - When `faceInsideOval === true`, the consecutive-frame counter increments.
   *   Once it reaches {@link CONSECUTIVE_FRAMES_REQUIRED}, `shouldCapture` flips to `true`.
   * - When `faceInsideOval === false`, the counter resets to zero.
   * - Once `shouldCapture` is `true`, further events are no-ops until `reset()` is called.
   *
   * @param faceInsideOval - Whether a face was detected inside the oval in this frame.
   */
  readonly onFrame: (faceInsideOval: boolean) => void;

  /**
   * Resets the state machine — sets `shouldCapture` to `false` and clears the
   * consecutive-frame counter. Call this after a capture has been taken so the
   * user can retake the photo.
   */
  readonly reset: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Auto-capture state machine for face detection.
 *
 * Feed `faceInsideOval: boolean` events via `onFrame(faceInsideOval)`.
 * After {@link CONSECUTIVE_FRAMES_REQUIRED} consecutive `true` events,
 * `shouldCapture` becomes `true`. Call `reset()` after handling the capture
 * to allow the user to retake.
 *
 * @returns An {@link AutoCaptureController} instance.
 *
 * @example
 * ```tsx
 * const autoCapture = useAutoCaptureController();
 *
 * // In the frame processor:
 * autoCapture.onFrame(faces.length > 0 && isFaceInsideOval(faces[0]));
 *
 * // When shouldCapture becomes true:
 * if (autoCapture.shouldCapture) {
 *   await handleCapture();
 *   autoCapture.reset();
 * }
 * ```
 */
export function useAutoCaptureController(): AutoCaptureController {
  const [shouldCapture, setShouldCapture] = useState(false);

  // The consecutive-frame counter lives in a ref so incrementing it does not
  // trigger a re-render on every camera frame (~30 fps).
  const consecutiveCountRef = useRef(0);

  const onFrame = useCallback((faceInsideOval: boolean): void => {
    // Once the capture has been signalled, ignore further frames until reset.
    if (consecutiveCountRef.current >= CONSECUTIVE_FRAMES_REQUIRED) {
      return;
    }

    if (faceInsideOval) {
      consecutiveCountRef.current += 1;
      if (consecutiveCountRef.current >= CONSECUTIVE_FRAMES_REQUIRED) {
        setShouldCapture(true);
      }
    } else {
      consecutiveCountRef.current = 0;
    }
  }, []);

  const reset = useCallback((): void => {
    consecutiveCountRef.current = 0;
    setShouldCapture(false);
  }, []);

  return { shouldCapture, onFrame, reset };
}
