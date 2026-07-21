import type en from "./labels.en.json";

/**
 * Recursive helper that converts a nested object type into a union of
 * dot-separated path strings down to every leaf (string) value.
 *
 * Given `{ a: { b: string; c: string }; d: string }` it produces
 * `'a.b' | 'a.c' | 'd'`.
 *
 * Only string leaves are included — object nodes are not valid keys.
 */
type Paths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : T[K] extends Record<string, unknown>
    ? Paths<T[K], `${Prefix}${K}.`>
    : never;
}[keyof T & string];

/**
 * Union of every valid label key derived from `labels.en.json`.
 *
 * Passing a key that does not exist in `labels.en.json` to `t()` is a
 * compile-time error. The type is derived automatically — no manual
 * maintenance required.
 *
 * @example
 * ```ts
 * const key: LabelKey = 'common.loading';   // OK
 * const bad: LabelKey = 'common.missing';   // TS error
 * ```
 */
export type LabelKey = Paths<typeof en>;
