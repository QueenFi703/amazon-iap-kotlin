/**
 * DOT — core state manager.
 *
 * Tracks the lifecycle of a self-healing run so that individual modules
 * (Quasimoto, DREDGE, checks) can share progress information without
 * coupling to each other.
 */

import type { PatchResult } from "../dredge/types.js";

export type RunPhase =
  | "idle"
  | "analyzing"
  | "patching"
  | "verifying"
  | "done"
  | "failed";

export interface RunState {
  /** Current lifecycle phase. */
  phase: RunPhase;
  /** Short SHA of the HEAD commit when the run started. */
  originSha: string;
  /** Branch name created for this healing run (empty until patching begins). */
  healBranch: string;
  /** Number of matching patches found by Quasimoto. */
  matchedPatches: number;
  /** Results from every patch the executor attempted. */
  patchResults: PatchResult[];
  /** Whether a PR has been opened for this run. */
  prOpened: boolean;
  /** Any fatal error message that caused a "failed" phase. */
  fatalError?: string;
}

/** Create a fresh, idle RunState. */
export function createState(originSha: string): RunState {
  return {
    phase: "idle",
    originSha,
    healBranch: "",
    matchedPatches: 0,
    patchResults: [],
    prOpened: false,
  };
}

/** Transition the state to a new phase, logging the change. */
export function transition(state: RunState, next: RunPhase): void {
  console.info(`[state] ${state.phase} → ${next}`);
  state.phase = next;
}

/** Record a patch result and update applied-count tracking. */
export function recordPatchResult(
  state: RunState,
  result: PatchResult,
): void {
  state.patchResults.push(result);
}

/** Return a human-readable summary of the current state. */
export function summarize(state: RunState): string {
  const applied = state.patchResults.filter((r) => r.applied).length;
  const total = state.patchResults.length;
  return (
    `phase=${state.phase} ` +
    `branch=${state.healBranch || "(none)"} ` +
    `patches=${applied}/${total} ` +
    `pr=${state.prOpened}`
  );
}
