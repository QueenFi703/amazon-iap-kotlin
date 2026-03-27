#!/usr/bin/env node
/**
 * update_memory.js
 *
 * Reads/writes ci/self_healing/memory.json to track failure patterns across
 * GitHub Actions workflow runs.
 *
 * Usage:
 *   node update_memory.js record \
 *     --scenario <scenario> \
 *     --signature "<ExceptionType|ClassName|lineN>" \
 *     --outcome <flaky|persistent> \
 *     --run-id <GITHUB_RUN_ID>
 *
 *   node update_memory.js report \
 *     --scenario <scenario> \
 *     --signature "<ExceptionType|ClassName|lineN>"
 *
 * Exit codes:
 *   0  OK
 *   1  Usage / I/O error
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const MEMORY_FILE = path.join(__dirname, 'memory.json');

// ── helpers ──────────────────────────────────────────────────────────────────

function loadMemory() {
  if (!fs.existsSync(MEMORY_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
  } catch (_) {
    return {};
  }
}

function saveMemory(data) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function makeKey(scenario, signature) {
  return `${scenario}||${signature}`;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      // Only consume the next token as a value if it doesn't look like a flag
      if (next !== undefined && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = '';
      }
    }
  }
  return args;
}

// ── commands ──────────────────────────────────────────────────────────────────

/**
 * record: update counts for a scenario+signature pair after a retry attempt.
 */
function cmdRecord(args) {
  const { scenario, signature, outcome, 'run-id': runId } = args;
  if (!scenario || !signature || !outcome) {
    console.error('record requires --scenario, --signature, --outcome');
    process.exit(1);
  }

  const memory = loadMemory();
  const key    = makeKey(scenario, signature);

  if (!memory[key]) {
    memory[key] = {
      scenario,
      signature,
      seen:        0,
      flaky:       0,
      persistent:  0,
      last_seen_at:     null,
      last_seen_run_id: null,
    };
  }

  const entry = memory[key];
  entry.seen  += 1;

  if (outcome === 'flaky') {
    entry.flaky += 1;
  } else if (outcome === 'persistent') {
    entry.persistent += 1;
  } else {
    console.error(`Unknown outcome "${outcome}". Expected flaky|persistent.`);
    process.exit(1);
  }

  entry.last_seen_at     = new Date().toISOString();
  entry.last_seen_run_id = runId || null;

  saveMemory(memory);
  console.log(`[memory] Recorded: key="${key}" outcome="${outcome}" seen=${entry.seen}`);
}

/**
 * report: print a classification line based on stored history.
 */
function cmdReport(args) {
  const { scenario, signature } = args;
  if (!scenario || !signature) {
    console.error('report requires --scenario, --signature');
    process.exit(1);
  }

  const memory = loadMemory();
  const key    = makeKey(scenario, signature);
  const entry  = memory[key];

  if (!entry) {
    console.log(`[memory] 🆕 NEW failure pattern: scenario="${scenario}" signature="${signature}"`);
    return;
  }

  const { seen, flaky, persistent, last_seen_at, last_seen_run_id } = entry;
  console.log(`[memory] Pattern history: scenario="${scenario}" signature="${signature}" seen=${seen} flaky=${flaky} persistent=${persistent} last_seen_at=${last_seen_at} last_seen_run_id=${last_seen_run_id}`);

  if (persistent >= 2) {
    console.log(`[memory] 🔴 KNOWN PERSISTENT: this pattern has failed on retry ${persistent} time(s). Likely a real defect.`);
  } else if (flaky >= 1) {
    console.log(`[memory] 🟡 KNOWN FLAKY: this pattern recovered on retry ${flaky} time(s). Worth retrying.`);
  } else {
    console.log(`[memory] 🔸 FIRST RETRY: no history yet; retrying to classify.`);
  }
}

// ── main ──────────────────────────────────────────────────────────────────────

const [,, command, ...rest] = process.argv;
const args = parseArgs(rest);

switch (command) {
  case 'record': cmdRecord(args); break;
  case 'report': cmdReport(args); break;
  default:
    console.error(`Unknown command "${command}". Use: record | report`);
    process.exit(1);
}
