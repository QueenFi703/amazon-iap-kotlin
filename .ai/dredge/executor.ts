/**
 * DREDGE — patch executor.
 *
 * Applies a Patch's file mutations to the working tree and returns a
 * PatchResult describing what happened.
 */

import fs from "node:fs";
import path from "node:path";
import type { FileMutation, Patch, PatchResult } from "./types.js";

/**
 * Apply a single FileMutation to the given file on disk.
 *
 * @returns `true` when the file content changed, `false` otherwise.
 */
function applyMutation(
  repoRoot: string,
  mutation: FileMutation,
): boolean {
  const filePath = path.resolve(repoRoot, mutation.path);

  if (!fs.existsSync(filePath)) {
    console.warn(`[DREDGE] File not found, skipping: ${mutation.path}`);
    return false;
  }

  const original = fs.readFileSync(filePath, "utf8");

  let updated: string;
  if (mutation.search instanceof RegExp) {
    updated = original.replace(mutation.search, mutation.replace);
  } else {
    updated = original.split(mutation.search).join(mutation.replace);
  }

  if (updated === original) {
    console.info(
      `[DREDGE] No change for mutation "${mutation.description}" in ${mutation.path}`,
    );
    return false;
  }

  fs.writeFileSync(filePath, updated, "utf8");
  console.info(
    `[DREDGE] Applied mutation "${mutation.description}" → ${mutation.path}`,
  );
  return true;
}

/**
 * Execute all mutations from the given Patch against the repository at
 * `repoRoot` and return a detailed PatchResult.
 */
export function executePatch(
  patch: Patch,
  repoRoot: string = process.cwd(),
): PatchResult {
  console.info(`[DREDGE] Applying patch: ${patch.id} — ${patch.title}`);

  let mutationsApplied = 0;

  try {
    for (const mutation of patch.mutations) {
      if (applyMutation(repoRoot, mutation)) {
        mutationsApplied++;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DREDGE] Patch ${patch.id} failed: ${message}`);
    return { patch, applied: false, mutationsApplied, error: message };
  }

  const applied = mutationsApplied > 0;
  if (!applied) {
    console.warn(
      `[DREDGE] Patch ${patch.id} matched but produced no mutations.`,
    );
  }

  return { patch, applied, mutationsApplied };
}
