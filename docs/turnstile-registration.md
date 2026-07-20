# Cloudflare Turnstile on public registration

OpenSpec: `essensys-turnstile-registration-2026-07-036`

## Purpose

Stop automated fictitious accounts on `POST /api/auth/register` (www.essensys.fr).

## Production path

| Layer | Component |
|-------|-----------|
| UI | `essensys-support-site` `/register` + `VITE_TURNSTILE_SITE_KEY` |
| API | `essensys-user-portal-backend` (`CONSOLIDATED_MODE`) + `TURNSTILE_SECRET_KEY` |
| Secrets | SOPS `vault_turnstile_site_key` / `vault_turnstile_secret_key` → Ansible |

The legacy `essensys-support-site/backend` has parity code but is **not** deployed on OVH.

## Cloudflare account (owner of verification)

| Field | Value |
|-------|--------|
| **Account email** | `nicolas.rineau@gmail.com` |
| **Status** | **Verified** (Cloudflare → My Profile → Settings) |
| **Member since** | 20 July 2024 |

This account owns the Turnstile widget, allowed hostnames, site key, and secret key.
Rotate or change domains only from this account, then update SOPS / redeploy.
Canonical doc also in `essensys-doc` → `archi/turnstile-registration.md`.

## Cloudflare setup

1. Log in as `nicolas.rineau@gmail.com` → Dashboard → Turnstile → Add widget (**managed**).
2. Hostnames: `www.essensys.fr`, `mon.essensys.fr`, `test.essensys.fr` (+ local if needed).
3. Copy site key (public) and secret key (server-only).

## SOPS / deploy

```bash
export SOPS_AGE_KEY_FILE="$HOME/.config/sops/age/keys.txt"
cd essensys-ansible
sops secrets/cloud/essensys.sops.yaml
# vault_turnstile_secret_key / vault_turnstile_site_key
ansible-playbook -i inventory support-site.yml   # or deploy-portal-stack.yml
```

Production `.env` includes `ENV=production` and `TURNSTILE_DISABLED=false`.
Backend refuses startup if production consolidated mode lacks the secret or has disable=true.

## CI / local

| Mode | How |
|------|-----|
| Cloudflare test keys | Site `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA` (always pass) |
| Disable verify | `TURNSTILE_DISABLED=true` and `ENV` ≠ `production` |

Never commit production secrets.

## Smoke after deploy

```bash
# Must fail (no token) — no user created
curl -sS -X POST https://www.essensys.fr/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"bot@example.com","password":"test-pass-1234"}' -w '\n%{http_code}\n'

# Human: complete /register in browser with Turnstile widget
# Admin create user via User Manager must still work without Turnstile
```

## Rollback

1. Redeploy previous cloud-backend binary / image.
2. Redeploy previous support-site SPA build.
3. Optionally leave SOPS keys in place (inert if unused).

Do not leave production register open without `siteverify`.

## Audit events

Logged without tokens/secrets:

- `REGISTER_BLOCKED_TURNSTILE`
- `REGISTER_BLOCKED_RATELIMIT`
- `REGISTER_BLOCKED_HONEYPOT`
