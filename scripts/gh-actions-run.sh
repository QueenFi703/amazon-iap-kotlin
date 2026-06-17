#!/usr/bin/env bash
# gh-actions-run.sh — Inspect a GitHub Actions workflow run using GitHub CLI.
#
# Usage:
#   gh-actions-run.sh [options] <run-id|run-url>
#
# Options:
#   -R <owner/repo>   Repository (default: current repo or QueenFi703/amazon-iap-kotlin)
#   --log             Stream the full run log
#   --json            Print selected JSON fields (status, conclusion, event, etc.)
#   -h, --help        Show this help message
#
# Examples:
#   gh-actions-run.sh 23652704571
#   gh-actions-run.sh -R QueenFi703/amazon-iap-kotlin 23652704571 --log
#   gh-actions-run.sh https://github.com/QueenFi703/amazon-iap-kotlin/actions/runs/23652704571
#   gh-actions-run.sh 23652704571 --json

set -euo pipefail

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
DEFAULT_REPO="QueenFi703/amazon-iap-kotlin"
REPO=""
MODE="summary"   # summary | log | json
RUN_ID=""

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------
usage() {
  grep '^#' "$0" | grep -v '#!/' | sed 's/^#\? //'
  exit 0
}

die() {
  echo "error: $*" >&2
  exit 1
}

check_gh() {
  if ! command -v gh &>/dev/null; then
    die "'gh' (GitHub CLI) is not installed.
Install it from https://cli.github.com/ or via your package manager:
  macOS:  brew install gh
  Ubuntu: sudo apt install gh
  Fedora: sudo dnf install gh"
  fi

  if ! gh auth status &>/dev/null; then
    die "Not authenticated with GitHub CLI. Run:
  gh auth login
Then re-run this script."
  fi
}

extract_run_id() {
  local input="$1"
  # Accept either a plain run id (digits) or a full run URL
  if [[ "$input" =~ ^[0-9]+$ ]]; then
    echo "$input"
  elif [[ "$input" =~ /actions/runs/([0-9]+) ]]; then
    echo "${BASH_REMATCH[1]}"
  else
    die "Cannot parse run id from: $input
Expected a numeric run id (e.g. 23652704571) or a full run URL."
  fi
}

resolve_repo() {
  # Use explicit -R value, else try 'gh repo set-default', else fall back to default
  if [[ -n "$REPO" ]]; then
    echo "$REPO"
    return
  fi
  local current_repo
  current_repo=$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null || true)
  if [[ -n "$current_repo" ]]; then
    echo "$current_repo"
  else
    echo "$DEFAULT_REPO"
  fi
}

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)   usage ;;
    -R)          shift; REPO="$1" ;;
    --log)       MODE="log" ;;
    --json)      MODE="json" ;;
    -*)          die "Unknown option: $1" ;;
    *)
      if [[ -z "$RUN_ID" ]]; then
        RUN_ID="$(extract_run_id "$1")"
      else
        die "Unexpected argument: $1"
      fi
      ;;
  esac
  shift
done

if [[ -z "$RUN_ID" ]]; then
  echo "error: a run id or run URL is required." >&2
  echo "" >&2
  usage
fi

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
check_gh

REPO="$(resolve_repo)"

echo "Repository : $REPO"
echo "Run ID     : $RUN_ID"
echo ""

case "$MODE" in
  summary)
    gh run view "$RUN_ID" -R "$REPO"
    ;;
  log)
    gh run view "$RUN_ID" -R "$REPO"
    echo ""
    echo "--- Full log ---"
    gh run view "$RUN_ID" -R "$REPO" --log
    ;;
  json)
    echo "=== Run summary ==="
    gh run view "$RUN_ID" -R "$REPO" \
      --json status,conclusion,event,headBranch,headSha,createdAt,updatedAt,url
    echo ""
    echo "=== Jobs ==="
    gh run view "$RUN_ID" -R "$REPO" \
      --json jobs \
      -q '.jobs[] | {name, status, conclusion, url}'
    ;;
esac
