/**
 * Unit tests for useAutoCaptureController (story 11.2).
 *
 * Tests the pure state machine with synthetic event streams — no camera
 * hardware or React Native primitives required.
 *
 * AC coverage:
 * - After CONSECUTIVE_FRAMES_REQUIRED consecutive true events → shouldCapture === true
 * - A false event resets the counter
 * - Once shouldCapture is true, further events are no-ops until reset()
 * - reset() restores shouldCapture to false and allows re-capture
 */

import { act, renderHook } from '@testing-library/react-native';
import {
  useAutoCaptureController,
  CONSECUTIVE_FRAMES_REQUIRED,
} from '@/features/onboarding/hooks/useAutoCaptureController';

describe('useAutoCaptureController — initial state', () => {
  it('given freshly mounted, then shouldCapture is false', () => {
    const { result } = renderHook(() => useAutoCaptureController());
    expect(result.current.shouldCapture).toBe(false);
  });
});

describe('useAutoCaptureController — auto-capture threshold', () => {
  it(
    `given ${CONSECUTIVE_FRAMES_REQUIRED - 1} consecutive true frames, then shouldCapture is still false`,
    () => {
      const { result } = renderHook(() => useAutoCaptureController());

      act(() => {
        for (let i = 0; i < CONSECUTIVE_FRAMES_REQUIRED - 1; i++) {
          result.current.onFrame(true);
        }
      });

      expect(result.current.shouldCapture).toBe(false);
    },
  );

  it(
    `given exactly ${CONSECUTIVE_FRAMES_REQUIRED} consecutive true frames, then shouldCapture is true`,
    () => {
      const { result } = renderHook(() => useAutoCaptureController());

      act(() => {
        for (let i = 0; i < CONSECUTIVE_FRAMES_REQUIRED; i++) {
          result.current.onFrame(true);
        }
      });

      expect(result.current.shouldCapture).toBe(true);
    },
  );

  it(
    'given true frames interrupted by a false frame, then shouldCapture remains false',
    () => {
      const { result } = renderHook(() => useAutoCaptureController());

      act(() => {
        // Feed N-1 true frames, then a false, then N true frames — still below threshold
        for (let i = 0; i < CONSECUTIVE_FRAMES_REQUIRED - 1; i++) {
          result.current.onFrame(true);
        }
        result.current.onFrame(false);
        for (let i = 0; i < CONSECUTIVE_FRAMES_REQUIRED - 1; i++) {
          result.current.onFrame(true);
        }
      });

      expect(result.current.shouldCapture).toBe(false);
    },
  );

  it(
    'given a false frame resets the counter, then N true frames after false triggers capture',
    () => {
      const { result } = renderHook(() => useAutoCaptureController());

      act(() => {
        // N-1 true, then false (resets counter), then N true
        for (let i = 0; i < CONSECUTIVE_FRAMES_REQUIRED - 1; i++) {
          result.current.onFrame(true);
        }
        result.current.onFrame(false);
        for (let i = 0; i < CONSECUTIVE_FRAMES_REQUIRED; i++) {
          result.current.onFrame(true);
        }
      });

      expect(result.current.shouldCapture).toBe(true);
    },
  );
});

describe('useAutoCaptureController — post-capture behaviour', () => {
  it('given shouldCapture is true, when more true frames arrive, then shouldCapture stays true', () => {
    const { result } = renderHook(() => useAutoCaptureController());

    act(() => {
      for (let i = 0; i < CONSECUTIVE_FRAMES_REQUIRED; i++) {
        result.current.onFrame(true);
      }
    });

    expect(result.current.shouldCapture).toBe(true);

    act(() => {
      // Additional frames — should be no-ops
      result.current.onFrame(true);
      result.current.onFrame(false);
      result.current.onFrame(true);
    });

    expect(result.current.shouldCapture).toBe(true);
  });

  it('given shouldCapture is true, when false frames arrive, then shouldCapture stays true (no-op)', () => {
    const { result } = renderHook(() => useAutoCaptureController());

    act(() => {
      for (let i = 0; i < CONSECUTIVE_FRAMES_REQUIRED; i++) {
        result.current.onFrame(true);
      }
    });

    act(() => {
      result.current.onFrame(false);
    });

    expect(result.current.shouldCapture).toBe(true);
  });
});

describe('useAutoCaptureController — reset()', () => {
  it('given shouldCapture is true, when reset() is called, then shouldCapture is false', () => {
    const { result } = renderHook(() => useAutoCaptureController());

    act(() => {
      for (let i = 0; i < CONSECUTIVE_FRAMES_REQUIRED; i++) {
        result.current.onFrame(true);
      }
    });

    expect(result.current.shouldCapture).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.shouldCapture).toBe(false);
  });

  it('given reset() is called, then N more true frames triggers capture again', () => {
    const { result } = renderHook(() => useAutoCaptureController());

    act(() => {
      for (let i = 0; i < CONSECUTIVE_FRAMES_REQUIRED; i++) {
        result.current.onFrame(true);
      }
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.shouldCapture).toBe(false);

    act(() => {
      for (let i = 0; i < CONSECUTIVE_FRAMES_REQUIRED; i++) {
        result.current.onFrame(true);
      }
    });

    expect(result.current.shouldCapture).toBe(true);
  });
});
