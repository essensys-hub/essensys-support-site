#!/usr/bin/env bash
# Copie les captures du site (e2e/guide-screenshots.spec.js) dans le guide du portail,
# source unique du guide utilisateur (portal-user-guide-2026-10-006).
# Usage : scripts/sync-guide-screenshots.sh [chemin/vers/essensys-user-portal-frontend]
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORTAL="${1:-$HERE/../../essensys-user-portal-frontend}"
DEST="$PORTAL/docs/user-guide/images"
[ -d "$DEST" ] || { echo "Dossier du guide introuvable : $DEST" >&2; exit 1; }
count=0
for f in "$HERE"/guide-screenshots/*.png; do
  [ -e "$f" ] || { echo "Aucune capture : lancer d'abord GUIDE_SCREENSHOTS=1 npx playwright test e2e/guide-screenshots.spec.js --project desktop" >&2; exit 1; }
  cp "$f" "$DEST/"; count=$((count + 1))
done
echo "$count capture(s) copiée(s) dans $DEST"
