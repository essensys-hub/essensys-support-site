## 1. Bootstrap lifecycle dans essensys-support-site

- [x] 1.1 Créer `features/schema/feature.schema.json` (copie depuis essensys-server-frontend)
- [x] 1.2 Créer `scripts/feature_lifecycle/validate_feature_manifests.py` et `check_feature_gate.py`
- [x] 1.3 Créer `AGENTS.md` avec contexte lifecycle

## 2. CSS responsive — Layout.css (navigation)

- [ ] 2.1 Ajouter breakpoint iPad `@media (768px ≤ width ≤ 1024px)` dans `site/src/components/Layout.css`
- [ ] 2.2 Ajouter styles hamburger button (`.hamburger-btn`, `.nav-overlay`) dans `Layout.css`
- [ ] 2.3 Masquer hamburger sur desktop via `display: none` sur `≥ 769px`

## 3. CSS responsive — Support.css (page support)

- [ ] 3.1 Enrichir `@media (max-width: 600px)` avec font-size iPhone et overflow-x hidden
- [ ] 3.2 Ajouter breakpoint iPad `@media (max-width: 1024px)` avec card full-width et tap targets

## 4. Layout.jsx — menu hamburger

- [ ] 4.1 Ajouter `menuOpen` state et bouton hamburger avec `aria-expanded`
- [ ] 4.2 Fermer le menu au clic sur un lien (`onClick={() => setMenuOpen(false)}`)
- [ ] 4.3 Appliquer classe conditionnelle `nav-open` sur la `<nav>`

## 5. Tests Playwright — configuration et specs

- [ ] 5.1 Installer Playwright dans `site/` si absent, ajouter projects `desktop`, `iphone`, `ipad` dans `playwright.config.js`
- [ ] 5.2 Créer `site/e2e/support-responsive.spec.js` avec tests desktop + iPhone + iPad
- [ ] 5.3 Créer `site/e2e/fixtures/no-armoire.js` (interception sécurité, par cohérence lifecycle)

## 6. Feature manifest et documentation

- [ ] 6.1 Créer `features/essensys-support-nav-responsive-2026-06-032.json`
- [ ] 6.2 Créer `docs/features/support-nav-responsive.md` (user guide)
- [ ] 6.3 Valider manifest + gate

## 7. Build et validation finale

- [ ] 7.1 `npm run lint` dans `site/` — zéro nouvelle erreur
- [ ] 7.2 `npm run build` dans `site/` — succès
- [ ] 7.3 `python3 scripts/feature_lifecycle/validate_feature_manifests.py` — PASS
- [ ] 7.4 `python3 scripts/feature_lifecycle/check_feature_gate.py --strict` — OK
- [ ] 7.5 Synchroniser `essensys-memory/OKF`
