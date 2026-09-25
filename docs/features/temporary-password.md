# Mot de passe temporaire administrateur

> Feature : `essensys-temporary-password-2026-09-040`
> OpenSpec : `essensys-memory/openspec/changes/essensys-temporary-password-2026-09-040/`

## Résumé

Solution de dépannage pour un utilisateur qui ne peut pas récupérer l'accès à son compte par le lien de réinitialisation habituel (adresse email erronée, boîte inaccessible, domaine qui rejette le relais SMTP…). L'administrateur émet un mot de passe temporaire depuis la console, le lit une seule fois à l'écran et le transmet de vive voix. L'utilisateur est contraint de le remplacer dès sa première connexion.

Ce n'est **pas** le chemin par défaut : tant que l'utilisateur reçoit ses emails, « Envoyer un lien de réinitialisation » (déjà existant dans le même menu) reste la solution à privilégier — elle ne nécessite pas de contact vocal et ne fait transiter aucun secret réutilisable.

## Émettre un mot de passe temporaire

1. Aller dans **Administration → Utilisateurs**.
2. Sur la ligne du compte concerné, ouvrir le menu **⋯**.
3. Choisir **Définir un mot de passe temporaire…**.
4. Une confirmation rappelle l'adresse du compte et prévient que le mot de passe actuel sera définitivement remplacé.
5. Cocher **Envoyer aussi par email** uniquement si vous savez que la boîte du compte est joignable — la case est décochée par défaut.
6. Valider. Le mot de passe s'affiche **une seule fois**, en clair, avec sa date d'expiration (72 heures) et un bouton **Copier**.

Un compte muni d'un mot de passe temporaire en attente porte le badge **« MDP temporaire »** dans la liste des utilisateurs.

## Transmettre le mot de passe par téléphone

Le mot de passe est composé de 12 caractères choisis pour être dictés sans ambiguïté : ni `O`/`0`, ni `I`/`l`/`1` n'y figurent. Il reste néanmoins prudent de :

- **vérifier l'identité de l'interlocuteur** avant de le communiquer — c'est la seule protection contre un appel frauduleux, rien côté logiciel ne peut s'en charger ;
- épeler le mot de passe lettre par lettre, en précisant majuscule/minuscule ;
- rappeler qu'il devra en choisir un nouveau dès sa connexion, et qu'il ne pourra rien faire d'autre tant que ce n'est pas fait.

## Que se passe-t-il ensuite

- **Toute session déjà ouverte sur ce compte est immédiatement bloquée** — pas seulement les nouvelles connexions.
- À la connexion avec le mot de passe temporaire, l'utilisateur est automatiquement redirigé vers un écran de changement de mot de passe, sans accès au reste de l'application.
- Si un lien de réinitialisation était encore actif sur ce compte, il est invalidé au moment de l'émission — les deux voies d'accès ne coexistent jamais.
- Une fois le changement effectué, l'accès normal reprend **sans reconnexion**.

## À l'expiration (72 heures)

Passé ce délai, le mot de passe temporaire ne fonctionne plus. L'ancien mot de passe n'est **pas** restauré — il a été définitivement écrasé à l'émission. Deux options :

- réémettre un nouveau mot de passe temporaire depuis le même menu ;
- ou, si l'utilisateur a retrouvé l'accès à sa boîte mail entre-temps, utiliser plutôt « Envoyer un lien de réinitialisation ».

## Traçabilité

Chaque émission est journalisée (`TEMPORARY_PASSWORD_ISSUED`, visible dans **Audit Trail**) avec l'administrateur émetteur et le compte visé — jamais le mot de passe lui-même. Le changement effectué par l'utilisateur est également journalisé (`PASSWORD_CHANGED_AFTER_TEMPORARY`).

## Liens

- Spécification : `essensys-memory/openspec/changes/essensys-temporary-password-2026-09-040/`
- Fonctionnalité voisine : réinitialisation par lien email (`essensys-password-reset-2026-08-039`)
