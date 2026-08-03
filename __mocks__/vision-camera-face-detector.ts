/**
 * Jest manual mock for `vision-camera-face-detector`.
 *
 * Provides the minimum surface the app touches so unit tests can run in
 * Node.js without loading native code. The mock mirrors the TypeScript
 * types exported by the real package at the pinned version (~0.1.8).
 *
 * Surface mocked:
 * - `Face` type (re-exported for callers that import the type)
 * - `scanFaces()` — returns an empty array by default
 */

import type { Frame } from 'react-native-vision-camera';

export interface Face {
  leftEyeOpenProbability: number;
  rollAngle: number;
  pitchAngle: number;
  yawAngle: number;
  rightEyeOpenProbability: number;
  smilingProbability: number;
  bounds: {
    y: number;
    x: number;
    height: number;
    width: number;
  };
  contours: Record<string, { x: number; y: number }[]>;
}

/**
 * Minimal mock of `scanFaces`.
 *
 * Returns an empty array by default (no faces detected in test environment).
 * Tests that exercise face-detection logic should override via
 * `(scanFaces as jest.Mock).mockReturnValueOnce([...])`.
 */
export const scanFaces = jest.fn<Face[], [Frame]>(() => []);
