# ChatGPT/Copilot server → GitHub API → refresh token

This repo can use a short server-side flow to rotate GitHub OAuth user tokens without storing long-lived access tokens.

## Flow
1. ChatGPT/Copilot server stores an encrypted GitHub `refresh_token`.
2. Server calls GitHub OAuth token endpoint:
   - `POST https://github.com/login/oauth/access_token`
   - `Accept: application/json`
3. GitHub responds with a new `access_token` and (optionally) a new `refresh_token`.
4. Server atomically updates stored tokens.
5. Server uses the new `access_token` for GitHub API calls (for example, creating PR comments/status updates).

## Required request fields
- `client_id`
- `client_secret`
- `grant_type=refresh_token`
- `refresh_token`

## Example request
```bash
curl -sS -X POST https://github.com/login/oauth/access_token \
  -H "Accept: application/json" \
  -d "client_id=$GITHUB_CLIENT_ID" \
  -d "client_secret=$GITHUB_CLIENT_SECRET" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=$GITHUB_REFRESH_TOKEN"
```

## Response handling
Validate that `access_token` is present. If GitHub returns a replacement `refresh_token`, persist it immediately and invalidate the old value in your secret store.

## Operational safeguards
- Never log full token values.
- Rotate `client_secret` periodically.
- Enforce least-privilege scopes.
- Retry transient 5xx responses with exponential backoff.
- Treat 4xx responses as non-retryable and alert.
