#!/usr/bin/env bash
# Rebuild la démo domotique locale mockée (essensys-server-frontend) → support-site/public/demo/dashboard
#
# Surfaces OVH :
#   - mon.essensys.fr/demo/dashboard/  (local CM5/Raspberry — mock VITE_DEMO_MODE)
# Support-site démo : demo.essensys.fr → build support-site complet (rôle demo_site Ansible)
# Portail distant démo : demo.portal.essensys.fr → scripts/sync-demo-portal-frontend.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUPPORT_SITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ESSENSYS_ROOT="${ESSENSYS_ROOT:-$(cd "$SUPPORT_SITE_ROOT/.." && pwd)}"
SERVER_FE="$ESSENSYS_ROOT/essensys-server-frontend"
DEMO_DASHBOARD_DST="$SUPPORT_SITE_ROOT/site/public/demo/dashboard"
DEMO_DASHBOARD_BASE="/demo/dashboard/"

if [[ ! -d "$SERVER_FE" ]]; then
  echo "ERR: essensys-server-frontend introuvable: $SERVER_FE" >&2
  exit 1
fi

build_demo() {
  local base="$1"
  local dest="$2"

  echo "== build base=$base → $dest =="
  (
    cd "$SERVER_FE"
    export VITE_DEMO_MODE=true
    npm run build -- --base="$base"
  )
  rm -rf "$dest"/*
  mkdir -p "$dest"
  cp -R "$SERVER_FE/dist/"* "$dest/"
}

echo "== sync-demo-server-frontend (local only) =="
echo "  source: $SERVER_FE"

build_demo "$DEMO_DASHBOARD_BASE" "$DEMO_DASHBOARD_DST"

LEGACY_DEMO="$SUPPORT_SITE_ROOT/site/public/demo/server-frontend"
if [[ -d "$LEGACY_DEMO" ]]; then
  rm -rf "$LEGACY_DEMO"
fi

LEGACY_ROOT="$SUPPORT_SITE_ROOT/site/public/demo/root"
if [[ -d "$LEGACY_ROOT" ]]; then
  echo "  note: public/demo/root conservé pour migration — demo.essensys.fr = support-site désormais"
fi

echo ""
echo "Done. Rebuild support-site puis deploy Ansible :"
echo "  cd $SUPPORT_SITE_ROOT/site && npm run build"
echo "  cd $ESSENSYS_ROOT/essensys-ansible && ansible-playbook -i inventory deploy-roadmap-site.yml"
