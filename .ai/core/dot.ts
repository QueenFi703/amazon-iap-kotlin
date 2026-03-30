/**
 * DOT — orchestrator.
 *
 * Coordinates the full self-healing loop:
 *   1. Read CI context
 *   2. Quasimoto: analyze the failure log
 *   3. DREDGE: apply matching patches
 *   4. git: commit and push a heal branch
 *   5. Open a pull request via the GitHub API
 */

import fs from "node:fs";
import { execSync } from "node:child_process";

import { readCiContext, healBranchName } from "./checks.js";
import {
  createState,
  transition,
  recordPatchResult,
  summarize,
} from "./state.js";
import { analyze } from "../quasimoto/analyzer.js";
import { executePatch } from "../dredge/executor.js";
import { createBranch, commitAll, push, headSha } from "../utils/git.js";

// ── GitHub API helper ──────────────────────────────────────────────────────

const GH_PAT = process.env.GH_PAT ?? process.env.GITHUB_TOKEN ?? "";

async function openPullRequest(
  repository: string,
  branch: string,
  title: string,
  body: string,
): Promise<void> {
  if (!GH_PAT) {
    console.warn("[DOT] GH_PAT not set — skipping PR creation.");
    return;
  }

  const [owner, repo] = repository.split("/");
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls`;

  const payload = JSON.stringify({
    title,
    body,
    head: branch,
    base: "main",
  });

  // Pass the payload via stdin to avoid embedding it in the command string
  // (which could expose it in process listings or shell history).
  const response = execSync(
    `curl -s -X POST \
      -H "Authorization: Bearer ${GH_PAT}" \
      -H "Accept: application/vnd.github+json" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      -H "Content-Type: application/json" \
      --data @- \
      "${url}"`,
    { input: payload },
  ).toString();

  const parsed = JSON.parse(response);
  if (parsed.html_url) {
    console.info(`[DOT] PR opened: ${parsed.html_url}`);
  } else {
    console.error("[DOT] PR creation failed:", response);
  }
}

// ── Main orchestration loop ────────────────────────────────────────────────

export async function run(): Promise<void> {
  // 1. Read CI context
  const ctx = readCiContext();
  const state = createState(ctx.sha);
  console.info(`[DOT] Healing run started for ${ctx.repository}@${ctx.sha}`);

  // 2. Read failure log
  transition(state, "analyzing");
  if (!fs.existsSync(ctx.failureLogPath)) {
    transition(state, "failed");
    state.fatalError = `Failure log not found: ${ctx.failureLogPath}`;
    console.error(`[DOT] ${state.fatalError}`);
    process.exitCode = 1;
    return;
  }

  const log = fs.readFileSync(ctx.failureLogPath, "utf8");
  const patches = analyze(log);
  state.matchedPatches = patches.length;

  if (patches.length === 0) {
    console.info("[DOT] No applicable patches — nothing to heal.");
    transition(state, "done");
    console.info(`[DOT] ${summarize(state)}`);
    return;
  }

  // 3. Create a heal branch
  transition(state, "patching");
  const branch = healBranchName(ctx.sha, ctx.runId);
  state.healBranch = branch;
  createBranch(branch);

  // 4. Apply patches
  let anyApplied = false;
  const commitMessages: string[] = [];

  for (const patch of patches) {
    const result = executePatch(patch);
    recordPatchResult(state, result);
    if (result.applied) {
      anyApplied = true;
      commitMessages.push(patch.commitMessage);
    }
  }

  if (!anyApplied) {
    console.warn("[DOT] Patches matched but no mutations applied.");
    transition(state, "done");
    console.info(`[DOT] ${summarize(state)}`);
    return;
  }

  // 5. Commit and push
  const combinedMessage = commitMessages.join("\n\n");
  commitAll(combinedMessage);
  push(branch);

  // 6. Open PR
  transition(state, "verifying");
  const prTitle = `[fi-core] Auto-heal: ${patches.map((p) => p.title).join(", ")}`;
  const appliedResults = state.patchResults.filter((r) => r.applied);
  const prBody = [
    "## Automated healing by fi-core / DOT",
    "",
    `**Run:** \`${ctx.runId}\`  `,
    `**Commit:** \`${ctx.sha}\`  `,
    `**Workflow:** ${ctx.workflow}`,
    "",
    "### Patches applied",
    ...appliedResults.map(
      (r) =>
        `- **${r.patch.id}** (${r.patch.category}/${r.patch.severity}): ${r.patch.title}`,
    ),
    "",
    "_This PR was opened automatically. Please review and merge if the build passes._",
  ].join("\n");

  await openPullRequest(ctx.repository, branch, prTitle, prBody);
  state.prOpened = true;

  transition(state, "done");
  console.info(`[DOT] ${summarize(state)}`);
}
