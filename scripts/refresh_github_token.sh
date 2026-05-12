#!/usr/bin/env bash
set -euo pipefail

: "${GITHUB_CLIENT_ID:?GITHUB_CLIENT_ID is required}"
: "${GITHUB_CLIENT_SECRET:?GITHUB_CLIENT_SECRET is required}"
: "${GITHUB_REFRESH_TOKEN:?GITHUB_REFRESH_TOKEN is required}"

response="$({
  curl -sS -X POST https://github.com/login/oauth/access_token \
    -H "Accept: application/json" \
    -d "client_id=${GITHUB_CLIENT_ID}" \
    -d "client_secret=${GITHUB_CLIENT_SECRET}" \
    -d "grant_type=refresh_token" \
    -d "refresh_token=${GITHUB_REFRESH_TOKEN}"
})"

if command -v jq >/dev/null 2>&1; then
  access_token="$(printf '%s' "$response" | jq -r '.access_token // empty')"
  refresh_token="$(printf '%s' "$response" | jq -r '.refresh_token // empty')"
  token_type="$(printf '%s' "$response" | jq -r '.token_type // empty')"
else
  access_token="$(printf '%s' "$response" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')"
  refresh_token="$(printf '%s' "$response" | sed -n 's/.*"refresh_token":"\([^"]*\)".*/\1/p')"
  token_type="$(printf '%s' "$response" | sed -n 's/.*"token_type":"\([^"]*\)".*/\1/p')"
fi

if [[ -z "$access_token" ]]; then
  echo "Token refresh failed. Raw response:" >&2
  echo "$response" >&2
  exit 1
fi

{
  echo "token_type=${token_type:-bearer}"
  echo "access_token=${access_token}"
  [[ -n "$refresh_token" ]] && echo "refresh_token=${refresh_token}"
} 
