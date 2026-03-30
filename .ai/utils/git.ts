/**
 * Git utilities for the self-healing pipeline.
 *
 * Wraps common git operations needed when DOT applies patches:
 * creating a branch, committing changes, and pushing back to the remote.
 */

import { execSync } from "node:child_process";

/** Options that control git behaviour. */
export interface GitOptions {
  /** Repository root directory (defaults to process.cwd()). */
  cwd?: string;
  /** Name to use in git commits. */
  authorName?: string;
  /** Email to use in git commits. */
  authorEmail?: string;
}

/** Execute a shell command synchronously, streaming stdout/stderr. */
function run(cmd: string, cwd: string): void {
  console.info(`[git] ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit" });
}

/**
 * Create (and check out) a new branch from the current HEAD.
 * If the branch already exists locally, checks it out instead.
 */
export function createBranch(branchName: string, opts: GitOptions = {}): void {
  const cwd = opts.cwd ?? process.cwd();
  try {
    run(`git checkout -b "${branchName}"`, cwd);
  } catch {
    run(`git checkout "${branchName}"`, cwd);
  }
}

/**
 * Stage all tracked and untracked changes, then create a commit.
 */
export function commitAll(
  message: string,
  opts: GitOptions = {},
): void {
  const cwd = opts.cwd ?? process.cwd();
  const name = opts.authorName ?? "fi-core[bot]";
  const email = opts.authorEmail ?? "fi-core@users.noreply.github.com";

  run(`git config user.name "${name}"`, cwd);
  run(`git config user.email "${email}"`, cwd);
  run("git add -A", cwd);
  run(`git commit -m ${JSON.stringify(message)}`, cwd);
}

/**
 * Push the current branch to `origin`.
 *
 * Uses `--force-with-lease` which is safer than `--force`: it will refuse
 * to overwrite the remote branch if someone else has pushed since our last
 * fetch, preventing accidental data loss while still allowing the bot to
 * update a previously pushed heal branch.
 *
 * Requires that the git remote is configured with the right credentials
 * (e.g., HTTPS URL with GH_PAT embedded, or SSH key).
 */
export function push(branchName: string, opts: GitOptions = {}): void {
  const cwd = opts.cwd ?? process.cwd();
  run(`git push origin "${branchName}" --force-with-lease`, cwd);
}

/**
 * Return the short SHA of the current HEAD commit.
 */
export function headSha(opts: GitOptions = {}): string {
  const cwd = opts.cwd ?? process.cwd();
  return execSync("git rev-parse --short HEAD", { cwd }).toString().trim();
}
