# Workflow liaison portail utilisateur

## Parcours utilisateur

1. L'utilisateur se connecte sur `https://www.essensys.fr` (OAuth Google/Apple ou email).
2. Il ouvre `https://mon.essensys.fr` et soumet une **demande de liaison** (n° série machine + message).
3. Statut `pending` — aucun contrôle domotique disponible.

## Parcours administrateur

1. Admin (`admin_global` ou `support`) ouvre **Demandes portail** (onglet Utilisateurs) dans l'interface admin.
2. Onglet **En attente** : vérifier identité client et n° série, puis **Approuver** ou **Refuser**.
3. Onglet **Historique** : consulter les demandes traitées (validateur, date).
4. Assigner `linked_machine_id` + `linked_gateway_id` si besoin (User Manager).
5. L'utilisateur obtient `portal_access: true` et peut piloter volets / lumières.

## API portail (VPS `:8081`, proxifié Nginx)

| Méthode | Route | Auth |
|---------|-------|------|
| GET | `/api/portal/health` | Public |
| POST | `/api/portal/link-request` | JWT utilisateur |
| GET | `/api/portal/link-request/status` | JWT utilisateur |
| POST | `/api/portal/inject` | JWT + link approuvé |
| GET | `/api/portal/admin/link-requests?status=pending\|history\|all` | JWT admin |
| PUT | `/api/portal/admin/link-requests/{id}` | JWT admin — `{ "status": "approved" \| "rejected" }` |
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
