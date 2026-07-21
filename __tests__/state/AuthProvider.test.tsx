/**
 * Unit tests for src/state/auth/AuthProvider.tsx
 *
 * Acceptance criteria covered (story 1.8):
 * - silent-refresh happy path: status becomes 'authenticated', session populated.
 * - silent-refresh failure fallthrough: status becomes 'unauthenticated'.
 * - signOut clears the query cache (queryClient.clear() called after cognitoClient.signOut()).
 * - useAuth() throws when called outside AuthProvider.
 */

import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react-native";

// ── cognitoClient mock ─────────────────────────────────────────────────────

const mockRefreshSession = jest.fn();
const mockSignIn = jest.fn();
const mockSignOut = jest.fn<Promise<void>, []>(() => Promise.resolve());

jest.mock("@/services/auth/cognitoClient", () => ({
  cognitoClient: {
    refreshSession: (...args: unknown[]) => mockRefreshSession(...args),
    signIn: (...args: unknown[]) => mockSignIn(...args),
    signOut: (...args: unknown[]) => mockSignOut(...(args as [])),
  },
}));

// ── queryClient mock ───────────────────────────────────────────────────────

const mockQueryClientClear = jest.fn();

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );
  return {
    ...actual,
    useQueryClient: () => ({ clear: mockQueryClientClear }),
  };
});

// ── Import under test (after mocks) ───────────────────────────────────────

import { AuthProvider, useAuth } from "@/state/auth/AuthProvider";
import { QueryProvider } from "@/state/query/QueryProvider";
import type { SessionTokens } from "@/services/auth/cognitoClient";

// ── Fixtures ───────────────────────────────────────────────────────────────

const MOCK_TOKENS: SessionTokens = {
  accessToken: "access-token-abc",
  idToken: "id-token-xyz",
};

// ── Wrapper ────────────────────────────────────────────────────────────────

function makeWrapper() {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryProvider,
      null,
      React.createElement(AuthProvider, null, children),
    );
}

// ── Setup / teardown ───────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Outside provider ───────────────────────────────────────────────────────

describe("useAuth", () => {
  it("given no AuthProvider, when useAuth is called, then throws", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth must be used within AuthProvider",
    );
    consoleSpy.mockRestore();
  });
});

// ── Silent-refresh happy path ──────────────────────────────────────────────

describe("AuthProvider silent-refresh happy path", () => {
  beforeEach(() => {
    mockRefreshSession.mockResolvedValue(MOCK_TOKENS);
  });

  it("given a valid refresh token, when AuthProvider mounts, then status becomes 'authenticated'", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    // Initially loading.
    expect(result.current.status).toBe("loading");

    await waitFor(() => {
      expect(result.current.status).toBe("authenticated");
    });
  });

  it("given a valid refresh token, when AuthProvider mounts, then session is populated", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.session).toEqual(MOCK_TOKENS);
    });
  });

  it("given successful refresh, when profileComplete is read, then it is false (stub until phase 2)", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.status).toBe("authenticated");
    });

    expect(result.current.profileComplete).toBe(false);
  });
});

// ── Silent-refresh failure fallthrough ────────────────────────────────────

describe("AuthProvider silent-refresh failure fallthrough", () => {
  it("given refreshSession throws, when AuthProvider mounts, then status becomes 'unauthenticated'", async () => {
    mockRefreshSession.mockRejectedValue(new Error("Token expired"));

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.status).toBe("unauthenticated");
    });
  });

  it("given refreshSession returns null, when AuthProvider mounts, then status becomes 'unauthenticated'", async () => {
    mockRefreshSession.mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.status).toBe("unauthenticated");
    });
  });

  it("given refreshSession returns null, when AuthProvider mounts, then session is null", async () => {
    mockRefreshSession.mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.session).toBeNull();
    });
  });
});

// ── signOut clears the query cache ────────────────────────────────────────

describe("AuthProvider signOut", () => {
  it("given an authenticated session, when signOut is called, then cognitoClient.signOut is called before queryClient.clear", async () => {
    mockRefreshSession.mockResolvedValue(MOCK_TOKENS);

    const callOrder: string[] = [];
    mockSignOut.mockImplementation(async () => {
      callOrder.push("cognitoSignOut");
    });
    mockQueryClientClear.mockImplementation(() => {
      callOrder.push("queryClientClear");
    });

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.status).toBe("authenticated");
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(callOrder).toEqual(["cognitoSignOut", "queryClientClear"]);
  });

  it("given an authenticated session, when signOut is called, then status becomes 'unauthenticated'", async () => {
    mockRefreshSession.mockResolvedValue(MOCK_TOKENS);

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.status).toBe("authenticated");
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.status).toBe("unauthenticated");
  });

  it("given an authenticated session, when signOut is called, then queryClient.clear() is called once", async () => {
    mockRefreshSession.mockResolvedValue(MOCK_TOKENS);

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.status).toBe("authenticated");
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockQueryClientClear).toHaveBeenCalledTimes(1);
  });
});
