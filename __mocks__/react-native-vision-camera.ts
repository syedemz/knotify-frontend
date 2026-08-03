/**
 * Jest manual mock for `react-native-vision-camera`.
 *
 * Provides the minimum surface the app touches so unit tests can run in
 * Node.js without loading native code. The mock mirrors the TypeScript
 * types exported by the real package at the pinned version (~4.7.3).
 *
 * Surface mocked:
 * - `Camera` component (renders null)
 * - `Camera.getCameraPermissionStatus()` — returns `'not-determined'` by default
 * - `Camera.requestCameraPermission()` — returns `'granted'` by default
 * - `useCameraDevice()` — returns `undefined` by default
 *
 * Test files override individual methods via `jest.spyOn` or by resetting
 * the mock implementations with `mockResolvedValueOnce` etc.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { View } from 'react-native';

export type CameraPermissionStatus =
  | 'granted'
  | 'not-determined'
  | 'denied'
  | 'restricted';

export type CameraPermissionRequestResult = 'granted' | 'denied';

/**
 * Minimal mock of the `Camera` component and its static permission API.
 */
export const Camera = Object.assign(
  function Camera(_props: Record<string, unknown>): React.ReactElement {
    return React.createElement(View, { testID: 'mock-camera' });
  },
  {
    getCameraPermissionStatus: jest.fn<CameraPermissionStatus, []>(() => 'not-determined'),
    requestCameraPermission: jest.fn<Promise<CameraPermissionRequestResult>, []>(
      () => Promise.resolve('granted'),
    ),
  },
);

/**
 * Minimal mock of `useCameraDevice`.
 *
 * Returns `undefined` by default (no physical camera in test environment).
 */
export const useCameraDevice = jest.fn<any, any[]>(() => undefined);

/**
 * Minimal mock of `useFrameProcessor`.
 *
 * Returns a no-op `ReadonlyFrameProcessor`-shaped object. Frame processing
 * does not execute in the test environment (no camera, no native runtime).
 */
export const useFrameProcessor = jest.fn<any, any[]>((fn: any) => ({
  frameProcessor: fn,
  type: 'readonly',
}));
