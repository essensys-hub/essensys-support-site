# Spécifications : Service de Monitoring Passif Essensys

Ce document définit les spécifications techniques pour l'implémentation du serveur de monitoring passif pour les clients IoT legacy Essensys.

## 1. Principes Fondamentaux

*   **Service Passif uniquement** : Le serveur ne doit JAMAIS envoyer de commandes ou d'actions aux clients IoT.
*   **Compatibilité Legacy** : Le serveur doit implémenter strictement le protocole d'authentification et les formats de données existants.
*   **Architecture** :
    *   **Frontend** : Nginx (Reverse Proxy + Static Files)
    *   **Backend** : Go (API collecte passive)
    *   **Visualisation** : React SPA (Admin dashboard)
    *   **Stockage** : Redis (Temps réel/Cache) + PSQL (Persistance optionnelle)
    *   **Localisation** : Tout le code (Backend Go + Frontend React) doit être dans `essensys-support-site`.

> [!IMPORTANT]
> **Périmètre du projet** : Ce développement est spécifique au site de support. Il ne doit PAS modifier ou être intégré dans le dépôt principal `essensys-server-backend`.


---

## 2. Protocole d'Authentification (Legacy Basic Auth)

Les clients IoT utilisent une implémentation spécifique de Basic Auth qui doit être respectée à la lettre.

### 2.1. Génération des Credentials (Côté Client IoT)

1.  **Clé Serveur** : 16 octets lus depuis l'EEPROM.
2.  **Hexadécimal** : Conversion en une chaîne de 32 caractères hexadécimaux.
3.  **MD5** : Calcul du hash MD5 de cette chaîne (résultat : 16 octets).
4.  **Découpage (Username/Password)** :
    *   `username` = Les 8 premiers octets du MD5 (convertis en 16 chars hex).
    *   `password` = Les 8 derniers octets du MD5 (convertis en 16 chars hex).
5.  **Format Basic Auth** : `username:password` (Séparés par deux-points).
6.  **Encodage** : Encodage Base64 standard de la chaîne `username:password`.
7.  **Header** : `Authorization: Basic <Base64_String>`.

### 2.2. Validation (Côté Serveur Go)

Le serveur doit :
1.  **Décoder** le header `Authorization: Basic ...`.
2.  **Extraire** `username` et `password`.
3.  **Reconstituer** le hash complet : `hashed_pkey = username + password` (concaténation directe, doit faire 32 chars hex).
4.  **Vérifier** en base de données :
    *   Trouver la machine où `es_machine.hashed_pkey == calcul_ci_dessus`.
    *   Vérifier que `es_machine.is_active` est `TRUE`.

### 2.3. Gestion des Erreurs d'Authentification

*   En cas d'échec (machine non trouvée, inactive, mauvais hash) :
    *   **Code HTTP** : `401 Unauthorized`
    *   **Header Obligatoire** : `WWW-Authenticate: Basic` (Sans ce header, le client legacy ne tentera jamais de s'authentifier).

---

## 3. API Endpoints (Mode Passif)

### 3.1. GET /api/serverinfos (Ping / Status)

Permet au client de vérifier la connexion et de récupérer les indices à envoyer.

*   **Auth** : Requise (Basic Auth Legacy).
*   **Header Requis** : `Accept: application/json...`

**Réponse JSON attendue :**

```json
{
  "isconnected": false,    // Toujours false (pas d'interaction utilisateur active requise)
  "infos": [               // Liste des indices de la Table d'Échange à collecter
    363, 349, 350, 351, 
    352, 353, 11, 920
  ],
  "newversion": "no"       // "no" ou "Vxxx" pour update firmware (Optionnel : "no" par défaut)
}
```

### 3.2. POST /api/mystatus (Collecte Données)

Le client envoie les données demandées dans `infos`.

*   **Auth** : Requise.
*   **Payload JSON :**

```json
{
  "version": "V125",       // Version du firmware client
  "ek": [                  // Tableau des données (Exchange Keys)
    {"k": 349, "v": "25"},       // k=Indice, v=Valeur (TOUJOURS en String)
    {"k": 363, "v": "01001100"}, // Certaines valeurs sont des bitmasks binaires (ex: Alertes)
    {"k": 350, "v": "1"}
  ]
}
```

*   **Traitement** : Le serveur stocke ces données (Redis/DB) pour l'affichage temps réel.
*   **Format des Valeurs** :
    *   Notez que `v` est toujours une chaîne.
    *   Pour les indices comme `363` (Alertes), la valeur est une représentation binaire string (ex: "01001100").

**Réponse JSON attendue :**

```http
HTTP/1.1 201 Created
Content-Type: application/json
Content-Length: 0

(Corps vide)
```

### 3.3. GET /api/myactions (Non Implémenté)

*   ❌ **Endpoint NON géré** dans ce service passif.
*   Si le client appelle cet endpoint, retourner 200 OK avec une liste d'actions vide ou 404, mais aucune action ne doit être générée.

## 4. Rôles et Responsabilités

### Frontend (Nginx)
*   Port 80.
*   Sert les fichiers statiques React (`/admin`, `/`).
*   Proxy `Bypass` pour `/api/*` vers le service Go.

### Backend (Go)
*   Port interne (ex: 8080).
*   Implémente `BasicAuthDB`.
*   Endpoint `/api/serverinfos` : Renvoie la config de collecte.
*   Endpoint `/api/mystatus` : Parse et stocke les données `ek`.
*   **Strictement Passif** : Ne génère jamais de commandes vers le client.

### Interface Admin (React)
*   **Authentification** : Token (JWT ou simple) pour accès admin humaine.
*   **Dashboard** :
    *   Carte de France (Géolocalisation IP).
    *   Liste des clients connectés (Time Real).
    *   Stats (Versions firmware, Types équipement).
*   **Lecture Seule** : Aucune interaction possible avec les équipements.