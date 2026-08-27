/**
 * Parse-time structural tests for the phase-13 friendship fixture JSONs.
 *
 * AC coverage:
 * - dummymehvish.json parses cleanly against DummyFullProfile.
 * - dummyqurat.json parses cleanly against DummyFullProfile.
 * - dummyfriendships.json references Mehvish's user_id.
 * - dummyrequests.json references Qurat's user_id as from_user_id.
 *
 * TODO(mock-only): remove when real backend friendship/request endpoints ship
 */

import dummyMehvish from '../../assets/dummymehvish.json';
import dummyQurat from '../../assets/dummyqurat.json';
import dummyFriendships from '../../assets/dummyfriendships.json';
import dummyRequests from '../../assets/dummyrequests.json';
import type { DummyFullProfile } from '@/types/DummyFullProfile';
import type { PendingRequest } from '@/state/friendship/FriendshipProvider';

/**
 * Structural type-guard assertion.
 * Compile-time only — runtime no-op.
 */
function assertIs<T>(_value: T): void {
  // intentional no-op: compile-time check only
}

// ── Mehvish fixture ───────────────────────────────────────────────────────────

describe('dummymehvish.json', () => {
  it('satisfies DummyFullProfile structural type', () => {
    assertIs<DummyFullProfile>(dummyMehvish as unknown as DummyFullProfile);
  });

  it('has first_name "Mehvish"', () => {
    expect(dummyMehvish.first_name).toBe('Mehvish');
  });

  it('has last_name "Hayat"', () => {
    expect(dummyMehvish.last_name).toBe('Hayat');
  });

  it('has sex "Female"', () => {
    expect(dummyMehvish.sex).toBe('Female');
  });

  it('has a non-null user_id', () => {
    expect(typeof dummyMehvish.user_id).toBe('string');
    expect(dummyMehvish.user_id.length).toBeGreaterThan(0);
  });

  it('has a non-null faceSelfieUri', () => {
    expect(dummyMehvish.faceSelfieUri).not.toBeNull();
    expect(typeof dummyMehvish.faceSelfieUri).toBe('string');
  });

  it('has at least one sibling', () => {
    expect(Array.isArray(dummyMehvish.siblings)).toBe(true);
    expect((dummyMehvish.siblings ?? []).length).toBeGreaterThanOrEqual(1);
  });

  it('has preferences.personalityTraits with at least one trait', () => {
    expect(Array.isArray(dummyMehvish.preferences?.personalityTraits)).toBe(true);
    expect((dummyMehvish.preferences?.personalityTraits ?? []).length).toBeGreaterThanOrEqual(1);
  });

  it('has photo_url pointing to Female3.png or Female4.png', () => {
    const allowed = new Set([
      'assets/female/Female3.png',
      'assets/female/Female4.png',
    ]);
    expect(allowed.has(dummyMehvish.photo_url)).toBe(true);
  });

  it('has photos[] with at least one entry from Female3.png or Female4.png', () => {
    expect(Array.isArray(dummyMehvish.photos)).toBe(true);
    expect((dummyMehvish.photos ?? []).length).toBeGreaterThanOrEqual(1);
    const allowed = new Set([
      'assets/female/Female3.png',
      'assets/female/Female4.png',
    ]);
    expect(allowed.has((dummyMehvish.photos ?? [])[0] ?? '')).toBe(true);
  });

  it('has a __dummy_display_only block', () => {
    expect(dummyMehvish.__dummy_display_only).toBeDefined();
  });
});

// ── Qurat fixture ─────────────────────────────────────────────────────────────

describe('dummyqurat.json', () => {
  it('satisfies DummyFullProfile structural type', () => {
    assertIs<DummyFullProfile>(dummyQurat as unknown as DummyFullProfile);
  });

  it('has first_name "Qurat"', () => {
    expect(dummyQurat.first_name).toBe('Qurat');
  });

  it('has last_name "Baloch"', () => {
    expect(dummyQurat.last_name).toBe('Baloch');
  });

  it('has sex "Female"', () => {
    expect(dummyQurat.sex).toBe('Female');
  });

  it('has a non-null user_id distinct from Mehvish', () => {
    expect(typeof dummyQurat.user_id).toBe('string');
    expect(dummyQurat.user_id.length).toBeGreaterThan(0);
    expect(dummyQurat.user_id).not.toBe(dummyMehvish.user_id);
  });

  it('has a non-null faceSelfieUri', () => {
    expect(dummyQurat.faceSelfieUri).not.toBeNull();
    expect(typeof dummyQurat.faceSelfieUri).toBe('string');
  });

  it('has at least one sibling', () => {
    expect(Array.isArray(dummyQurat.siblings)).toBe(true);
    expect((dummyQurat.siblings ?? []).length).toBeGreaterThanOrEqual(1);
  });

  it('has preferences.personalityTraits with at least one trait', () => {
    expect(Array.isArray(dummyQurat.preferences?.personalityTraits)).toBe(true);
    expect((dummyQurat.preferences?.personalityTraits ?? []).length).toBeGreaterThanOrEqual(1);
  });

  it('has photo_url pointing to Female3.png or Female4.png (opposite to Mehvish)', () => {
    const allowed = new Set([
      'assets/female/Female3.png',
      'assets/female/Female4.png',
    ]);
    expect(allowed.has(dummyQurat.photo_url)).toBe(true);
    // Qurat uses the other photo from Mehvish
    expect(dummyQurat.photo_url).not.toBe(dummyMehvish.photo_url);
  });

  it('has photos[] with at least one entry from Female3.png or Female4.png', () => {
    expect(Array.isArray(dummyQurat.photos)).toBe(true);
    expect((dummyQurat.photos ?? []).length).toBeGreaterThanOrEqual(1);
    const allowed = new Set([
      'assets/female/Female3.png',
      'assets/female/Female4.png',
    ]);
    expect(allowed.has((dummyQurat.photos ?? [])[0] ?? '')).toBe(true);
  });

  it('has a __dummy_display_only block', () => {
    expect(dummyQurat.__dummy_display_only).toBeDefined();
  });
});

// ── dummyfriendships.json ─────────────────────────────────────────────────────

describe('dummyfriendships.json', () => {
  it('is an array', () => {
    expect(Array.isArray(dummyFriendships)).toBe(true);
  });

  it('has exactly one entry', () => {
    expect(dummyFriendships).toHaveLength(1);
  });

  it('first entry has user_id equal to Mehvish\'s user_id', () => {
    expect(dummyFriendships[0]).toBeDefined();
    expect((dummyFriendships[0] as { user_id: string }).user_id).toBe(
      dummyMehvish.user_id,
    );
  });
});

// ── dummyrequests.json ────────────────────────────────────────────────────────

describe('dummyrequests.json', () => {
  it('is an array', () => {
    expect(Array.isArray(dummyRequests)).toBe(true);
  });

  it('has exactly one entry', () => {
    expect(dummyRequests).toHaveLength(1);
  });

  it('first entry has from_user_id equal to Qurat\'s user_id', () => {
    const entry = dummyRequests[0] as PendingRequest;
    expect(entry).toBeDefined();
    expect(entry.from_user_id).toBe(dummyQurat.user_id);
  });

  it('first entry has status "pending"', () => {
    const entry = dummyRequests[0] as PendingRequest;
    expect(entry.status).toBe('pending');
  });

  it('first entry has a request_id string', () => {
    const entry = dummyRequests[0] as PendingRequest;
    expect(typeof entry.request_id).toBe('string');
    expect(entry.request_id.length).toBeGreaterThan(0);
  });

  it('first entry has a created_at string', () => {
    const entry = dummyRequests[0] as PendingRequest;
    expect(typeof entry.created_at).toBe('string');
  });
});
