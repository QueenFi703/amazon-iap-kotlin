# CI Self-Healing Agent

This document describes the **self-healing agent** that is embedded in the
`IAP Sandbox Pipeline` (`.github/workflows/iap-sandbox-pipeline.yml`).

---

## What the Self-Healing Agent Does

The agent is a GitHub Actions job (`self-healing-agent`) that runs automatically
whenever the `sandbox-validation` matrix job produces at least one failure.

### Workflow

```
sandbox-build
     │
     ├─► sandbox-validation (matrix: 4 scenarios, parallel)
     │         │
     │         └─► [if any scenario failed]
     │                   │
     │                   └─► self-healing-agent
     │                             │
     │                             ├─ detect which Sandbox [scenario] jobs failed
     │                             ├─ retry each failed scenario once (--info --stacktrace)
     │                             ├─ classify: flaky 🟡 or persistent 🔴
     │                             └─ update memory.json
     │
     └─► sandbox-full-suite (parallel with validation)

sandbox-graduation-check  (always runs, collects results from all three above)
```

### Step-by-step behaviour

1. **Detect failed scenarios** – uses `actions/github-script` to call the
   GitHub API and find all `Sandbox [<scenario>]` jobs in the current run that
   finished with `conclusion: failure`.

2. **Retry only those scenarios** – builds dynamic `--tests` arguments from the
   scenario → filter map and re-runs Gradle with `--info --stacktrace`.

3. **Classify**
   - Retry passes → scenario is **🟡 flaky** (non-deterministic)
   - Retry fails again → scenario is **🔴 persistent** (real defect)

4. **Update memory** – calls `ci/self_healing/update_memory.js` to record the
   outcome per scenario + signature in `ci/self_healing/memory.json`.

5. **Job result**
   - All retried scenarios passed → job succeeds → graduation check treats it
     as "proceed with caution"
   - Any retried scenario failed again → job fails → graduation check fails

---

## Flaky vs Real Failures

| Classification | Meaning | What happens next |
|---|---|---|
| 🟡 **Flaky** | Test passed on the first retry | Pipeline proceeds with a caution message; failure is logged in memory |
| 🔴 **Persistent** | Test failed again on retry | Pipeline fails; memory records another persistent count |

A pattern is considered **known persistent** once it has been recorded as
`persistent` two or more times across workflow runs.  The memory report printed
at the start of each retry will say `KNOWN PERSISTENT` and recommend escalation.

---

## Where Memory Is Stored

Failure history is stored in **two places** for resilience:

| Location | Scope | Retention |
|---|---|---|
| GitHub Actions cache key `self-healing-memory-<branch>-<run_id>` | Branch-scoped, survives across runs | Until evicted (~7 days by default) |
| GitHub Actions artifact `self-healing-memory-<run_id>` | Per-run snapshot | 90 days |

The in-workflow path is `ci/self_healing/memory.json`.  This file is **not
committed** to the repository; it lives only in the cache/artifact layer.

### memory.json schema

```json
{
  "<scenario>||<signature>": {
    "scenario": "mock-purchases",
    "signature": "mock-purchases|CoherenceBridgeTest|retry",
    "seen": 3,
    "flaky": 2,
    "persistent": 1,
    "last_seen_at": "2026-03-27T15:00:00.000Z",
    "last_seen_run_id": "23649835241"
  }
}
```

### How to reset memory

Delete the cache entries in the repository:
**Actions → Caches → search `self-healing-memory` → Delete**.

Or simply delete/modify the artifact if you only want to clear a specific run's
snapshot.

---

## Graduation Check Logic

```
if validation == success AND full-suite == success:
    ✅  All sandbox tests passed — ready for staging promotion.

elif healing == success OR healing == skipped:   # skipped = no failures → OK
    AND full-suite == success:
    🟡  Recovered via self-healing (flaky tests). Proceed with caution.

else:
    ❌  Sandbox graduation check FAILED.
```

---

## Scenario → Test Filter Map

| Scenario | Gradle --tests filter |
|---|---|
| `mock-purchases` | `*CoherenceBridgeTest.executePurchasePhase*,*CoherenceBridgeTest.executeFulfillmentPhase*` |
| `receipt-validation` | `*CoherenceBridgeTest.executeFulfillmentPhase*` |
| `subscription-flows` | `*CoherenceBridgeTest.full*` |
| `product-data-query` | `*CoherenceBridgeTest.executeProductDataQuery*` |

---

## Future Evolution Ideas

- Parse Gradle/JUnit XML test-result files to extract precise exception type and
  stack-frame for a richer signature (currently uses `<scenario>|CoherenceBridgeTest|retry`).
- Auto-open a GitHub Issue when `persistent >= 3` for a signature.
- Plug memory into a Slack/notification step for team visibility.
- Connect to an external observability platform for long-term trend analysis.
