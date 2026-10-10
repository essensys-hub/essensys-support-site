import json
import tempfile
import unittest
from pathlib import Path

import prepare_guide as pg

INDEX = """# commentaire
title: Guide du portail
pages:
  - slug: premiers-pas
    title: Premiers pas
    summary: Se connecter.
  - slug: eclairage
    title: Éclairage
    summary: Les lumières.
    screen: /lighting
  - slug: Mauvais Slug
    title: Ignoré
"""


class PrepareGuideTest(unittest.TestCase):
    def make_src(self, root: Path) -> Path:
        src = root / "user-guide"
        (src / "images").mkdir(parents=True)
        (src / "index.yml").write_text(INDEX, encoding="utf-8")
        (src / "premiers-pas.md").write_text("# P\n\nVoir [Éclairage](eclairage.md) et [ailleurs](autre.md).\n", encoding="utf-8")
        (src / "eclairage.md").write_text("# E\n\n![capture](images/eclairage-desktop.png)\n", encoding="utf-8")
        (src / "images" / "eclairage-desktop.png").write_bytes(b"png")
        return src

    def test_order_titles_and_unsafe_slug_dropped(self):
        with tempfile.TemporaryDirectory() as tmp:
            src = self.make_src(Path(tmp))
            data = pg.prepare(src, Path(tmp) / "out")
            self.assertEqual([p["slug"] for p in data["pages"]], ["premiers-pas", "eclairage"])
            self.assertEqual(json.loads((Path(tmp) / "out" / "index.json").read_text())["pages"][1]["title"], "Éclairage")

    def test_images_and_page_links_are_rewritten(self):
        with tempfile.TemporaryDirectory() as tmp:
            src = self.make_src(Path(tmp))
            out = Path(tmp) / "out"
            pg.prepare(src, out)
            self.assertIn("](/guide-data/images/eclairage-desktop.png)", (out / "eclairage.md").read_text())
            first = (out / "premiers-pas.md").read_text()
            self.assertIn("](/guide/eclairage)", first)
            self.assertIn("](autre.md)", first)  # lien vers une page inconnue laissé tel quel
            self.assertTrue((out / "images" / "eclairage-desktop.png").exists())

    def test_missing_source_is_reported(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(FileNotFoundError):
                pg.prepare(Path(tmp) / "absent", Path(tmp) / "out")
            self.assertEqual(pg.main(["x", str(Path(tmp) / "absent"), str(Path(tmp) / "out")]), 1)


if __name__ == "__main__":
    unittest.main()
