# Synopsis Design : Essensys Domotique - Le Renouveau Open Source

## 1. Vision & Identité du Projet
**Le concept clé :** "Renaissance & Modernité".
Essensys était une solution domotique haut de gamme, filaire et robuste, dont la commercialisation a cessé. Le projet actuel est une initiative communautaire visant à **sauvegarder** ce patrimoine technique et à le **moderniser** grâce à l'Open Source.

Le site web ne doit pas ressembler à un simple dépôt de fichiers, mais à la **vitrine officielle d'une solution vivante**. Il doit rassurer les propriétaires existants (maintenance possible) et séduire les "makers" (hackabilité).

### Mots-clés Design
*   **Premium** : Clin d'œil à l'origine propriétaire et coûteuse du système.
*   **Technique mais Accessible** : Documentation claire, schémas lisibles.
*   **Communautaire** : Mise en avant de GitHub et de la philosophie Open Source.
*   **Épuré** :Design moderne (type SaaS ou documentation développeur moderne comme Vercel/Stripe docs), mode sombre (Dark Mode) indispensable.

## 2. Cible (Personas)
1.  **Le Propriétaire Historique** : Il a acheté sa maison avec Essensys pré-installé. Il est inquiet car le site officiel a fermé. Il cherche une solution pour réparer ou moderniser sson installation sans tout casser.
    *   *Besoin :* Réassurance, guide pas-à-pas simple, solutions de remplacement.
2.  **Le Tech / Maker** : Il aime la domotique, possède un Raspberry Pi. Il veut prendre le contrôle total de sa maison via des API ou des scripts.
    *   *Besoin :* Documentation technique pointue, API, accès au code source.

## 3. Structure du Site & Parcours Utilisateur

### A. Page d'Accueil (Home)
*   **Hero Section** :
    *   **Accroche** : "Donnez une seconde vie à votre installation Essensys."
    *   **Sous-titre** : "La solution domotique filaire de référence, désormais Open Source et pilotable via Raspberry Pi."
    *   **Call to Action (CTA)** : "Commencer l'installation" (Primaire) / "Voir le projet sur GitHub" (Secondaire).
    *   **Visuel** : Une image composite montrant le vieux matériel (tableau électrique) connecté à un Raspberry Pi moderne et une capture d'écran de la nouvelle App iPhone.
*   **La Promesse (Value Prop)** :
    *   *Indépendance* : Auto-hébergement, plus de cloud dépendant d'un tiers.
    *   *Modernité* : Nouvelles apps iOS/Android, compatibilité HomeKit/Google Home (si applicable via ponts).
    *   *Gratuit* : Logiciel 100% Open Source (Licence MIT).

### B. Section "Historique & Philosophie"
*   Raconter l'histoire (cf. `historique.md`) : De Valentinéa à l'Open Source.
*   Expliquer pourquoi le site officiel `essensys.fr` a fermé et présenter ce nouveau site comme le relai communautaire légitime.
*   *Ton* : Respectueux du travail d'origine, mais tourné vers l'avenir.

### C. Documentation (Le Cœur du Site)
Cette section doit être traitée comme une documentation technique de haut niveau (type GitBook ou Docusaurus).
*   **Installation** : "Installer le Hub Essensys sur Raspberry Pi".
*   **Applications** : Liens vers les stores (ou IPA/APK) et guides d'utilisation.
*   **Matériel** : Schémas de câblage des cartes (SC940D, etc.), diagnostic de pannes.

### D. Blog / Actualités
*   Pour montrer que le projet est actif (Mises à jour des Apps, nouvelles fonctionnalités du serveur).

## 4. Assets & Ambiance Graphique
*   **Couleurs** : Reprendre peut-être une couleur "signature" de l'ancienne marque (si elle existait) mais la moderniser. Sinon, partir sur un bleu tech profond ou un vert "circuit imprimé" subtil.
*   **Typographie** : Sans-serif, moderne, très lisible (ex: Inter, Roboto, SF Pro).
*   **Imagerie** : Mélange de photos "hardware" (cartes électroniques, câblage propre) et de captures d'écran d'interface "software" (clean UI).

## 5. Livrables Attendus pour le Web Designer
1.  **Wireframes** : Page d'accueil + Template de page de documentation.
2.  **Maquette UI (High Fidelity)** : Desktop et Mobile.
3.  **Prototypage** : Navigation simple pour valider l'UX.
