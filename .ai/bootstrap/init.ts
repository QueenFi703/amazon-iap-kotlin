/**
 * fi-core bootstrap — entry point.
 *
 * Called by the fi-core.yml workflow after a build failure is detected.
 * Delegates immediately to DOT's orchestration loop.
 */

import { run } from "../core/dot.js";

run().catch((err) => {
  console.error("[bootstrap] Unhandled error:", err);
  process.exitCode = 1;
});
