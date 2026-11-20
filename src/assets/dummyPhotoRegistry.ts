/**
 * Dummy-photo registry.
 *
 * Metro's asset resolver only wires up `require('...')` when the argument
 * is a **literal string** evaluated at module scope. Dummy profile JSON
 * (`assets/dummy*.json`) stores photos as string paths like
 * `"assets/female/Female3.png"`, which cannot be handed straight to
 * `require()` at runtime — the bundler would not have packaged the asset.
 *
 * This module bridges the gap: for every path referenced by a dummy
 * profile, we register a literal `require()` call here, and downstream
 * consumers look up the opaque module handle by string key.
 *
 * When a new dummy photo asset is added under `assets/male/` or
 * `assets/female/`, extend the {@link REGISTRY} map with a matching
 * `require()` entry.
 *
 * @module assets/dummyPhotoRegistry
 */

/**
 * Path → RN asset module handle. The values are the opaque numeric handles
 * returned by Metro's `require()` call for static image assets.
 */
const REGISTRY: Record<string, number> = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  'assets/male/Male1.png': require('../../assets/male/Male1.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  'assets/female/Female3.png': require('../../assets/female/Female3.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  'assets/female/Female4.png': require('../../assets/female/Female4.png'),
};

/**
 * Resolves a dummy-profile photo path to an `<Image source>`-compatible
 * value.
 *
 * - If `path` is registered, returns the numeric module handle (usable as
 *   `<Image source={handle}>`).
 * - If `path` is a network URL (starts with `http://` or `https://`), returns
 *   `{ uri: path }` so real remote profiles continue to work once phase 12's
 *   mock pipeline is torn down.
 * - Otherwise returns `undefined` so callers can fall through to a
 *   placeholder.
 */
export function resolveDummyPhoto(
  path: string | null | undefined,
): number | { uri: string } | undefined {
  if (path == null || path === '') {
    return undefined;
  }
  const handle = REGISTRY[path];
  if (handle !== undefined) {
    return handle;
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return { uri: path };
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Gender-based placeholder photos
//
// Real photo upload is not yet wired (deferred to a later phase). Until then,
// every user profile displayed in the UI — deck candidates, profile view,
// chat thumbnails / headers, self profile — needs a photo to render. Rather
// than show a blank circle when `photo_url` is null, each profile falls back
// to a gender-appropriate placeholder image: `Male1.png` for male users,
// `Female3.png` for female users.
//
// The two placeholders are the same assets already registered in REGISTRY
// above for the dummy-profile fixtures — reusing the same `require()`
// handles avoids duplicate bundling.
// ---------------------------------------------------------------------------

/**
 * Normalised sex values accepted by {@link resolveGenderPlaceholder} and
 * {@link resolvePhotoOrGenderPlaceholder}. Matches the enum on
 * `UserProfile.sex` and `DummyDeckProfile.sex`.
 */
export type Sex = 'Male' | 'Female';

/**
 * Returns the gender-appropriate placeholder image handle, or `undefined`
 * when `sex` is null / unknown.
 *
 * - `'Male'` → `assets/male/Male1.png`
 * - `'Female'` → `assets/female/Female3.png`
 * - `null` / `undefined` → `undefined` (caller decides fallback)
 */
export function resolveGenderPlaceholder(
  sex: Sex | null | undefined,
): number | undefined {
  if (sex === 'Male') return REGISTRY['assets/male/Male1.png'];
  if (sex === 'Female') return REGISTRY['assets/female/Female3.png'];
  return undefined;
}

/**
 * Convenience wrapper: resolve `path` through {@link resolveDummyPhoto} and,
 * on miss, fall back to {@link resolveGenderPlaceholder}.
 *
 * Returns `undefined` only when both paths fail — real callers should always
 * pass a known `sex` so they never see the undefined branch until real photo
 * upload lands and `sex` becomes optional.
 */
export function resolvePhotoOrGenderPlaceholder(
  path: string | null | undefined,
  sex: Sex | null | undefined,
): number | { uri: string } | undefined {
  const photo = resolveDummyPhoto(path);
  if (photo !== undefined) return photo;
  return resolveGenderPlaceholder(sex);
}
