# Authentification OAuth

Le support site utilise OAuth2 pour authentifier les administrateurs.
Deux fournisseurs sont supportés : **Google** et **Apple**.

> [!IMPORTANT]
> Seules les adresses emails listées dans la variable `ADMIN_EMAILS` du fichier `.env` sont autorisées à se connecter.

## Google OAuth

### Configuration Google Cloud Console
1. Créer un projet sur la [Google Cloud Console](https://console.cloud.google.com/).
2. Configurer l'écran de consentement OAuth (User Type: Externe).
3. Créer des identifiants **Client OAuth 2.0**.
4. **URIs de redirection autorisés** :
   Il est impératif d'ajouter l'URL exacte de callback :
   `https://mon.essensys.fr/api/auth/google/callback`

### Variables `.env`
- `GOOGLE_CLIENT_ID`: L'ID Client fourni par Google.
- `GOOGLE_CLIENT_SECRET`: Le Code Secret Client.
- `GOOGLE_REDIRECT_URL`: L'URL complète de callback (doit correspondre à celle déclarée sur Google).

---

## Apple OAuth (Sign In with Apple)

Apple est plus complexe car il nécessite une clé privée `.p8` et gère les callbacks en méthode `POST`.

### Configuration Apple Developer Portal
1. Créer un **App ID** (ex: `fr.essensys.app`).
2. Créer un **Service ID** (ex: `fr.essensys.web`).
   - Activer "Sign In with Apple".
   - Dans "Configure", lier à l'App ID principal.
   - **Domains and Subdomains** : `mon.essensys.fr` (sans https).
   - **Return URLs** : `https://mon.essensys.fr/api/auth/apple/callback`.
3. Vérifier le domaine :
   - Télécharger le fichier de vérification Apple.
   - Le placer dans le dossier servi par Nginx pour qu'il soit accessible via `https://mon.essensys.fr/.well-known/apple-developer-domain-association.txt`.
4. Créer une **Key** (Clé Privée) :
   - Cocher "Sign in with Apple".
   - Télécharger le fichier `.p8` (Attention, téléchargeable une seule fois !).
   - Noter le **Key ID**.

### Variables `.env`
- `APPLE_TEAM_ID`: Votre Team ID Apple (ex: `J32285QB9J`).
- `APPLE_CLIENT_ID`: Le **Service ID** créé à l'étape 2 (ex: `fr.essensys.web`).
- `APPLE_KEY_ID`: L'ID de la clé (étape 4).
- `APPLE_KEY_FILE`: Chemin absolu vers le fichier `.p8` sur le serveur (ex: `/home/ubuntu/AuthKey_xxxx.p8`).
- `APPLE_REDIRECT_URL`: L'URL complète de callback.

> [!WARNING]
> Apple renvoie la réponse d'authentification via une requête **POST**.
> Le Backend a été configuré pour gérer spécifiquement ce cas (Cookie `SameSite=None`), mais cela peut causer des erreurs 405 si Nginx ou le routeur bloquent les POST sur cette URL.
