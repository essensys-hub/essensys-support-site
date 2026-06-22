#!/usr/bin/env bash
# Rebuild la démo statique mockée (essensys-server-frontend) et la copie dans le support-site.
#
# Surfaces :
#   - mon.essensys.fr/demo/dashboard/  (basename /demo)
#   - demo.essensys.fr/                (racine, VITE_DEMO_ROOT)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUPPORT_SITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ESSENSYS_ROOT="${ESSENSYS_ROOT:-$(cd "$SUPPORT_SITE_ROOT/.." && pwd)}"
SERVER_FE="$ESSENSYS_ROOT/essensys-server-frontend"
DEMO_DASHBOARD_DST="$SUPPORT_SITE_ROOT/site/public/demo/dashboard"
DEMO_ROOT_DST="$SUPPORT_SITE_ROOT/site/public/demo/root"
DEMO_DASHBOARD_BASE="/demo/dashboard/"

if [[ ! -d "$SERVER_FE" ]]; then
  echo "ERR: essensys-server-frontend introuvable: $SERVER_FE" >&2
  exit 1
fi

build_demo() {
  local base="$1"
  local dest="$2"
  local extra_env="${3:-}"

  echo "== build base=$base → $dest =="
  (
    cd "$SERVER_FE"
    export VITE_DEMO_MODE=true
    if [[ -n "$extra_env" ]]; then
      export "$extra_env"
    fi
    npm run build -- --base="$base"
  )
  rm -rf "$dest"/*
  mkdir -p "$dest"
  cp -R "$SERVER_FE/dist/"* "$dest/"
}

echo "== sync-demo-server-frontend =="
echo "  source: $SERVER_FE"

build_demo "$DEMO_DASHBOARD_BASE" "$DEMO_DASHBOARD_DST"
build_demo "/" "$DEMO_ROOT_DST" "VITE_DEMO_ROOT=true"

LEGACY_DEMO="$SUPPORT_SITE_ROOT/site/public/demo/server-frontend"
if [[ -d "$LEGACY_DEMO" ]]; then
  rm -rf "$LEGACY_DEMO"
fi

echo ""
echo "Done. Rebuild support-site puis deploy Ansible :"
echo "  cd $SUPPORT_SITE_ROOT/site && npm run build"
echo "  cd $ESSENSYS_ROOT/essensys-ansible && ansible-playbook -i inventory deploy-roadmap-site.yml"
