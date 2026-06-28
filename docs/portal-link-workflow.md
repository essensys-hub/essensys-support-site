# Workflow liaison portail utilisateur

## Parcours utilisateur

1. L'utilisateur se connecte sur `https://mon.essensys.fr` (OAuth Google/Apple ou email).
2. Il ouvre `https://mon.essensys.fr/portal/` et soumet une **demande de liaison** (n° série machine + message).
3. Statut `pending` — aucun contrôle domotique disponible.

## Parcours administrateur

1. Admin (`admin_global` ou `support`) ouvre **Demandes portail** dans l'interface admin.
2. Vérifie l'identité client et le n° série.
3. **Approuve** la demande et assigne `linked_machine_id` + `linked_gateway_id` (User Manager existant).
4. L'utilisateur obtient `portal_access: true` et peut piloter volets / lumières.

## API portail (VPS `:8081`, proxifié Nginx)

| Méthode | Route | Auth |
|---------|-------|------|
| GET | `/api/portal/health` | Public |
| POST | `/api/portal/link-request` | JWT utilisateur |
| GET | `/api/portal/link-request/status` | JWT utilisateur |
| POST | `/api/portal/inject` | JWT + link approuvé |
| GET | `/api/portal/admin/link-requests` | JWT admin |
| PUT | `/api/portal/admin/link-requests/{id}` | JWT admin |
| POST | `/api/portal/admin/gateways/register` | JWT admin |

## Gateway (HTTPS sortant)

La gateway CM5 active `cloud.enabled: true` dans `config.yaml` et poll `https://mon.essensys.fr/api/gateway/pending-actions`.

Prérequis : `./scripts/test-wan-https-ovh.sh` sur la gateway (voir `essensys-ansible/docs/install-gateway.md`).

## Enregistrement token gateway

```bash
curl -X POST https://mon.essensys.fr/api/portal/admin/gateways/register \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"gateway_id":"gw-site-1","token":"vault-token","machine_id":42}'
```

Variables Ansible gateway : `cloud_gateway_id`, `cloud_gateway_token` (vault).
