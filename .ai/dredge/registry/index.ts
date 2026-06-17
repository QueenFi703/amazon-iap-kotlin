/**
 * DREDGE registry — central index.
 *
 * Aggregates all category-specific patch lists and exposes a single
 * ordered array for the executor and the Quasimoto analyzer.
 */

import gradlePatches from "./gradle/index.js";
import kotlinPatches from "./kotlin/index.js";
import workflowPatches from "./workflow/index.js";
import type { Patch } from "../types.js";

/** All known patches, ordered: critical categories first. */
const registry: Patch[] = [
  ...gradlePatches,
  ...kotlinPatches,
  ...workflowPatches,
];

export default registry;
export { gradlePatches, kotlinPatches, workflowPatches };
