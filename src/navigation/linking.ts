/**
 * Deep-link configuration for `NavigationContainer`.
 *
 * Phase 1 exports a valid empty linking config. The full route table is filled
 * by the chat and settings phases per §13.5 of the architecture.
 *
 * @module navigation/linking
 */

import type { LinkingOptions } from "@react-navigation/native";
import type { RootParamList } from "./types";

/**
 * Empty but structurally-valid linking configuration.
 *
 * `NavigationContainer` accepts this without throwing. Deep-link routes
 * are added incrementally by later phases as the corresponding screens
 * are implemented.
 *
 * @see {@link https://reactnavigation.org/docs/deep-linking/}
 */
export const linking: LinkingOptions<RootParamList> = {
  prefixes: [],
  config: {
    screens: {},
  },
};
