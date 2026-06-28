## ADDED Requirements

### Requirement: Menu hamburger visible sur mobile (≤ 768px)

Le menu de navigation principal SHALL être caché sur mobile et MUST être accessible via un bouton hamburger.

#### Scenario: Affichage du bouton hamburger sur iPhone
- **WHEN** La fenêtre a une largeur ≤ 768px
- **THEN** Un bouton hamburger (☰) est visible dans le header
- **THEN** Les liens de navigation (`Accueil`, `Support`, `Blog`, etc.) sont masqués par défaut

#### Scenario: Ouverture du menu hamburger
- **WHEN** L'utilisateur tape sur le bouton hamburger
- **THEN** Le menu s'ouvre et affiche tous les liens en colonne verticale
- **THEN** Le bouton affiche l'icône ✕

#### Scenario: Fermeture du menu après clic sur un lien
- **WHEN** L'utilisateur tape sur un lien du menu ouvert
- **THEN** Le menu se ferme
- **THEN** La navigation vers la page cible s'effectue

#### Scenario: Menu absent sur desktop
- **WHEN** La fenêtre a une largeur ≥ 1024px
- **THEN** Le bouton hamburger est invisible (`display: none`)
- **THEN** Les liens de navigation sont affichés horizontalement

### Requirement: Tap targets accessibles sur mobile

Chaque lien de navigation MUST avoir une zone de tap ≥ 44×44px sur mobile.

#### Scenario: Taille des liens nav sur iPhone
- **WHEN** La page est affichée sur iPhone (largeur 390px)
- **THEN** Chaque lien `<a>` du menu a une hauteur minimale de 44px
