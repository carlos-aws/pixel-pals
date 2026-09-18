#!/usr/bin/env bash
# Deploys (or updates) the Pixel Pals cloud stack and uploads the site.
#
#   ./infra/deploy.sh            # full deploy: infrastructure + site
#   ./infra/deploy.sh --site-only  # only re-upload the site files
#   ./infra/deploy.sh --outputs    # print the stack outputs
#
# Requires: AWS CLI v2 configured with an account that can create the resources
# (aws configure), and infra/.env (see infra/.env.example).
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
MODE="${1:-full}"

if [[ -f "$HERE/.env" ]]; then set -a; source "$HERE/.env"; set +a; fi
STACK_NAME="${STACK_NAME:-pixel-pals}"
AWS_REGION="${AWS_REGION:-$(aws configure get region || true)}"
if [[ -z "$AWS_REGION" ]]; then echo "Set AWS_REGION in infra/.env or run 'aws configure'." >&2; exit 1; fi
export AWS_DEFAULT_REGION="$AWS_REGION"

output() { aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text; }

if [[ "$MODE" == "--outputs" ]]; then
  aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs" --output table
  exit 0
fi

if [[ "$MODE" != "--site-only" ]]; then
  for v in GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET COGNITO_DOMAIN_PREFIX ALLOWED_EMAILS; do
    if [[ -z "${!v:-}" ]]; then echo "Missing $v (see infra/.env.example)." >&2; exit 1; fi
  done
  ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
  ARTIFACTS="${STACK_NAME}-artifacts-${ACCOUNT}-${AWS_REGION}"
  if ! aws s3api head-bucket --bucket "$ARTIFACTS" 2>/dev/null; then
    echo "Creating artifacts bucket $ARTIFACTS"
    if [[ "$AWS_REGION" == "us-east-1" ]]; then aws s3api create-bucket --bucket "$ARTIFACTS" >/dev/null
    else aws s3api create-bucket --bucket "$ARTIFACTS" --create-bucket-configuration LocationConstraint="$AWS_REGION" >/dev/null; fi
    aws s3api put-public-access-block --bucket "$ARTIFACTS" --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
  fi
  PACKAGED="$(mktemp -t pixelpals-packaged.XXXXXX.yaml)"
  echo "Packaging Lambda code..."
  aws cloudformation package --template-file "$HERE/template.yaml" --s3-bucket "$ARTIFACTS" --output-template-file "$PACKAGED" >/dev/null
  echo "Deploying stack $STACK_NAME in $AWS_REGION (first run takes 5-10 minutes for CloudFront)..."
  aws cloudformation deploy \
    --stack-name "$STACK_NAME" \
    --template-file "$PACKAGED" \
    --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
    --no-fail-on-empty-changeset \
    --parameter-overrides \
      "GoogleClientId=$GOOGLE_CLIENT_ID" \
      "GoogleClientSecret=$GOOGLE_CLIENT_SECRET" \
      "CognitoDomainPrefix=$COGNITO_DOMAIN_PREFIX" \
      "AllowedEmails=$ALLOWED_EMAILS" \
      "ExtraOrigin=${EXTRA_ORIGIN:-http://localhost:8080}"
  rm -f "$PACKAGED"
fi

BUCKET="$(output SiteBucket)"
DIST_ID="$(output DistributionId)"
SITE_URL="$(output SiteUrl)"
API_URL="$(output ApiUrl)"
CLIENT_ID="$(output UserPoolClientId)"
POOL_ID="$(output UserPoolId)"
COGNITO_DOMAIN="$(output CognitoDomain)"
GOOGLE_REDIRECT="$(output GoogleRedirectUri)"

# Runtime configuration read by the game at start-up. Its presence switches the
# game into cloud mode; local deployments simply don't have this file.
CONFIG="$(mktemp -t pixelpals-config.XXXXXX.json)"
cat > "$CONFIG" <<JSON
{
  "mode": "cloud",
  "region": "$AWS_REGION",
  "userPoolId": "$POOL_ID",
  "clientId": "$CLIENT_ID",
  "cognitoDomain": "$COGNITO_DOMAIN",
  "apiUrl": "$API_URL"
}
JSON

echo "Uploading site to s3://$BUCKET ..."
STAMP="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || date +%s)"
SW="$(mktemp -t pixelpals-sw.XXXXXX.js)"
sed "s/pixelpals-v1/pixelpals-${STAMP}/" "$ROOT/sw.js" > "$SW"
aws s3 sync "$ROOT" "s3://$BUCKET" --delete \
  --exclude ".git/*" --exclude ".github/*" --exclude "infra/*" --exclude "tools/*" --exclude "tests/*" \
  --exclude "docs/*" --exclude "node_modules/*" --exclude ".gitignore" --exclude "eslint.config.js" \
  --exclude "package.json" --exclude "package-lock.json" --exclude "README.md" --exclude "sw.js" --exclude "index.html" --exclude "config.json" \
  --cache-control "public,max-age=600"
aws s3 cp "$SW" "s3://$BUCKET/sw.js" --content-type "text/javascript" --cache-control "no-cache"
aws s3 cp "$ROOT/index.html" "s3://$BUCKET/index.html" --content-type "text/html; charset=utf-8" --cache-control "no-cache"
aws s3 cp "$CONFIG" "s3://$BUCKET/config.json" --content-type "application/json" --cache-control "no-cache"
rm -f "$CONFIG" "$SW"
echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*" --query "Invalidation.Id" --output text

cat <<MSG

Done!
  Game URL:            $SITE_URL
  Google redirect URI: $GOOGLE_REDIRECT
     (must be listed under "Authorized redirect URIs" of your Google OAuth client)
  Sign-in domain:      https://$COGNITO_DOMAIN
  API:                 $API_URL

Open the game URL on each device and sign in with an allowed Google account.
MSG
