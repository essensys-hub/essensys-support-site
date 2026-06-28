## ADDED Requirements

### Requirement: Matrice Playwright desktop + iPhone + iPad pour la page Support et la navigation

Des tests Playwright MUST couvrir les 3 formats pour prévenir toute régression.

#### Scenario: Test desktop — navigation et page Support
- **WHEN** Les tests Playwright tournent avec le project `desktop` (1280×800)
- **THEN** La nav MUST afficher tous les liens horizontalement
- **THEN** Le bouton hamburger SHALL être absent (invisible)
- **THEN** La page `/support` MUST afficher les sections Installation et Dépannage

#### Scenario: Test iPhone — navigation hamburger et page Support
- **WHEN** Les tests Playwright tournent avec le project `iphone` (390×844, userAgent iPhone)
- **THEN** Le bouton hamburger MUST être visible
- **THEN** Taper sur le hamburger MUST ouvrir le menu avec tous les liens
- **THEN** La page `/support` SHALL s'afficher sans scroll horizontal

#### Scenario: Test iPad — navigation et page Support
- **WHEN** Les tests Playwright tournent avec le project `ipad` (1024×1366, userAgent iPad)
- **THEN** La page `/support` MUST s'afficher correctement (card pleine largeur)
- **THEN** Les liens de navigation SHALL être accessibles

#### Scenario: Non-régression — desktop inchangé
- **WHEN** Les tests desktop tournent après le fix responsive
- **THEN** La page Support MUST charger et afficher deux sections
- **THEN** Aucune erreur console SHALL apparaître
