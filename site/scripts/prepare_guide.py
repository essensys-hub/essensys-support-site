#!/usr/bin/env python3
"""Prépare le guide utilisateur pour le site (portal-user-guide-2026-10-006).

Source unique : essensys-user-portal-frontend/docs/user-guide/ (index.yml, <slug>.md, images/).
Produit public/guide-data/ : index.json, <slug>.md (liens réécrits) et images/.
Utilisé au déploiement (rôle Ansible frontend) et en local (npm run guide:local).

Usage : prepare_guide.py <portal/docs/user-guide> <site/public/guide-data>
"""

from __future__ import annotations

import json
import re
import shutil
import sys
from pathlib import Path

SLUG = re.compile(r"^[a-z0-9-]+$")


def parse_index(text: str) -> dict:
    """Lit le sous-ensemble YAML du sommaire (title + liste pages) sans dépendance externe."""
    title, pages, current = "", [], None
    for raw in text.splitlines():
        line = raw.split(" #")[0].rstrip() if not raw.lstrip().startswith("#") else ""
        if not line.strip():
            continue
        if line.startswith("title:"):
            title = line.split(":", 1)[1].strip()
        elif line.strip().startswith("- slug:"):
            current = {"slug": line.split(":", 1)[1].strip()}
            pages.append(current)
        elif current is not None and ":" in line and line.startswith("    "):
            key, value = line.strip().split(":", 1)
            current[key.strip()] = value.strip()
    return {"title": title, "pages": pages}


def rewrite(markdown: str, slugs: set[str]) -> str:
    """Images vers /guide-data/images/, liens entre pages vers /guide/<slug>."""
    markdown = re.sub(r"\]\(images/([^)]+)\)", r"](/guide-data/images/\1)", markdown)

    def page_link(match: re.Match) -> str:
        slug = match.group(1)
        return f"](/guide/{slug})" if slug in slugs else match.group(0)

    return re.sub(r"\]\(([a-z0-9-]+)\.md\)", page_link, markdown)


def prepare(src: Path, dest: Path) -> dict:
    index_file = src / "index.yml"
    if not index_file.is_file():
        raise FileNotFoundError(f"sommaire introuvable : {index_file}")
    index = parse_index(index_file.read_text(encoding="utf-8"))
    pages = [p for p in index["pages"] if SLUG.match(p.get("slug", ""))]
    slugs = {p["slug"] for p in pages}
    if dest.exists():
        shutil.rmtree(dest)
    (dest / "images").mkdir(parents=True)
    kept = []
    for page in pages:
        md = src / f"{page['slug']}.md"
        if not md.is_file():
            print(f"page ignorée (fichier absent) : {page['slug']}", file=sys.stderr)
            continue
        (dest / md.name).write_text(rewrite(md.read_text(encoding="utf-8"), slugs), encoding="utf-8")
        kept.append({k: page.get(k, "") for k in ("slug", "title", "summary")})
    for image in sorted((src / "images").glob("*.png")):
        shutil.copy2(image, dest / "images" / image.name)
    data = {"title": index["title"], "pages": kept}
    (dest / "index.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    return data


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print(__doc__, file=sys.stderr)
        return 2
    try:
        data = prepare(Path(argv[1]), Path(argv[2]))
    except FileNotFoundError as exc:
        print(f"Erreur : {exc}", file=sys.stderr)
        return 1
    print(f"Guide préparé : {len(data['pages'])} pages → {argv[2]}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
