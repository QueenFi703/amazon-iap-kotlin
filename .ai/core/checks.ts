/**
 * DOT — CI check utilities.
 *
 * Provides helpers for reading CI context variables and determining
 * whether a workflow run actually failed (as opposed to being cancelled
 * or skipped) so DOT knows whether healing is warranted.
 */

/** Context injected by the GitHub Actions runner via environment variables. */
export interface CiContext {
  /** `GITHUB_REPOSITORY` — e.g. "QueenFi703/amazon-iap-kotlin" */
  repository: string;
  /** `GITHUB_SHA` — commit SHA that triggered the run */
  sha: string;
  /** `GITHUB_REF` — e.g. "refs/heads/main" */
  ref: string;
  /** `GITHUB_RUN_ID` — numeric string identifying this workflow run */
  runId: string;
  /** `GITHUB_WORKFLOW` — name of the triggering workflow */
  workflow: string;
  /**
   * `FAILURE_LOG` — path to a file containing the captured build log,
   * written by the workflow before invoking the healing step.
   */
  failureLogPath: string;
}

/**
 * Read CI context from environment variables.
 * Throws if any required variable is missing.
 */
export function readCiContext(): CiContext {
  const required: Array<[keyof CiContext, string]> = [
    ["repository", "GITHUB_REPOSITORY"],
    ["sha", "GITHUB_SHA"],
    ["ref", "GITHUB_REF"],
    ["runId", "GITHUB_RUN_ID"],
    ["workflow", "GITHUB_WORKFLOW"],
    ["failureLogPath", "FAILURE_LOG"],
  ];

  const result: Partial<CiContext> = {};

  for (const [key, envVar] of required) {
    const value = process.env[envVar];
    if (!value) {
      throw new Error(
        `[checks] Required environment variable ${envVar} is not set.`,
      );
    }
    result[key] = value;
  }

  return result as CiContext;
}

/**
 * Return true when the workflow conclusion indicates a genuine failure
 * (as opposed to "cancelled" or "skipped").
 */
export function isFailureConclusion(conclusion: string): boolean {
  return conclusion === "failure" || conclusion === "timed_out";
}

/**
 * Derive a deterministic heal-branch name for a given run.
 * Format: `fi/heal/<sha-short>-<runId>`
 */
export function healBranchName(sha: string, runId: string): string {
  const shortSha = sha.slice(0, 8);
  return `fi/heal/${shortSha}-${runId}`;
}
