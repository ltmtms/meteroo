#!/usr/bin/env bash
# Run locally with a GitHub CLI token that has repo/admin + secrets scope:
#   gh auth login -s admin:repo
#   ./scripts/set-github-firebase-secrets.sh
set -euo pipefail
REPO="${1:-ltmtms/meteroo}"

gh secret set VITE_FIREBASE_API_KEY --repo "$REPO" --body "AIzaSyCGjkwZ4_IpTlYIj-o5JJE6lkyeXYYmaBE"
gh secret set VITE_FIREBASE_AUTH_DOMAIN --repo "$REPO" --body "meteroo-6be7e.firebaseapp.com"
gh secret set VITE_FIREBASE_DATABASE_URL --repo "$REPO" --body "https://meteroo-6be7e-default-rtdb.asia-southeast1.firebasedatabase.app"
gh secret set VITE_FIREBASE_PROJECT_ID --repo "$REPO" --body "meteroo-6be7e"
gh secret set VITE_FIREBASE_APP_ID --repo "$REPO" --body "1:615340869402:web:6894597e359f021dcf8ea3"

echo "Done. Verify: gh secret list --repo $REPO"
