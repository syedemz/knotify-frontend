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
 *
 * The component forwards refs and exposes a stubbed `takePhoto` that resolves
 * to `{ path: 'mock/face-selfie-<ts>.jpg' }` — enough for callers that build
 * a `file://` URI and pass it through navigation.
 */
export const Camera = Object.assign(
  React.forwardRef(function Camera(
    props: Record<string, unknown>,
    ref: React.Ref<{ takePhoto: () => Promise<{ path: string }> }>,
  ): React.ReactElement {
    React.useImperativeHandle(
      ref,
      () => ({
        takePhoto: () => Promise.resolve({ path: `mock/face-selfie-${Date.now()}.jpg` }),
      }),
      [],
    );
    return React.createElement(View, { testID: (props.testID as string) ?? 'mock-camera' });
  }),
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
