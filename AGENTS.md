# Agent Context — Feature Lifecycle

Ce dépôt utilise le **feature lifecycle Essensys** (Git-first, IA orchestratrice). Trois contraintes non négociables : **sécurité**, **open source**, **traçabilité complète**.

- `features/<id>.json` est la source de vérité d'une feature
- OpenSpec, docs (`docs/features/`), tests et release notes pointent vers le manifest
- `feature-gate` et `security-gate` tournent automatiquement sur les PRs

## Stack

- **Frontend** : React + Vite (`site/`)
- **Backend** : Go (Chi Router) + Python scripts (`backend/`, `api/`)
- **Docs MkDocs** : MkDocs Material (`docs/`, `mkdocs.yml`)
- **Infra** : VPS Ubuntu + Nginx + PostgreSQL

## Process

```
Idée → Jira (SCRUM) → OpenSpec → Tasks Jira → Code → Test×N → Gate sécurité → Deploy → Revue
         └────────  Documentation · Mémoire (essensys-memory)  en continu ────────┘
```

## Gate sécurité (open source, bloquante)

- **Secrets** : gitleaks (`.gitleaks.toml`)
- **CVE / SCA** : Trivy + Dependabot
- Critical/High = bloquant.

## UX Gate

Toute feature UI doit déclarer `tests.ux_matrix` avec devices `[desktop, iphone, ipad]` dans son manifest.
Gate : `python3 scripts/feature_lifecycle/check_feature_gate.py --strict`

## Secrets & SOPS

Aucun secret en clair. Tous chiffrés avec SOPS + age dans `essensys-ansible/secrets/`.
