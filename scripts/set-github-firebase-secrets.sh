#!/usr/bin/env bash
# Set GitHub Actions secrets from a local untracked env file (default: .env.local).
# Requires: gh auth login with permission to manage Actions secrets.
#
#   cp .env.example .env.local   # fill in VITE_FIREBASE_* values
#   ./scripts/set-github-firebase-secrets.sh [owner/repo] [.env.local]
set -euo pipefail

REPO="${1:-ltmtms/meteroo}"
ENV_FILE="${2:-.env.local}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy .env.example and add your Firebase web config." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

required=(VITE_FIREBASE_API_KEY VITE_FIREBASE_AUTH_DOMAIN VITE_FIREBASE_DATABASE_URL VITE_FIREBASE_PROJECT_ID VITE_FIREBASE_APP_ID)
for key in "${required[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    echo "Missing $key in $ENV_FILE" >&2
    exit 1
  fi
done

gh secret set VITE_FIREBASE_API_KEY --repo "$REPO" --body "$VITE_FIREBASE_API_KEY"
gh secret set VITE_FIREBASE_AUTH_DOMAIN --repo "$REPO" --body "$VITE_FIREBASE_AUTH_DOMAIN"
gh secret set VITE_FIREBASE_DATABASE_URL --repo "$REPO" --body "$VITE_FIREBASE_DATABASE_URL"
gh secret set VITE_FIREBASE_PROJECT_ID --repo "$REPO" --body "$VITE_FIREBASE_PROJECT_ID"
gh secret set VITE_FIREBASE_APP_ID --repo "$REPO" --body "$VITE_FIREBASE_APP_ID"

echo "Done. Verify: gh secret list --repo $REPO"
