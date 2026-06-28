#!/usr/bin/env bash
# Build démo portail distant (essensys-user-portal-frontend) → support-site/public/demo/portal
#
# Surface OVH : https://demo.portal.essensys.fr/ (VITE_DEMO_MODE + VITE_DEMO_ROOT)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUPPORT_SITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ESSENSYS_ROOT="${ESSENSYS_ROOT:-$(cd "$SUPPORT_SITE_ROOT/.." && pwd)}"
PORTAL_FE="$ESSENSYS_ROOT/essensys-user-portal-frontend"
DEMO_PORTAL_DST="$SUPPORT_SITE_ROOT/site/public/demo/portal"

if [[ ! -d "$PORTAL_FE" ]]; then
  echo "ERR: essensys-user-portal-frontend introuvable: $PORTAL_FE" >&2
  exit 1
fi

echo "== sync-demo-portal-frontend =="
echo "  source: $PORTAL_FE"
echo "  dest:   $DEMO_PORTAL_DST"

(
  cd "$PORTAL_FE"
  export VITE_DEMO_MODE=true
  export VITE_DEMO_ROOT=true
  npm run build
)

rm -rf "$DEMO_PORTAL_DST"
mkdir -p "$DEMO_PORTAL_DST"
cp -R "$PORTAL_FE/dist/"* "$DEMO_PORTAL_DST/"

echo ""
echo "Done. Puis rebuild support-site + deploy Ansible (deploy-roadmap-site.yml ou frontend role)."
