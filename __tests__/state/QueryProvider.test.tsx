/**
 * Unit tests for src/state/query/QueryProvider.tsx
 *
 * Covers:
 * - `createQueryClient()` returns a client with the §7.3 defaults.
 * - `QueryProvider` mounts and exposes the client via `useQueryClient()`.
 * - `clientOverride` prop is used when provided.
 */

import React from "react";
import { renderHook } from "@testing-library/react-native";
import { useQueryClient, QueryClient } from "@tanstack/react-query";

import { QueryProvider, createQueryClient } from "@/state/query/QueryProvider";

// ── createQueryClient ──────────────────────────────────────────────────────

describe("createQueryClient", () => {
  it("given no arguments, when creating a client, then it has staleTime of 5 minutes", () => {
    const client = createQueryClient();
    const options = client.getDefaultOptions();
    expect(options.queries?.staleTime).toBe(5 * 60 * 1000);
  });

  it("given no arguments, when creating a client, then queries retry count is 2", () => {
    const client = createQueryClient();
    const options = client.getDefaultOptions();
    expect(options.queries?.retry).toBe(2);
  });

  it("given no arguments, when creating a client, then gcTime is 10 minutes", () => {
    const client = createQueryClient();
    const options = client.getDefaultOptions();
    expect(options.queries?.gcTime).toBe(10 * 60 * 1000);
  });

  it("given no arguments, when creating a client, then mutation retry is 0", () => {
    const client = createQueryClient();
    const options = client.getDefaultOptions();
    expect(options.mutations?.retry).toBe(0);
  });
});

// ── QueryProvider ──────────────────────────────────────────────────────────

describe("QueryProvider", () => {
  it("given a QueryProvider wrapper, when useQueryClient() is called, then it returns a QueryClient", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryProvider, null, children);
    const { result } = renderHook(() => useQueryClient(), { wrapper });
    expect(result.current).toBeInstanceOf(QueryClient);
  });

  it("given a clientOverride, when QueryProvider mounts, then useQueryClient returns the override", () => {
    const override = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryProvider, { clientOverride: override }, children);
    const { result } = renderHook(() => useQueryClient(), { wrapper });
    expect(result.current).toBe(override);
  });

  it("given two renders of QueryProvider, when checking client identity, then the same instance is returned", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryProvider, null, children);
    const { result, rerender } = renderHook(() => useQueryClient(), { wrapper });
    const firstClient = result.current;
    rerender({});
    expect(result.current).toBe(firstClient);
  });
});
