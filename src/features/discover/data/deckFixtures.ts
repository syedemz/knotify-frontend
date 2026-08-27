/**
 * Phase-13 deck fixtures.
 *
 * `DECK_FIXTURES` is the ordered list of condensed profiles shown on the
 * Marriage-tab deck. Aisha (deckFemale1) is always first; she is imported
 * directly from `assets/dummyfemale.json` so there is a single source of
 * truth for her data — no copy lives in `assets/dummydeck/`.
 *
 * TODO(mock-only): replace DECK_FIXTURES with a real `useDeckQuery()` backed
 * by `GET /match/deck` when the backend deck endpoint ships (phase 15+).
 *
 * @module features/discover/data/deckFixtures
 */

import type { DummyDeckProfile } from '@/types/DummyDeckProfile';

// ── Fixture imports ───────────────────────────────────────────────────────────

// Aisha Khan — re-exported from the canonical dummyfemale.json fixture.
// Do NOT create a duplicate deckFemale1.json — this import IS deckFemale1.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const deckFemale1 = require('../../../../assets/dummyfemale.json') as DummyDeckProfile;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const deckFemale2 = require('../../../../assets/dummydeck/deckFemale2.json') as DummyDeckProfile;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const deckFemale3 = require('../../../../assets/dummydeck/deckFemale3.json') as DummyDeckProfile;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const deckFemale4 = require('../../../../assets/dummydeck/deckFemale4.json') as DummyDeckProfile;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const deckFemale5 = require('../../../../assets/dummydeck/deckFemale5.json') as DummyDeckProfile;

// ── Export ────────────────────────────────────────────────────────────────────

/**
 * Ordered array of deck-card profiles for the Marriage tab.
 *
 * - Index 0: Aisha Khan (re-imported from `assets/dummyfemale.json`).
 * - Index 1–4: Four new female profiles (distinct names, cities, employers,
 *   degrees, marriage timelines).
 *
 * All five fixtures use `Female3.png` or `Female4.png` for `photo_url` and
 * `photos[0]`, alternating across cards.
 */
export const DECK_FIXTURES: ReadonlyArray<DummyDeckProfile> = [
  deckFemale1,
  deckFemale2,
  deckFemale3,
  deckFemale4,
  deckFemale5,
];
