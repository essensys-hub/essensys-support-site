# Deprecated — essensys-support-site/backend

**Ce backend Go n'est plus déployé en production depuis juin 2026.**

Le hub cloud unifié est [`essensys-user-portal-backend`](https://github.com/essensys-hub/essensys-user-portal-backend) (`CONSOLIDATED_MODE=true`, service `essensys-cloud-backend` sur `:8080`).

Déploiement : rôle Ansible `cloud_backend` (`essensys-ansible/docs/cloud-backend-migration.md`).

Ce répertoire reste en référence jusqu'à la fin de la période de soak (OpenSpec Phase 7.6).

## Turnstile parity (optional redeploy only)

`HandleRegister` mirrors portal-backend bot guards (Turnstile `siteverify`, honeypot).
**Production does not run this binary** — keep parity only if you redeploy the legacy
backend. Prefer implementing register protection in `essensys-user-portal-backend`.
Env: `TURNSTILE_SECRET_KEY`, `TURNSTILE_DISABLED` (non-prod only), `ENV=production`.
