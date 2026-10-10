# Guide du portail

## Objectif

Expliquer chaque écran du portail mon.essensys.fr aux utilisateurs Essensys, avec une capture annotée.

## Où le trouver

- www.essensys.fr/guide (sommaire) et www.essensys.fr/guide/<écran>.
- Liens : menu « Guide » (connecté), page Support, page Profil.

## Fonctionnalités

- 13 pages : Premiers pas, Connexion, Tableau de bord, Éclairage, Volets, Chauffage, Chauffe-eau, Arrosage, Scénarios, Sécurité, Notifications, Réglages, Profil et signalements.
- Source unique : `essensys-user-portal-frontend/docs/user-guide/`, préparée au déploiement par `site/scripts/prepare_guide.py` dans `/guide-data/`. En local : `npm run guide:local`.

## Permissions

Réservé aux comptes connectés : un visiteur est invité à se connecter et revient sur la page demandée.

## Limites connues

Les fichiers `/guide-data/` sont statiques : ils ne contiennent que des données fictives et ne sont pas indexés (`X-Robots-Tag: noindex`, `robots.txt`).

## Liens

- Change OpenSpec : `essensys-memory/openspec/changes/portal-user-guide-2026-10-006/`
