# Dossier de Spécifications : Projet Essensys Domotique & Site Support

## 1. Introduction
Ce document définit les besoins de développement pour le projet **Essensys Domotique** et son **Site Web de Support**. Il sert de référence pour les développeurs et les parties prenantes afin de comprendre l'architecture, les fonctionnalités attendues et les contraintes techniques.

## 2. Présentation du Projet Essensys Domotique
Le projet Essensys est une solution domotique complète et propriétaire, conçue pour offrir un contrôle centralisé et intuitif de l'habitat.

### 2.1 Architecture Globale
Le système repose sur une architecture distribuée comprenant :
-   **Hardware (Cartes Électroniques)** : Cartes propriétaires (ex: SC940D, SC944D) communiquant via un bus de terrain (RS485/CAN/Autre - à préciser) pour le pilotage des actionneurs.
-   **Serveur Central (Hub)** : Hébergé sur Raspberry Pi.
    -   Assure l'interface entre le matériel et les clients (Apps/Web).
    -   Gère la logique d'automatisation et l'exposition des API.
-   **Interfaces Utilisateur (Clients)** :
    -   Application iOS (Native Swift).
    -   Application Android (Native Kotlin).

### 2.2 Fonctionnalités Clés
-   **Gestion de l'Éclairage** : Contrôle des lumières (On/Off/Dim) groupées par pièces. Visualisation de l'état en temps réel.
-   **Gestion des Volets Roulants** : Ouverture/Fermeture/Stop, commande par pièce ou globale.
-   **Scénarios de Vie** : Modes "Réveil", "Nuit", "Départ", "Soirée" activant des configurations prédéfinies.
-   **Sécurité / Alarme** : (Si applicable) Gestion des capteurs et états d'alerte.
-   **Accès Distant (WAN)** : Possibilité de contrôler la maison depuis l'extérieur via une connexion sécurisée (Authentification Basic/Token).

## 3. Spécifications du Site Web de Support (essensys.fr)
Le site web a pour vocation de présenter le projet, fournir de la documentation aux utilisateurs et assurer le support technique.

### 3.1 Objectifs du Site
-   **Vitrine** : Présenter la solution Essensys Domotique (Design, Philosophie).
-   **Documentation** : Héberger les guides d'installation (ex: Setup Raspberry Pi) et les manuels utilisateurs.
-   **Support** : Faciliter le diagnostic et la prise de contact.

### 3.2 Fonctionnalités Attendues
-   **Page d'Accueil** : Hero section impactante, présentation rapide des fonctionnalités.
-   **Section Documentation** :
    -   Guides pas-à-pas (Installation Serveur, Configuration App).
    -   FAQ dynamique.
    -   Téléchargements (Images disques, Schémas câblage).
-   **Blog / News** : Mises à jour du système (Changelog Firmware/Apps).
-   **Formulaire de Contact** : Pour le support technique.

### 3.3 Contraintes Techniques
-   **Stack Technique Recommandée** :
    -   Framework : Next.js ou React (pour la rapidité et le SEO) OU Générateur de site statique (MkDocs/Docusaurus) si focus pur documentation.
    -   Hosting : Vercel / Netlify / GitHub Pages.
-   **Design** :
    -   Moderne, épuré, "Premium" (couleurs vibrantes, dark mode support).
    -   Responsive (Mobile First).

## 4. Besoins de Développement (Roadmap)
Cette section détaille les tâches techniques prioritaires.

### 4.1 Applications Mobiles (iOS/Android)
-   Harmonisation UI/UX entre les deux plateformes (ex: onglet Volets).
-   Amélioration de la gestion de la connexion (Switch Local/WAN fluide).
-   Implémentation des nouvelles fonctionnalités hardware.

### 4.2 Site Web Support
-   Création de la maquette (Wireframes).
-   Développement du squelette (Setup Next.js/Vite).
-   Rédaction et intégration des contenus (Migration des README existants vers le web).

### 4.3 Backend / Serveur
-   Consolidation API (Migration Legacy vers API moderne si en cours).
-   Sécurisation des accès extérieurs.

## 5. Annexes
-   Liens vers les dépôts GitHub (iOS, Android, Install).
-   Spécifications des API (Swagger/OpenAPI).
