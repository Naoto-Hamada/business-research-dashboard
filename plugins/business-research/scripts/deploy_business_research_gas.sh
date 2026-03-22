#!/usr/bin/env bash
set -euo pipefail

SCRIPT_ID="1GvUMaEF5o5hq0nCn_iG0FxJ2q-OpEpukAjEPwS0ysr7BeIYG_Y0OHNov"
DEPLOYMENT_ID="AKfycbyDivGNXvt1zfljpx1E1Lt-6Vgy-m-0V16Pi47ddCn7B_THcATjnTh90cwanAqLZKgy"
WORKDIR="/tmp/business-research-gas"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC_HTML="$SCRIPT_DIR/dashboard.html"
SRC_GS="$SCRIPT_DIR/setup_dashboard.gs"

MSG="${1:-UI更新: Business Research Dashboard}"

if [[ ! -f "$SRC_HTML" || ! -f "$SRC_GS" ]]; then
  echo "Source files not found:"
  echo "  $SRC_HTML"
  echo "  $SRC_GS"
  exit 1
fi

mkdir -p "$WORKDIR"
cd "$WORKDIR"

if [[ ! -f ".clasp.json" ]]; then
  clasp clone "$SCRIPT_ID"
fi

cp "$SRC_HTML" "$WORKDIR/dashboard.html"
cp "$SRC_GS" "$WORKDIR/コード.js"

echo "[1/4] clasp push"
clasp push

echo "[2/4] clasp version"
VERSION_RAW="$(clasp version "$MSG")"
VERSION="$(echo "$VERSION_RAW" | awk '{print $3}')"
if [[ -z "$VERSION" ]]; then
  echo "Failed to parse version from: $VERSION_RAW"
  exit 1
fi

echo "[3/4] clasp deploy"
clasp deploy -i "$DEPLOYMENT_ID" -V "$VERSION" -d "$MSG"

echo "[4/4] clasp deployments"
clasp deployments

echo
echo "Done"
echo "version=$VERSION"
echo "deployment_id=$DEPLOYMENT_ID"
