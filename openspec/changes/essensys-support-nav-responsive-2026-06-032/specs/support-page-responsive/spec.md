## ADDED Requirements

### Requirement: Page Support adaptée iPad (768–1024px)

La card de support SHALL occuper toute la largeur disponible sur iPad avec marges latérales.

#### Scenario: Largeur de la card sur iPad
- **WHEN** La page `/support` est affichée sur iPad (768–1024px)
- **THEN** La `.support-card` MUST avoir `max-width: 100%` avec `margin: 0 24px`
- **THEN** Le titre `.support-title` MUST avoir `font-size: 1.8rem`

#### Scenario: Liens du support touch-friendly sur iPad
- **WHEN** L'utilisateur affiche la page Support sur iPad
- **THEN** Les `.support-doc-link` MUST avoir un padding vertical ≥ 12px

### Requirement: Page Support adaptée iPhone (≤ 480px)

La card de support SHALL être lisible et utilisable sur iPhone.

#### Scenario: Padding réduit sur iPhone
- **WHEN** La page `/support` est affichée sur iPhone (≤ 480px)
- **THEN** La `.support-card` MUST avoir `padding: 20px`
- **THEN** Le `.support-title` MUST avoir `font-size: 1.4rem`
- **THEN** Le `.support-subtitle` MUST avoir `font-size: 0.9rem`

#### Scenario: Pas de scroll horizontal sur iPhone
- **WHEN** La page `/support` est affichée sur iPhone
- **THEN** Aucun élément ne SHALL déborder la largeur de la fenêtre (`overflow-x: hidden`)
