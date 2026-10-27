#!/usr/bin/env bash
# Builds both Angular apps and uploads them to S3, then tells CloudFront to drop its cached index.html.
# Run from your own machine (needs Node and the AWS CLI, logged in with `aws configure`):
#   BUCKET=my-bucket CLIENT_DIST_ID=E123 AUDIT_DIST_ID=E456 ./deploy/deploy-frontends.sh
set -euo pipefail
cd "$(dirname "$0")/.."

: "${BUCKET:?set BUCKET to your S3 bucket name}"
: "${CLIENT_DIST_ID:?set CLIENT_DIST_ID to the client-frontend CloudFront distribution ID}"
: "${AUDIT_DIST_ID:?set AUDIT_DIST_ID to the audit-frontend CloudFront distribution ID}"

upload() { # <build dir> <bucket prefix> <distribution id>
  # Hashed bundles never change, so browsers may keep them; index.html must be refetched to pick up new bundles.
  aws s3 sync "$1" "s3://$BUCKET/$2" --delete --exclude index.html \
    --cache-control "public, max-age=31536000, immutable"
  aws s3 cp "$1/index.html" "s3://$BUCKET/$2/index.html" --cache-control "no-cache"
  aws cloudfront create-invalidation --distribution-id "$3" --paths "/index.html" "/" >/dev/null
}

echo "==> client-frontend"
(cd client-frontend && npm install && npx ng build)
upload client-frontend/dist/client-frontend/browser client "$CLIENT_DIST_ID"

echo "==> audit-frontend"
(cd audit-frontend && npm install && npm run build -- --configuration production)
upload audit-frontend/dist/audit-frontend/browser audit "$AUDIT_DIST_ID"

echo "Frontends deployed."
