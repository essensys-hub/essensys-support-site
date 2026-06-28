## Context

Le site support `mon.essensys.fr` est une SPA React (Vite). La navigation principale est dans `Layout.jsx` / `Layout.css`. La page support est `Support.jsx` / `Support.css`. Actuellement :

- Un seul breakpoint `@media (max-width: 768px)` dans Layout.css (wraps nav mais pas de hamburger)
- Un seul breakpoint `@media (max-width: 600px)` dans Support.css (padding réduit uniquement)
- Aucun breakpoint iPad (768–1024px) ni iPhone spécifique (≤ 480px)
- La nav affiche tous les liens en wrap sur mobile, sans menu toggle — layout cassé sur iPhone 375–430px

## Goals / Non-Goals

**Goals:**
- Menu hamburger CSS-natif sur mobile (≤ 768px) : icône ☰ / ✕, overlay menu vertical
- Breakpoints iPad (768–1024px) : nav compacte, support card full-width avec marges
- Breakpoints iPhone (≤ 480px) : font-size réduit, padding minimal, liens touch-friendly (min 44px tap target)
- Tests Playwright desktop (1280×800) + iPhone 14 (390×844) + iPad Pro (1024×1366)
- Zéro régression sur desktop

**Non-Goals:**
- Refonte visuelle (couleurs, typographie globale)
- Support RTL ou i18n
- Changement du backend ou de l'API

## Decisions

1. **CSS-only hamburger via `<details>`/`<summary>`** : évite useState et re-renders, mais l'accessibilité est limitée. On choisit plutôt `useState menuOpen` dans Layout.jsx pour un `aria-expanded` correct.
2. **Breakpoints choisis** : `480px` (iPhone landscape/portrait), `768px` (iPad mini/Air portrait), `1024px` (iPad Pro portrait / petits laptops).
3. **Support.card** : passe à `max-width: 100%` sur mobile et `max-width: 480px` sur iPad pour garder une largeur raisonnable.
4. **Playwright** : on installe Playwright dans `site/` (déjà `package.json`) avec projects `desktop`, `iphone`, `ipad`.

## Risks / Trade-offs

- `Layout.jsx` modifié pour ajouter `menuOpen` state — risque de régression sur desktop : couvert par le test Playwright desktop.
- Le CSS hamburger doit être invisible sur desktop : risque de `display: none` mal ciblé — vérifié via snapshot desktop.
