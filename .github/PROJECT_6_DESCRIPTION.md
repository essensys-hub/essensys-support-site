# Projet GitHub n°6 — Incidents & Bugs Essensys

Copier-coller dans **Settings → Projects → (projet 6) → About**.

## Short description

Suivi communautaire des bugs logiciels et incidents de production Essensys.

## Readme (description longue)

### Objectif

Centraliser les signalements issus du site [mon.essensys.fr](https://mon.essensys.fr) et de la communauté GitHub, pour prioriser les corrections et partager les solutions de contournement.

### Comment signaler

| Type | Quand l'utiliser | Formulaire |
|------|------------------|------------|
| **Bug logiciel** | Comportement incorrect reproductible, régression après mise à jour | [Nouveau bug](https://github.com/essensys-hub/essensys-support-site/issues/new?template=bug_report.yml) |
| **Incident production** | Panne ou dégradation en cours sur une installation | [Nouvel incident](https://github.com/essensys-hub/essensys-support-site/issues/new?template=incident.yml) |

Les issues sont créées dans `essensys-support-site` puis triées vers le dépôt technique concerné.

### Workflow équipe

1. **Nouveau** — issue ouverte depuis le site ou GitHub
2. **Tri** — qualification composant, gravité, lien doc
3. **En cours** — assignation + correctif ou contournement documenté
4. **Résolu** — release ou note dans la doc dépannage
5. **Fermé** — vérification rapporteur ou auto après inactivité

### Labels

- `bug` — défaut logiciel
- `incident` — panne / dégradation production
- `help wanted` — contribution communautaire bienvenue
- `documentation` — correctif doc ou guide dépannage

### Liens utiles

- Site support : https://mon.essensys.fr
- Documentation : https://essensys-hub.github.io/essensys-raspberry-install/
- Organisation : https://github.com/essensys-hub
