# Processus Catalogue (Essensys)

## Objectif
Le processus **Catalogue** définit une référence unique et structurée de toutes les actions possibles de la solution Essensys. Il sert de base commune pour répertorier, organiser et administrer ces actions dans un format stable et versionné.

Ce catalogue s’appuie sur la référence des entrées disponible ici :
- https://essensys-hub.github.io/essensys-raspberry-install/maintenance/debug/

## Périmètre
Le Catalogue couvre :
- **Toutes les actions possibles** de la solution (références fonctionnelles et techniques).
- La **gestion des entrées** (ajout, modification, suppression).
- Le **regroupement** des actions par catégories logiques.
- La **publication d’une version globale** stable et clonable.

## Référentiel d’entrées
Les entrées proviennent de la page de référence ci-dessous. Cette source fait foi pour le contenu fonctionnel :
- https://essensys-hub.github.io/essensys-raspberry-install/maintenance/debug/

Chaque entrée est considérée comme une **action unique** et doit être intégrée au Catalogue dans sa forme officielle.

## Règles de gestion des entrées
1. **Ajouter** :
   - Toute nouvelle action doit être créée à partir de la référence officielle.
   - Elle est ensuite regroupée dans la catégorie appropriée.
2. **Modifier** :
   - Seuls les champs autorisés (libellé) peuvent être modifiés localement.
   - Les indices et valeurs restent strictement inchangés.
3. **Supprimer** :
   - Une action peut être supprimée du regroupement local, mais sa référence officielle reste préservée dans la version globale.

## Regroupement
Les actions doivent être regroupées de manière cohérente, par exemple :
- **Fonction** (maintenance, supervision, configuration, etc.)
- **Type d’équipement** (armoires, capteurs, passerelles, etc.)
- **Usage métier** (diagnostic, exploitation, mise en service, etc.)

Le regroupement est flexible, mais il doit rester **aligné avec la version globale**.

## Version globale
Une **version globale** unique est publiée pour servir de base de référence à toutes les armoires Essensys.

**Format de version :**
```
<YYYY>.<MM>.<NNN>
```
Exemple : `2026.01.000`

### Règles de la version globale
- La version globale est figée et contient l’ensemble des actions officielles.
- Les administrateurs peuvent cloner cette version et **renommer les libellés**.
- **Les indices et valeurs ne doivent jamais être modifiés.**

## Processus d’utilisation
1. **Créer/Mettre à jour la version globale** à partir de la référence officielle.
2. **Cloner la version globale** pour chaque armoire Essensys.
3. **Renommer les libellés** si nécessaire, tout en conservant les indices et valeurs.
4. **Maintenir le regroupement** pour garantir la cohérence entre les armoires.

## Résultat attendu
- Un **catalogue centralisé**, cohérent et versionné.
- Des **clones locaux** adaptables (libellés modifiables uniquement).
- Une **traçabilité** claire entre les actions locales et la version globale.
