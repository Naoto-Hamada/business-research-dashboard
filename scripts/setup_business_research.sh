#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_GS="$REPO_ROOT/plugins/business-research/scripts/setup_dashboard.gs"
SRC_HTML="$REPO_ROOT/plugins/business-research/scripts/dashboard.html"
WORKDIR="${WORKDIR:-/tmp/business-research-setup-$RANDOM}"
PROJECT_TITLE="${PROJECT_TITLE:-Business Research Dashboard}"
WEBHOOK_SECRET="${WEBHOOK_SECRET:-}"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "[ERROR] command not found: $1"; exit 1; }
}

need_cmd clasp
need_cmd curl
need_cmd jq

if [[ ! -f "$SRC_GS" || ! -f "$SRC_HTML" ]]; then
  echo "[ERROR] source files not found"
  exit 1
fi

if [[ -z "$WEBHOOK_SECRET" ]]; then
  if command -v openssl >/dev/null 2>&1; then
    WEBHOOK_SECRET="$(openssl rand -hex 16)"
  else
    WEBHOOK_SECRET="br-$(date +%s)-$RANDOM"
  fi
fi

echo "[1/8] create working dir: $WORKDIR"
mkdir -p "$WORKDIR"
cd "$WORKDIR"

echo "[2/8] create new Apps Script project (type=sheets)"
CREATE_OUT="$(clasp create --type sheets --title "$PROJECT_TITLE" --rootDir . 2>&1 || true)"
echo "$CREATE_OUT"
if ! test -f .clasp.json; then
  echo "[ERROR] clasp create failed"
  exit 1
fi

SPREADSHEET_ID="$(echo "$CREATE_OUT" | sed -nE 's#.*spreadsheets/d/([a-zA-Z0-9_-]+).*#\1#p' | head -n1)"
SCRIPT_ID="$(jq -r '.scriptId // empty' .clasp.json)"

if [[ -z "$SPREADSHEET_ID" ]]; then
  echo "[WARN] spreadsheet id was not parsed from output; trying with clasp open-container URL pattern is skipped"
fi
if [[ -z "$SCRIPT_ID" ]]; then
  echo "[ERROR] script id not found in .clasp.json"
  exit 1
fi

echo "[3/8] copy dashboard source"
cp "$SRC_GS" "$WORKDIR/コード.js"
cp "$SRC_HTML" "$WORKDIR/dashboard.html"

if [[ -n "$SPREADSHEET_ID" ]]; then
  sed -i.bak "s#^const DEFAULT_SPREADSHEET_ID = '.*';#const DEFAULT_SPREADSHEET_ID = '$SPREADSHEET_ID';#" "$WORKDIR/コード.js"
fi

echo "[4/8] push Apps Script files"
clasp push

echo "[5/8] run setup functions"
if [[ -n "$SPREADSHEET_ID" ]]; then
  clasp run configureSpreadsheetId --params "[\"$SPREADSHEET_ID\"]" || true
fi
clasp run setupSheets || true

echo "[6/8] create version + deploy web app"
VERSION_RAW="$(clasp version 'Initial setup: Business Research Dashboard')"
VERSION="$(echo "$VERSION_RAW" | awk '{print $3}')"
DEPLOY_OUT="$(clasp deploy -V "$VERSION" -d 'Initial web app deploy' 2>&1)"
echo "$DEPLOY_OUT"
DEPLOYMENT_ID="$(echo "$DEPLOY_OUT" | sed -nE 's#.*(AKfy[a-zA-Z0-9_-]+).*#\1#p' | head -n1)"

if [[ -z "$DEPLOYMENT_ID" ]]; then
  echo "[ERROR] deployment id not found"
  exit 1
fi
WEBAPP_URL="https://script.google.com/macros/s/$DEPLOYMENT_ID/exec"

echo "[7/8] register webhook secret"
SECRET_RESP="$(curl -sS -X POST "$WEBAPP_URL" -H 'Content-Type: application/json' -d "{\"_setupSecret\":\"$WEBHOOK_SECRET\"}")"
echo "$SECRET_RESP"

echo "[8/8] set Claude env vars"
if command -v claude >/dev/null 2>&1; then
  claude config set env.BUSINESS_RESEARCH_WEBHOOK "$WEBAPP_URL"
  claude config set env.BUSINESS_RESEARCH_DASHBOARD_BASE_URL "$WEBAPP_URL"
  claude config set env.WEBHOOK_SECRET "$WEBHOOK_SECRET"
  echo "claude env updated"
else
  echo "[WARN] claude command not found. set env manually:"
  echo "  BUSINESS_RESEARCH_WEBHOOK=$WEBAPP_URL"
  echo "  BUSINESS_RESEARCH_DASHBOARD_BASE_URL=$WEBAPP_URL"
  echo "  WEBHOOK_SECRET=$WEBHOOK_SECRET"
fi

if [[ -n "$SPREADSHEET_ID" ]]; then
  echo ""
  echo "Spreadsheet: https://docs.google.com/spreadsheets/d/$SPREADSHEET_ID/edit"
fi

echo "Script ID: $SCRIPT_ID"
echo "Deployment ID: $DEPLOYMENT_ID"
echo "Webhook URL: $WEBAPP_URL"
echo "Dashboard URL: $WEBAPP_URL"
echo "Done"
