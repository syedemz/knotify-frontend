/**
 * Tests for OnboardingCompletionProvider and useOnboardingCompletion (story 11.2).
 *
 * AC coverage:
 * (a) loading starts true, flips to false once the secure-store read resolves.
 * (b) complete is false when key is absent or not "true".
 * (c) complete is true when key equals "true".
 * (d) markComplete() writes "true" to secure-store AND flips complete to true atomically.
 * (e) reset() deletes the key AND flips complete back to false.
 * (f) Resilience: if secure-store read throws, loading flips to false and complete stays false.
 * (g) Runtime sanity warning fires when complete===true AND status==='unauthenticated', NOT on 'loading'.
 *
 * TODO(mock-only): remove when real backend + JWT claim decode ship
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── expo-secure-store mock ────────────────────────────────────────────────────

const mockGetItemAsync = jest.fn<Promise<string | null>, [string]>();
const mockSetItemAsync = jest.fn<Promise<void>, [string, string]>();
const mockDeleteItemAsync = jest.fn<Promise<void>, [string]>();

jest.mock('expo-secure-store', () => ({
  getItemAsync: (key: string) => mockGetItemAsync(key),
  setItemAsync: (key: string, value: string) => mockSetItemAsync(key, value),
  deleteItemAsync: (key: string) => mockDeleteItemAsync(key),
}));

// ── AuthProvider mock ─────────────────────────────────────────────────────────

const mockAuthStatus: { status: 'loading' | 'authenticated' | 'unauthenticated' } = {
  status: 'unauthenticated',
};

jest.mock('@/state/auth/AuthProvider', () => ({
  useAuth: () => ({
    status: mockAuthStatus.status,
    profileComplete: false,
    session: null,
    signIn: jest.fn(),
    signOut: jest.fn(),
    refresh: jest.fn(),
  }),
}));

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Imports under test ────────────────────────────────────────────────────────

import {
  OnboardingCompletionProvider,
  useOnboardingCompletion,
} from '@/state/onboardingCompletion/OnboardingCompletionProvider';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderCompletionHook() {
  return renderHook(() => useOnboardingCompletion(), {
    wrapper: OnboardingCompletionProvider,
  });
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthStatus.status = 'unauthenticated';
  // Default: no flag set.
  mockGetItemAsync.mockResolvedValue(null);
  mockSetItemAsync.mockResolvedValue(undefined);
  mockDeleteItemAsync.mockResolvedValue(undefined);
});

// ── AC (a): loading transitions ───────────────────────────────────────────────

describe('OnboardingCompletionProvider — AC (a): loading state', () => {
  it('given provider mounts, then loading starts as true', () => {
    let resolveGet!: (v: string | null) => void;
    mockGetItemAsync.mockReturnValue(
      new Promise<string | null>((res) => {
        resolveGet = res;
      }),
    );

    const { result } = renderHook(() => useOnboardingCompletion(), {
      wrapper: OnboardingCompletionProvider,
    });

    expect(result.current.loading).toBe(true);

    // Resolve to prevent open handles.
    act(() => {
      resolveGet(null);
    });
  });

  it('given secure-store resolves, then loading flips to false', async () => {
    mockGetItemAsync.mockResolvedValue(null);

    const { result } = renderCompletionHook();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});

// ── AC (b): complete is false when key absent ─────────────────────────────────

describe('OnboardingCompletionProvider — AC (b): complete is false when key absent', () => {
  it('given null from secure-store, then complete is false', async () => {
    mockGetItemAsync.mockResolvedValue(null);

    const { result } = renderCompletionHook();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.complete).toBe(false);
  });

  it('given "false" from secure-store, then complete is false', async () => {
    mockGetItemAsync.mockResolvedValue('false');

    const { result } = renderCompletionHook();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.complete).toBe(false);
  });
});

// ── AC (c): complete is true when key === "true" ──────────────────────────────

describe('OnboardingCompletionProvider — AC (c): complete is true when key is "true"', () => {
  it('given "true" from secure-store, then complete is true', async () => {
    mockGetItemAsync.mockResolvedValue('true');

    const { result } = renderCompletionHook();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.complete).toBe(true);
  });
});

// ── AC (d): markComplete() owns both writes ───────────────────────────────────

describe('OnboardingCompletionProvider — AC (d): markComplete() owns both writes', () => {
  it('given markComplete() is called, then secure-store is written with "true"', async () => {
    mockGetItemAsync.mockResolvedValue(null);

    const { result } = renderCompletionHook();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.markComplete();
    });

    expect(mockSetItemAsync).toHaveBeenCalledWith(
      'dummy.onboarding.complete',
      'true',
    );
  });

  it('given markComplete() is called, then complete flips to true in-memory', async () => {
    mockGetItemAsync.mockResolvedValue(null);

    const { result } = renderCompletionHook();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.complete).toBe(false);

    await act(async () => {
      await result.current.markComplete();
    });

    expect(result.current.complete).toBe(true);
  });
});

// ── AC (e): reset() clears both ──────────────────────────────────────────────

describe('OnboardingCompletionProvider — AC (e): reset() clears both', () => {
  it('given complete is true, when reset() is called, then secure-store key is deleted', async () => {
    mockGetItemAsync.mockResolvedValue('true');

    const { result } = renderCompletionHook();

    await waitFor(() => {
      expect(result.current.complete).toBe(true);
    });

    await act(async () => {
      await result.current.reset();
    });

    expect(mockDeleteItemAsync).toHaveBeenCalledWith('dummy.onboarding.complete');
  });

  it('given complete is true, when reset() is called, then complete is false in-memory', async () => {
    mockGetItemAsync.mockResolvedValue('true');

    const { result } = renderCompletionHook();

    await waitFor(() => {
      expect(result.current.complete).toBe(true);
    });

    await act(async () => {
      await result.current.reset();
    });

    expect(result.current.complete).toBe(false);
  });
});

// ── AC (f): resilience on secure-store read error ─────────────────────────────

describe('OnboardingCompletionProvider — AC (f): secure-store read error resilience', () => {
  it('given secure-store read throws, then loading flips to false', async () => {
    mockGetItemAsync.mockRejectedValue(new Error('SecureStore unavailable'));

    const { result } = renderCompletionHook();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('given secure-store read throws, then complete defaults to false', async () => {
    mockGetItemAsync.mockRejectedValue(new Error('SecureStore unavailable'));

    const { result } = renderCompletionHook();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.complete).toBe(false);
  });
});

// ── AC (g): runtime sanity warning ───────────────────────────────────────────

describe('OnboardingCompletionProvider — AC (g): runtime sanity warning', () => {
  let consolWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consolWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consolWarnSpy.mockRestore();
  });

  it(
    'given complete===true and status===unauthenticated, then console.warn is called',
    async () => {
      mockGetItemAsync.mockResolvedValue('true');
      mockAuthStatus.status = 'unauthenticated';

      renderCompletionHook();

      await waitFor(() => {
        expect(consolWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('[mock-only]'),
        );
      });
    },
  );

  it(
    'given complete===true and status===loading (transient cold-launch state), then console.warn is NOT called',
    async () => {
      mockGetItemAsync.mockResolvedValue('true');
      mockAuthStatus.status = 'loading';

      renderCompletionHook();

      // Wait a tick for effects to settle.
      await act(async () => {
        await Promise.resolve();
      });

      expect(consolWarnSpy).not.toHaveBeenCalled();
    },
  );

  it(
    'given complete===false and status===unauthenticated, then console.warn is NOT called',
    async () => {
      mockGetItemAsync.mockResolvedValue(null);
      mockAuthStatus.status = 'unauthenticated';

      renderCompletionHook();

      await act(async () => {
        await Promise.resolve();
      });

      expect(consolWarnSpy).not.toHaveBeenCalled();
    },
  );
});
