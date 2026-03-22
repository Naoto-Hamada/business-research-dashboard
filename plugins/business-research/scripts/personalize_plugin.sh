#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
PLUGIN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MARKET_JSON="$REPO_ROOT/.claude-plugin/marketplace.json"
PLUGIN_JSON="$PLUGIN_ROOT/.claude-plugin/plugin.json"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "[ERROR] command not found: $1"; exit 1; }
}
need_cmd jq

GITHUB_USER="${GITHUB_USER:-}"
REPO_NAME="${REPO_NAME:-}"
AUTHOR_NAME="${AUTHOR_NAME:-}"
AUTHOR_EMAIL="${AUTHOR_EMAIL:-}"
MARKETPLACE_NAME="${MARKETPLACE_NAME:-}"

if [[ -z "$GITHUB_USER" || -z "$REPO_NAME" || -z "$AUTHOR_NAME" ]]; then
  cat <<USAGE
Usage:
  GITHUB_USER=<github_user> REPO_NAME=<repo_name> AUTHOR_NAME=<display_name> [AUTHOR_EMAIL=<email>] [MARKETPLACE_NAME=<name>] bash plugins/business-research/scripts/personalize_plugin.sh
USAGE
  exit 1
fi

if [[ -z "$MARKETPLACE_NAME" ]]; then
  MARKETPLACE_NAME="$REPO_NAME"
fi

HOMEPAGE="https://github.com/${GITHUB_USER}/${REPO_NAME}"

TMP1="$(mktemp)"
TMP2="$(mktemp)"

jq \
  --arg mname "$MARKETPLACE_NAME" \
  --arg aname "$AUTHOR_NAME" \
  --arg aemail "$AUTHOR_EMAIL" \
  '.name = $mname | .owner.name = $aname | (if $aemail != "" then .owner.email = $aemail else . end)' \
  "$MARKET_JSON" > "$TMP1"
mv "$TMP1" "$MARKET_JSON"

jq \
  --arg aname "$AUTHOR_NAME" \
  --arg homepage "$HOMEPAGE" \
  '.author.name = $aname | .homepage = $homepage' \
  "$PLUGIN_JSON" > "$TMP2"
mv "$TMP2" "$PLUGIN_JSON"

echo "Updated:"
echo "  $MARKET_JSON"
echo "  $PLUGIN_JSON"
echo ""
echo "Next:"
echo "  git remote set-url origin $HOMEPAGE.git"
echo "  gh repo rename <new_repo_name> --yes   # or GitHub UI"
