# Signaler un problème

## Objectif

Permettre à tout utilisateur Essensys connecté de signaler un bug logiciel ou un incident sur son installation, sans compte GitHub.

## Où le trouver

- Page d'accueil, section « Signaler un bug ou un incident » : les cartes **Bug logiciel** et **Incident production** ouvrent le formulaire.
- Adresse directe : `/signaler` (`/signaler?type=incident` pour un incident).
- Suivi : **Mon profil**, rubrique **Mes signalements**.

## Fonctionnalités

- **Bug logiciel** : application concernée, version, mode de connexion, ce qui se passe, ce qui était attendu, étapes pour reproduire.
- **Incident sur mon installation** : ce qui est touché, depuis quand, mode de connexion, ce qui se passe, ce qui a déjà été essayé.
- Un avertissement, affiché en tête du formulaire, rappelle de ne jamais saisir d'adresse postale, de mot de passe ni de code d'accès.
- Si un texte ressemble à un mot de passe, une clé, un email ou une adresse postale, le serveur le refuse. Le message s'affiche sous le champ concerné et la saisie est conservée.
- Après l'envoi, une référence `R-…` s'affiche. **Mes signalements** montre l'état : en attente d'envoi, ouvert, résolu ou clos.

## Permissions

Réservé aux comptes connectés. Un visiteur est invité à se connecter.

## Limites connues

- 5 signalements au plus par 24 heures et par compte.
- Les bugs sont publiés de façon anonyme sur GitHub (`essensys-support-site`). Les incidents restent dans un dépôt privé et n'ont pas de lien public.
- Pas de pièce jointe, et pas de réponse du mainteneur sur le site : seul l'état est affiché.

## Liens

- API : `essensys-user-portal-backend/docs/features/support-reports.md`
- Change OpenSpec : `essensys-memory/openspec/changes/support-reports-2026-10-004/`
