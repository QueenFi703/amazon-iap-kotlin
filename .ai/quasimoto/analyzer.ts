/**
 * Quasimoto — CI failure analyzer.
 *
 * Reads raw log text (typically the stdout/stderr of a failed Gradle or
 * Kotlin build) and returns the ordered list of patches that should be
 * applied to recover.
 */

import registry from "../dredge/registry/index.js";
import type { Patch, LogPattern } from "../dredge/types.js";

/**
 * Return `true` when every trigger in `triggers` matches somewhere in `log`.
 */
function allTriggersMatch(log: string, triggers: LogPattern[]): boolean {
  return triggers.every((trigger) => {
    if (trigger instanceof RegExp) {
      return trigger.test(log);
    }
    return log.includes(trigger);
  });
}

/**
 * Analyze a CI log string and return the patches (from the DREDGE registry)
 * whose triggers all match the log content.
 *
 * Patches are returned in registry order (critical-category patches first).
 */
export function analyze(log: string): Patch[] {
  const matches: Patch[] = [];

  for (const patch of registry) {
    if (allTriggersMatch(log, patch.triggers)) {
      console.info(
        `[Quasimoto] Matched patch: ${patch.id} (${patch.category}/${patch.severity})`,
      );
      matches.push(patch);
    }
  }

  if (matches.length === 0) {
    console.info("[Quasimoto] No matching patches found for this log.");
  }

  return matches;
}

/**
 * Read log content from a file path and delegate to `analyze`.
 */
export async function analyzeFile(logPath: string): Promise<Patch[]> {
  const { readFile } = await import("node:fs/promises");
  const log = await readFile(logPath, "utf8");
  return analyze(log);
}
