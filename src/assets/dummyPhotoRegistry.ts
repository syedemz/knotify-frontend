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
