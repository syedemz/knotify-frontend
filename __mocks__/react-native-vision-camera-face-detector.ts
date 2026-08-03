/**
 * Jest manual mock for `react-native-vision-camera-face-detector`.
 *
 * Provides the minimum surface the app touches so unit tests can run in
 * Node.js without loading native code. Mirrors the exported types at the
 * pinned version (~1.10.2).
 *
 * Surface mocked:
 * - `Face` type (re-exported for callers that import the type)
 * - `useFaceDetector()` hook — returns a memoized `{ detectFaces, stopListeners }`
 *   pair. `detectFaces` is a `jest.fn` that returns an empty array by default.
 */

import type { Frame, CameraPosition } from 'react-native-vision-camera';

export interface Bounds {
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface Face {
  pitchAngle: number;
  rollAngle: number;
  yawAngle: number;
  bounds: Bounds;
  leftEyeOpenProbability: number;
  rightEyeOpenProbability: number;
  smilingProbability: number;
  trackingId?: number;
}

export interface FrameFaceDetectionOptions {
  performanceMode?: 'fast' | 'accurate';
  landmarkMode?: 'none' | 'all';
  contourMode?: 'none' | 'all';
  classificationMode?: 'none' | 'all';
  minFaceSize?: number;
  trackingEnabled?: boolean;
  cameraFacing?: CameraPosition;
  autoMode?: boolean;
  windowWidth?: number;
  windowHeight?: number;
}

/**
 * Shared `detectFaces` mock — exported so tests can override return values via
 * `(mockDetectFaces as jest.Mock).mockReturnValueOnce([...])`.
 */
export const mockDetectFaces = jest.fn<Face[], [Frame]>(() => []);

/**
 * Shared `stopListeners` mock.
 */
export const mockStopListeners = jest.fn<void, []>(() => undefined);

/**
 * Mock `useFaceDetector` hook. Returns the shared `{ detectFaces, stopListeners }`
 * pair so tests can inspect and override behavior across renders.
 */
export function useFaceDetector(_options?: FrameFaceDetectionOptions): {
  detectFaces: (frame: Frame) => Face[];
  stopListeners: () => void;
} {
  return { detectFaces: mockDetectFaces, stopListeners: mockStopListeners };
}
