# Matrice des Rôles et Permissions

Ce document détaille les différents rôles disponibles sur la plateforme Essensys Support et leurs privilèges respectifs.

## Définitions des Rôles

| Rôle | Cde Technique | Description | Périmètre |
| :--- | :--- | :--- | :--- |
| **Global Admin** | `admin_global` | Super-administrateur avec accès complet. | Ensemble de la plateforme (Toutes les machines, tous les utilisateurs). |
| **Local Admin** | `admin_local` | Administrateur d'une installation locale. | Limité à la machine/armoire physique où il est connecté (IP). |
| **User** | `user` | Utilisateur standard validé. | Accès aux fonctionnalités de support et pilotage de ses appareils. |
| **Guest Local** | `guest_local` | Visiteur non validé sur le réseau local. | Accès en lecture seule à la machine locale (pour découverte). |

---

## Matrice RACI / Fonctionnalités

Le tableau ci-dessous indique qui peut faire quoi (**R** = Responsible/Access, **-** = No Access).

| Fonctionnalité | Admin Global | Admin Local | User | Guest Local |
| :--- | :---: | :---: | :---: | :---: |
| **Accès Dashboard Admin** | ✅ | ✅ | ❌ | ❌ |
| **Voir Stats Globales** | ✅ | ✅ | ❌ | ❌ |
| **Voir liste TOUS les utilisateurs** | ✅ | ❌ | ❌ | ❌ |
| **Voir liste utilisateurs LOCAUX** | ✅ | ✅ | ❌ | ❌ |
| **Modifier rôle n'importe qui** | ✅ | ❌ | ❌ | ❌ |
| **Promouvoir Guest -> User (Local)**| ✅ | ✅ | ❌ | ❌ |
| **Lier Machine/Gateway (Force)** | ✅ | ❌ | ❌ | ❌ |
| **Voir Carte Géolocalisation** | ✅ | ✅ | ❌ | ❌ |
| **Gérer Newsletters** | ✅ | ✅ | ❌ | ❌ |
| **Accès Support / Tickets** | ✅ | ✅ | ✅ | ❌ |
| **Voir Profil / Appareils liés** | ✅ | ✅ | ✅ | ✅ |

### Détails Spécifiques

#### Attribution Automatique des Rôles
Lors de l'inscription :
1. **Liaison Machine** : Si l'utilisateur s'inscrit depuis l'IP d'une machine Essensys connue, il est automatiquement lié à cette machine.
2. **Premier Arrivé (Admin Local)** : Si la machine n'a pas encore d'administrateur local, le premier utilisateur devient automatiquement **`admin_local`**.
3. **Suivants (Guest Local)** : Les utilisateurs suivants sur la même machine deviennent par défaut **`guest_local`**. Ils doivent être validés par l'Admin Local (passés en `user`).

#### admin_local
*   Ne voit que les utilisateurs liés à la **même machine** que lui.
*   Ne peut modifier les rôles que des utilisateurs de sa machine.
*   Ne peut pas s'auto-promouvoir `admin_global`.
