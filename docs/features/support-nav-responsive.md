# Support & Navigation — Responsive iPhone / iPad / Desktop

> Feature : `essensys-support-nav-responsive-2026-06-032`
> OpenSpec : `openspec/changes/essensys-support-nav-responsive-2026-06-032/`

## Résumé

Amélioration de l'adaptation responsive de la navigation principale et de la page Support du site `mon.essensys.fr` pour les formats iPhone, iPad, et ordinateur.

## Ce qui a changé

### Navigation (header)

| Format | Comportement |
|---|---|
| **Ordinateur** (> 1024px) | Liens horizontaux, sans changement |
| **iPad** (768–1024px) | Liens plus compacts, espacements réduits |
| **iPhone** (≤ 768px) | Bouton **☰ menu** à droite du logo. Tap → menu vertical qui s'ouvre. Tap sur un lien → menu se ferme et navigation se fait. |

### Page Support

| Format | Amélioration |
|---|---|
| **iPad** | Card pleine largeur avec marges, titre 1.8rem, liens touch-friendly (min 44px) |
| **iPhone** | Padding réduit, titre 1.4rem, sous-titre 0.9rem, overflow-x masqué |

## Utilisation du menu hamburger (iPhone)

1. Appuyez sur le bouton **☰** en haut à droite.
2. Le menu s'ouvre et affiche tous les liens en colonne.
3. Appuyez sur un lien pour naviguer. Le menu se referme automatiquement.
4. Pour fermer sans naviguer, appuyez de nouveau sur **✕**.

## Tests de non-régression

Des tests Playwright couvrent les 3 formats (desktop, iPhone 14, iPad Pro). Pour les lancer localement :

```bash
cd site
npm run preview &
npx playwright test --project=desktop
npx playwright test --project=iphone
npx playwright test --project=ipad
```
