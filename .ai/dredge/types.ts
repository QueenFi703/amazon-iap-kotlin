/**
 * DREDGE — type definitions for the patch engine.
 *
 * A Patch describes a single, targeted fix that can be applied when a
 * specific failure pattern is detected in a CI run.
 */

export type PatchCategory = "gradle" | "kotlin" | "workflow";

export type PatchSeverity = "critical" | "high" | "medium" | "low";

/** A regex or plain-string fragment matched against raw CI log lines. */
export type LogPattern = string | RegExp;

/** File-level mutation produced by a patch. */
export interface FileMutation {
  /** Repo-root-relative file path to modify. */
  path: string;
  /** Pattern to search for in the file. */
  search: string | RegExp;
  /** Replacement string (supports $1 back-references when search is RegExp). */
  replace: string;
  /** Human-readable description of the mutation. */
  description: string;
}

/** A single, self-contained fix recipe. */
export interface Patch {
  /** Unique, stable identifier for this patch. */
  id: string;
  /** Short human-readable title. */
  title: string;
  /** Category of the underlying failure. */
  category: PatchCategory;
  /** How urgent the fix is. */
  severity: PatchSeverity;
  /** Log patterns that must ALL match for the patch to apply. */
  triggers: LogPattern[];
  /** Ordered list of file mutations to apply. */
  mutations: FileMutation[];
  /** Suggested commit message for the auto-fix PR. */
  commitMessage: string;
}

/** Result returned by the patch executor after attempting a fix. */
export interface PatchResult {
  patch: Patch;
  applied: boolean;
  mutationsApplied: number;
  error?: string;
}
