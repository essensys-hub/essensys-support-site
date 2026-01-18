# Audit Trail (Journaux d'Activité)

La fonctionnalité **Audit Trail** permet de tracer les actions critiques effectuées sur la plateforme pour des raisons de sécurité et de conformité.

## Événements Enregistrés

Le système enregistre automatiquement les événements suivants :

*   **Authentification** :
    *   `LOGIN` : Connexion réussie.
    *   `LOGIN_FAILED` : Échec de connexion (mauvais mot de passe, utilisateur inconnu).
    *   `REGISTER` : Inscription d'un nouvel utilisateur.
    *   `LOGOUT` : Déconnexion (explicite).
*   **Administration** :
    *   `UPDATE_ROLE` : Modification du rôle d'un utilisateur.
    *   `CREATE_USER` : Création manuelle d'un utilisateur par un admin.

## Données Collectées

Pour chaque événement, nous stockons :
*   **Date/Heure** de l'événement.
*   **Utilisateur** (Nom d'utilisateur/Email et ID).
*   **Adresse IP** source.
*   **Action** (Type d'opération).
*   **Détails** (Description contextuelle, valeurs avant/après si applicable).

## Accès et Permissions

L'accès aux journaux d'audit est en **lecture seule** et restreint selon le rôle :

*   **Global Admin** (`admin_global`) : Accès à **tous** les journaux de la plateforme.
*   **Local Admin** (`admin_local`) : Accès restreint aux journaux concernant les utilisateurs liés à sa **machine locale** (armoire Essensys).
*   **Autres** : Aucun accès.

Ces règles garantissent que chaque administrateur local ne voit que ce qui concerne son périmètre.
