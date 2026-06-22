#!/usr/bin/env bash
# Rebuild la démo statique mockée (essensys-server-frontend) et la copie dans le support-site.
# Déployée sur mon.essensys.fr sous /demo/server-frontend/ (alias court /dashboard).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUPPORT_SITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ESSENSYS_ROOT="${ESSENSYS_ROOT:-$(cd "$SUPPORT_SITE_ROOT/.." && pwd)}"
SERVER_FE="$ESSENSYS_ROOT/essensys-server-frontend"
DEMO_DST="$SUPPORT_SITE_ROOT/site/public/demo/server-frontend"
DEMO_BASE="/demo/server-frontend/"

if [[ ! -d "$SERVER_FE" ]]; then
  echo "ERR: essensys-server-frontend introuvable: $SERVER_FE" >&2
  exit 1
fi

echo "== sync-demo-server-frontend =="
echo "  source: $SERVER_FE"
echo "  dest:   $DEMO_DST"
echo "  base:   $DEMO_BASE"

cd "$SERVER_FE"
VITE_DEMO_MODE=true npm run build -- --base="$DEMO_BASE"

rm -rf "$DEMO_DST"/*
mkdir -p "$DEMO_DST"
cp -R "$SERVER_FE/dist/"* "$DEMO_DST/"

echo "Done. Rebuild support-site puis deploy Ansible frontend :"
echo "  cd $SUPPORT_SITE_ROOT/site && npm run build"
echo "  cd $ESSENSYS_ROOT/essensys-ansible && ansible-playbook deploy-roadmap-site.yml -l production"
