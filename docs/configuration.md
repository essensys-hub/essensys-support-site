# Configuration Système

## Base de Données (PostgreSQL)

Le backend utilise **PostgreSQL** pour stocker les données persistantes.
L'installation est automatisée via le script `./install.sh`.

- **Utilisateur** : `essensys`
- **Base de données** : `essensys`
- **Port** : 5432 (port par défaut, accessible uniquement en localhost pour sécurité)

Si vous devez y accéder manuellement sur le VPS :
```bash
sudo -u postgres psql -d essensys
```

## Sauvegardes (Backups)

Une stratégie de sauvegarde automatique est configurée par le script d'installation.

- **Fréquence** : **Quotidienne** (tous les jours à 03h00 du matin).
- **Emplacement** : `/var/backups/essensys/`
- **Rétention** : **200 jours** (les fichiers plus vieux sont supprimés automatiquement).
- **Format** : Fichiers compressés `.sql.gz` contenant un dump complet de la base.

### Restauration
Pour restaurer un backup :
1. Décompresser le fichier : `gunzip essensys_db_YYYYMMDD_HHMMSS.sql.gz`
2. Restaurer : `psql -U essensys -d essensys < essensys_db_YYYYMMDD_HHMMSS.sql`

## Variables d'Environnement (`.env`)

Le fichier `.env` situé dans `backend/` (et lu par systemd) configure l'application.
Le fichier `.env.template` sert de référence.

### Configuration Générale
- `PORT`: Port d'écoute du backend (ex: 8080).
- `FRONTEND_URL`: URL publique du frontend (ex: `https://mon.essensys.fr/`).

### Base de Données
- `DB_HOST`: Host de la DB (ex: `localhost`).
- `DB_PORT`: Port (ex: 5432).
- `DB_USER`: Utilisateur DB (ex: `essensys`).
- `DB_PASSWORD`: Mot de passe DB.
- `DB_NAME`: Nom de la base (ex: `essensys`).

### SMTP (Emails)
- `SMTP_HOST`: Serveur SMTP (ex: `mail.infomaniak.com`).
- `SMTP_PORT`: Port SMTP (ex: 465 ou 587).
- `SMTP_USER`: Email d'envoi.
- `SMTP_PASS`: Mot de passe SMTP.
- `SMTP_FROM`: Alias d'envoi (optionnel).

### Sécurité Admin
- `ADMIN_TOKEN`: Token statique pour les accès legacy.
- `ADMIN_EMAILS`: **Liste blanche** des emails autorisés à se connecter via OAuth (Google/Apple). Séparés par des virgules.
  - *Exemple* : `admin@example.com,dev@example.com`
- `JWT_SECRET`: Clé secrète longue et aléatoire pour signer les tokens de session.
