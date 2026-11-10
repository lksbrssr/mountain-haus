#!/usr/bin/env bash
# One-time setup + deploy for the Haus comments backend on Fly.io.
# Run from the comments-server/ directory after `fly auth login`.
set -euo pipefail

APP="${APP:-mountain-haus-comments}"
REGION="${REGION:-fra}"

echo "→ Using app: $APP (region $REGION)"

# Create the app if it doesn't exist yet.
if ! fly apps list | grep -q "^$APP"; then
  echo "→ Creating app $APP"
  fly apps create "$APP"
fi

# Create the persistent volume if it doesn't exist yet.
if ! fly volumes list -a "$APP" 2>/dev/null | grep -q "haus_data"; then
  echo "→ Creating 1GB volume haus_data in $REGION"
  fly volumes create haus_data --region "$REGION" --size 1 -a "$APP" --yes
fi

echo "→ Deploying"
fly deploy -a "$APP"

echo
echo "✓ Done. API base URL: https://$APP.fly.dev"
echo "  Set this in Vercel as NEXT_PUBLIC_COMMENTS_API"
echo "  Health check: curl https://$APP.fly.dev/healthz"
