/**
 * Tests for src/features/onboarding/draftSchema.ts
 *
 * Verifies the shape and defaults of createEmptyDraft().
 */

import { createEmptyDraft } from '@/features/onboarding/draftSchema';

describe('createEmptyDraft', () => {
  it('returns a draft with schemaVersion 3', () => {
    const draft = createEmptyDraft();
    expect(draft.schemaVersion).toBe(3);
  });

  it('returns a draft with lastCheckpoint null', () => {
    const draft = createEmptyDraft();
    expect(draft.lastCheckpoint).toBeNull();
  });

  it('returns a draft with currentPage 1', () => {
    const draft = createEmptyDraft();
    expect(draft.currentPage).toBe(1);
  });

  it('returns a draft with empty fields', () => {
    const draft = createEmptyDraft();
    expect(draft.fields).toEqual({});
  });

  it('returns a draft with empty siblings array', () => {
    const draft = createEmptyDraft();
    expect(draft.siblings).toEqual([]);
  });

  it('returns a draft with empty photoPreviewUris array', () => {
    const draft = createEmptyDraft();
    expect(draft.photoPreviewUris).toEqual([]);
  });

  it('returns a draft with null permission statuses', () => {
    const draft = createEmptyDraft();
    expect(draft.notificationPermissionStatus).toBeNull();
    expect(draft.locationPermissionStatus).toBeNull();
  });

  it('returns a draft with phone_number null', () => {
    const draft = createEmptyDraft();
    expect(draft.phone_number).toBeNull();
  });

  it('returns a draft with createdAt and updatedAt ISO strings', () => {
    const before = Date.now();
    const draft = createEmptyDraft();
    const after = Date.now();

    const createdAt = new Date(draft.timestamps.createdAt).getTime();
    const updatedAt = new Date(draft.timestamps.updatedAt).getTime();

    expect(createdAt).toBeGreaterThanOrEqual(before);
    expect(createdAt).toBeLessThanOrEqual(after);
    expect(updatedAt).toBeGreaterThanOrEqual(before);
    expect(updatedAt).toBeLessThanOrEqual(after);
  });

  it('produces independent drafts on each call (no shared references)', () => {
    const draft1 = createEmptyDraft();
    const draft2 = createEmptyDraft();

    draft1.siblings.push({ name: 'Ali', age: 25, maritalStatus: null, gender: null, profession: null });

    expect(draft2.siblings).toHaveLength(0);
  });
});
