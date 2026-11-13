/**
 * Unit tests for `src/state/ownProfile/OwnProfileProvider.tsx`.
 *
 * Covers:
 * (a) Initial state when auth is unauthenticated — status 'idle', profile null.
 * (b) On auth transition to 'authenticated':
 *     - Hydrates from AsyncStorage cache synchronously (if present) → status 'ready'.
 *     - Fetches from the network and updates state + cache on success.
 * (c) Network fetch failure with cached profile → status stays 'ready'.
 * (d) Network fetch failure with no cached profile → status 'error'.
 * (e) signOut (auth transitions to 'unauthenticated') clears AsyncStorage + state.
 * (f) `refresh()` forces a network fetch.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react-native";

// ── AuthProvider mock — controllable status ──────────────────────────────────

const mockAuthState = {
  status: "unauthenticated" as "loading" | "unauthenticated" | "authenticated",
};

jest.mock("@/state/auth/AuthProvider", () => ({
  useAuth: () => ({
    status: mockAuthState.status,
    session: null,
    profileComplete: false,
    signIn: jest.fn(),
    signOut: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// ── profileApi mock ──────────────────────────────────────────────────────────

const mockGetMe = jest.fn();

jest.mock("@/services/api/endpoints", () => ({
  profileApi: {
    getMe: (...args: unknown[]) => mockGetMe(...args),
    updateMe: jest.fn(),
  },
}));

// ── AsyncStorage mock ────────────────────────────────────────────────────────

const mockStore: Record<string, string> = {};

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(async (key: string) => mockStore[key] ?? null),
  setItem: jest.fn(async (key: string, value: string) => {
    mockStore[key] = value;
  }),
  removeItem: jest.fn(async (key: string) => {
    delete mockStore[key];
  }),
  clear: jest.fn(async () => {
    for (const key of Object.keys(mockStore)) delete mockStore[key];
  }),
}));

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import { OwnProfileProvider, useOwnProfile } from "@/state/ownProfile/OwnProfileProvider";
import { OWN_PROFILE_STORAGE_KEY } from "@/features/profile/storage/ownProfileStorage";
import type { UserProfile } from "@/types/api/UserProfile";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    user_id: "u-123",
    email: "u@example.com",
    phone_number: null, username: null, first_name: "Emad", last_name: "Syed",
    sex: "Male", birthday: "2000-01-01", age: 25, religion: "Islam",
    subsect: null, religious_level: null, chosen_profile_avatar: null, photo_url: null,
    college_name: null, current_residence_city: null, current_residence_country: null,
    resident_country_code: null, district: null, education_level: null,
    employer_name: null, employment_type: null, family_residence_address: null,
    father_retired: null, fathers_job: null, fathers_name: null, graduation_year: null,
    has_children: null, higher_secondary: null, higher_secondary_passing_year: null,
    highest_degree: null, high_school: null, high_school_passing_year: null,
    job_title: null, marital_status: null, marriage_time: null, mother_retired: null,
    mothers_job: null, mothers_name: null, move_abroad: null, office_address: null,
    partners_religious_level: null, professional_category: null,
    profile_complete_verified: true, relation: null, salary_range: null,
    preferences: null,
    created_at: "2026-11-13T13:00:00.000Z", updated_at: "2026-11-13T13:00:00.000Z",
    deleted_at: null,
    ...overrides,
  };
}

// ── Wrapper ───────────────────────────────────────────────────────────────────

function makeWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(OwnProfileProvider, null, children);
  };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  for (const key of Object.keys(mockStore)) delete mockStore[key];
  mockAuthState.status = "unauthenticated";
});

// ── (a) Unauthenticated state ────────────────────────────────────────────────

describe("useOwnProfile — unauthenticated", () => {
  it("given auth unauthenticated at mount, then status is 'idle' and profile is null", async () => {
    const { result } = renderHook(() => useOwnProfile(), { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(result.current.status).toBe("idle");
    });
    expect(result.current.profile).toBeNull();
  });

  it("throws when called outside OwnProfileProvider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => renderHook(() => useOwnProfile())).toThrow(
      "useOwnProfile must be used within OwnProfileProvider",
    );
    consoleSpy.mockRestore();
  });
});

// ── (b) Authenticated + cache hydration + network fetch ──────────────────────

describe("useOwnProfile — authenticated lifecycle", () => {
  it("given a cached profile, then status flips to 'ready' with cached profile first", async () => {
    const cached = makeProfile({ first_name: "FromCache" });
    mockStore[OWN_PROFILE_STORAGE_KEY] = JSON.stringify(cached);
    mockAuthState.status = "authenticated";

    // Network returns a different (fresher) version to prove revalidation.
    const fresh = makeProfile({ first_name: "FromNetwork" });
    mockGetMe.mockResolvedValue(fresh);

    const { result } = renderHook(() => useOwnProfile(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.profile?.first_name).toBe("FromNetwork");
    });
    expect(result.current.status).toBe("ready");
  });

  it("given no cache, then calls getMe and ends with status 'ready'", async () => {
    mockAuthState.status = "authenticated";
    mockGetMe.mockResolvedValue(makeProfile({ first_name: "Fresh" }));

    const { result } = renderHook(() => useOwnProfile(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    expect(result.current.profile?.first_name).toBe("Fresh");
    expect(mockGetMe).toHaveBeenCalledTimes(1);
  });

  it("writes through to AsyncStorage after successful network fetch", async () => {
    mockAuthState.status = "authenticated";
    const fresh = makeProfile({ first_name: "Fresh" });
    mockGetMe.mockResolvedValue(fresh);

    renderHook(() => useOwnProfile(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(mockStore[OWN_PROFILE_STORAGE_KEY]).toBeDefined();
    });
    const parsed = JSON.parse(mockStore[OWN_PROFILE_STORAGE_KEY] as string) as UserProfile;
    expect(parsed.first_name).toBe("Fresh");
  });
});

// ── (c) Network failure with cache ───────────────────────────────────────────

describe("useOwnProfile — network failure with cache fallback", () => {
  it("given cache present and network throws, then status stays 'ready' (cache wins)", async () => {
    const cached = makeProfile({ first_name: "FromCache" });
    mockStore[OWN_PROFILE_STORAGE_KEY] = JSON.stringify(cached);
    mockAuthState.status = "authenticated";
    mockGetMe.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useOwnProfile(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.profile?.first_name).toBe("FromCache");
    });
    expect(result.current.status).toBe("ready");
    expect(result.current.error?.message).toBe("boom");
  });
});

// ── (d) Network failure without cache ────────────────────────────────────────

describe("useOwnProfile — network failure without cache", () => {
  it("given no cache and network throws, then status is 'error' and profile null", async () => {
    mockAuthState.status = "authenticated";
    mockGetMe.mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => useOwnProfile(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.profile).toBeNull();
    expect(result.current.error?.message).toBe("offline");
  });
});

// ── (f) refresh() forces a fetch ─────────────────────────────────────────────

describe("useOwnProfile — refresh()", () => {
  it("given a ready state, when refresh() is called, then getMe is re-invoked", async () => {
    mockAuthState.status = "authenticated";
    mockGetMe
      .mockResolvedValueOnce(makeProfile({ first_name: "First" }))
      .mockResolvedValueOnce(makeProfile({ first_name: "Second" }));

    const { result } = renderHook(() => useOwnProfile(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.profile?.first_name).toBe("First");
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockGetMe).toHaveBeenCalledTimes(2);
    expect(result.current.profile?.first_name).toBe("Second");
  });
});
