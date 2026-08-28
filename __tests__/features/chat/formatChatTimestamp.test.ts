/**
 * Unit tests for `src/features/chat/formatChatTimestamp.ts`.
 *
 * All timestamps are expressed relative to a fixed `now` value so tests are
 * fully deterministic regardless of when they run. No time-travel mocking
 * is required — the helper accepts `now` as an explicit parameter.
 *
 * Test plan:
 * (a) Today — returns HH:mm in 24-hour zero-padded format.
 * (b) Yesterday — returns "Yesterday".
 * (c) Two days ago (older) — returns "MMM D" (e.g. "Aug 22").
 * (d) Midnight boundary — a message at 00:00:00 on today still returns "HH:mm".
 * (e) Midnight boundary — a message at 23:59:59 yesterday returns "Yesterday".
 * (f) A message 365 days ago returns "MMM D" with the correct month.
 * (g) HH:mm pads single-digit hours and minutes with a leading zero.
 */

import { formatChatTimestamp } from '@/features/chat/formatChatTimestamp';

// ── Fixed anchor ────────────────────────────────────────────────────────────
//
// Anchor: 2026-08-27 14:30:00 local time.
// We construct it from Date() parts so local-timezone offsets are respected.

/** Returns a Date for a given set of local calendar parts. */
function localDate(year: number, month: number, day: number, h = 0, m = 0, s = 0): Date {
  return new Date(year, month - 1, day, h, m, s, 0);
}

const NOW = localDate(2026, 8, 27, 14, 30, 0).getTime(); // 2026-08-27 14:30:00

// ── Tests ───────────────────────────────────────────────────────────────────

describe('formatChatTimestamp', () => {
  // (a) Same calendar day — returns HH:mm
  it(
    'given a timestamp earlier today, when formatChatTimestamp is called, then it returns HH:mm',
    () => {
      const ts = localDate(2026, 8, 27, 9, 5, 0).getTime();
      expect(formatChatTimestamp(ts, NOW)).toBe('09:05');
    },
  );

  // (a2) Same day, afternoon
  it(
    'given a timestamp from this afternoon, when formatChatTimestamp is called, then it returns HH:mm for afternoon time',
    () => {
      const ts = localDate(2026, 8, 27, 14, 22, 0).getTime();
      expect(formatChatTimestamp(ts, NOW)).toBe('14:22');
    },
  );

  // (b) Yesterday — returns "Yesterday"
  it(
    'given a timestamp from yesterday, when formatChatTimestamp is called, then it returns "Yesterday"',
    () => {
      const ts = localDate(2026, 8, 26, 18, 0, 0).getTime();
      expect(formatChatTimestamp(ts, NOW)).toBe('Yesterday');
    },
  );

  // (c) Two days ago — returns MMM D
  it(
    'given a timestamp from two days ago, when formatChatTimestamp is called, then it returns "Aug 25"',
    () => {
      const ts = localDate(2026, 8, 25, 10, 0, 0).getTime();
      expect(formatChatTimestamp(ts, NOW)).toBe('Aug 25');
    },
  );

  // (d) Midnight boundary — 00:00:00 on today is still today
  it(
    'given a timestamp at exactly midnight today (00:00:00), when formatChatTimestamp is called, then it returns "00:00"',
    () => {
      const ts = localDate(2026, 8, 27, 0, 0, 0).getTime();
      expect(formatChatTimestamp(ts, NOW)).toBe('00:00');
    },
  );

  // (e) Midnight boundary — 23:59:59 yesterday is still yesterday
  it(
    'given a timestamp at 23:59:59 yesterday, when formatChatTimestamp is called, then it returns "Yesterday"',
    () => {
      const ts = localDate(2026, 8, 26, 23, 59, 59).getTime();
      expect(formatChatTimestamp(ts, NOW)).toBe('Yesterday');
    },
  );

  // (f) 365 days ago — older, returns MMM D
  it(
    'given a timestamp 365 days ago (2025-08-27), when formatChatTimestamp is called, then it returns "Aug 27"',
    () => {
      const ts = localDate(2025, 8, 27, 12, 0, 0).getTime();
      expect(formatChatTimestamp(ts, NOW)).toBe('Aug 27');
    },
  );

  // (g) Zero-padding: single-digit hour + minute
  it(
    'given a timestamp with single-digit hour and minute (09:05), when formatChatTimestamp is called, then it zero-pads both',
    () => {
      const ts = localDate(2026, 8, 27, 9, 5, 0).getTime();
      const result = formatChatTimestamp(ts, NOW);
      expect(result).toBe('09:05');
      // Explicit character-level assertion: hour must be 2 chars, separator, minute 2 chars
      const parts = result.split(':');
      expect(parts).toHaveLength(2);
      expect(parts[0]).toHaveLength(2);
      expect(parts[1]).toHaveLength(2);
    },
  );

  // Different month — MMM abbreviation
  it(
    'given a timestamp in December of the prior year, when formatChatTimestamp is called, then it returns "Dec 15"',
    () => {
      const ts = localDate(2025, 12, 15, 9, 0, 0).getTime();
      expect(formatChatTimestamp(ts, NOW)).toBe('Dec 15');
    },
  );

  // January — MMM abbreviation
  it(
    'given a timestamp in January, when formatChatTimestamp is called, then it returns "Jan D"',
    () => {
      const ts = localDate(2026, 1, 3, 8, 0, 0).getTime();
      expect(formatChatTimestamp(ts, NOW)).toBe('Jan 3');
    },
  );
});
