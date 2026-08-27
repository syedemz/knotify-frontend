/**
 * Pure timestamp formatting helper for the chat list.
 *
 * Rules:
 * - If the timestamp falls on today's calendar date → `"HH:mm"` (24-hour, zero-padded).
 * - If the timestamp falls on yesterday's calendar date → `"Yesterday"`.
 * - Otherwise → `"MMM D"` (e.g. `"Aug 24"`).
 *
 * "Today" and "yesterday" are evaluated relative to the provided `now`
 * parameter (defaults to `Date.now()`), enabling deterministic unit tests
 * without time-travel mocking.
 *
 * **No external dependencies.** Uses only `Date` primitives — `date-fns` and
 * `luxon` are intentionally excluded to avoid dependency creep for a mock phase.
 *
 * @module features/chat/formatChatTimestamp
 */

/** Short month names used by the "MMM D" format branch. */
const MONTH_SHORT: readonly string[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Returns a string representation of the date midnight (00:00:00.000) for the
 * given unix-millisecond timestamp, in the **local** timezone. This produces
 * a comparable integer for "is this the same calendar day?" checks.
 *
 * Using midnight-in-locale means the boundary shifts at midnight local time,
 * which is the intuitive user expectation on a mobile device.
 */
function localMidnightMs(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Formats a unix-millisecond chat message timestamp for display in the chat
 * list row's trailing timestamp column.
 *
 * @param timestampMs - Unix timestamp in milliseconds (e.g. `message.timestamp`).
 * @param now         - Current time in milliseconds. Defaults to `Date.now()`.
 *                      Override in tests for deterministic output.
 * @returns A short human-readable string following the rules documented above.
 *
 * @example
 * ```ts
 * formatChatTimestamp(Date.now() - 300_000);         // "14:22" (today)
 * formatChatTimestamp(Date.now() - 86_400_000);      // "Yesterday" (approx)
 * formatChatTimestamp(Date.now() - 5 * 86_400_000);  // "Aug 22"
 * ```
 */
export function formatChatTimestamp(
  timestampMs: number,
  now: number = Date.now(),
): string {
  const todayMidnight = localMidnightMs(now);
  const yesterdayMidnight = todayMidnight - 86_400_000; // exactly 24 h
  const msgMidnight = localMidnightMs(timestampMs);

  if (msgMidnight === todayMidnight) {
    // Same calendar day — show HH:mm
    const d = new Date(timestampMs);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  if (msgMidnight === yesterdayMidnight) {
    return 'Yesterday';
  }

  // Older — show "MMM D"
  const d = new Date(timestampMs);
  const monthName = MONTH_SHORT[d.getMonth()] ?? '';
  const day = d.getDate();
  return `${monthName} ${day}`;
}
