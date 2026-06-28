## Why

La page Support (`/support`) et la navigation principale du site `mon.essensys.fr` ne s'adaptent pas correctement aux différents formats d'écran : iPhone, iPad, et ordinateur. Sur iPhone, le menu de navigation déborde ou s'écrase ; sur iPad, la mise en page intermédiaire n'est pas gérée ; sur ordinateur, le layout est correct mais sans breakpoints tablette définis.

Ce problème affecte directement l'expérience des utilisateurs finaux qui accèdent au support depuis un mobile ou une tablette — usage fréquent dans un contexte domotique.

## What Changes

- `site/src/components/Layout.css` : ajout d'un breakpoint iPad (768–1024px) et refonte du menu mobile avec hamburger natif CSS.
- `site/src/pages/Support.css` : ajout des breakpoints iPhone (`<= 480px`) et iPad (`481–1024px`), ajustement padding/font-size/card-width.
- `site/src/components/Layout.jsx` : ajout d'un bouton hamburger (`<button>`) pour mobile, état `menuOpen` avec `useState`, fermeture au clic d'un lien.
- `e2e/` : configuration Playwright multi-device + tests de non-régression pour `/support` sur desktop, iPhone 14, iPad Pro.

## Capabilities

### New Capabilities
- `support-nav-mobile`: navigation responsive avec menu hamburger sur iPhone/iPad
- `support-page-responsive`: page Support adaptée iPad et iPhone (padding, font-size, card-width)
- `ux-regression-matrix`: tests Playwright desktop + iphone + ipad sur la page Support et la navigation
