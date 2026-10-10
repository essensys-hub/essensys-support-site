import React from 'react';
import ReactMarkdown from 'react-markdown';
import './Auth.css';

const privacyContent = `
# Politique de Confidentialité

**Dernière mise à jour :** 10 octobre 2026

Bienvenue sur la plateforme de support Essensys. Nous nous engageons à protéger vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD).

## 1. Responsable du traitement
Essensys  
Contact : support@essensys.fr

## 2. Données collectées
Nous collectons uniquement les données nécessaires au fonctionnement du service :
*   **Identité** : Nom, Prénom, Adresse email.
*   **Technique** : Adresse IP, Logs de connexion et d'actions (Audit Trail).
*   **Appareils** : Identifiants des armoires et passerelles liées à votre compte.

## 3. Finalité du traitement
*   **Gestion de compte** : Authentification et accès aux services.
*   **Sécurité** : Surveillance des accès et traçabilité des actions sensibles (Audit Trail).
*   **Support** : Association technique entre votre compte et vos équipements.

## 4. Signalements de bugs et d'incidents
Quand vous signalez un problème depuis le formulaire « Signaler un problème » :
*   **Ce qui est publié** : un **bug** devient une issue publique sur GitHub (dépôt \`essensys-support-site\`). Elle ne contient que les champs du formulaire et une référence pseudonyme (\`U-…\`). Votre nom, votre email et les identifiants de vos équipements n'y figurent jamais.
*   **Ce qui reste privé** : un **incident** sur votre installation est enregistré dans un dépôt GitHub privé, consultable par les seuls mainteneurs d'Essensys.
*   **Ce que nous conservons** : la référence, le type, le titre, la date et l'état de chaque signalement, liés à votre compte pour la rubrique « Mes signalements ». Le texte détaillé n'est plus conservé par Essensys une fois transmis à GitHub.
*   **Protection** : le formulaire refuse un texte qui ressemble à un mot de passe, une clé, une adresse email ou une adresse postale. N'en saisissez jamais.
*   **Suppression** : la suppression de votre compte efface vos signalements chez Essensys. Les issues déjà publiées, anonymes, restent sur GitHub ; vous pouvez demander leur suppression via le support en indiquant leur référence.

## 5. Vos Droits
Conformément au RGPD, vous disposez des droits suivants :
*   **Droit d'accès** : Voir vos informations personnelles et votre historique (disponible dans "Mon Profil").
*   **Droit de rectification** : Modifier vos informations (disponible dans "Mon Profil").
*   **Droit à l'oubli** : Supprimer votre compte (disponible dans "Mon Profil").
*   **Droit à la portabilité** : Exporter vos données (disponible dans "Mon Profil").

## 6. Cookies
Nous utilisons des cookies techniques nécessaires au maintien de votre session.
Sur la page d'inscription, Cloudflare Turnstile peut charger un script tiers
(\`challenges.cloudflare.com\`) pour vérifier que la demande n'est pas automatisée.
Voir aussi la bannière de consentement cookies.

## 7. Contact
Pour toute demande, vous pouvez nous contacter via le support.
`;

const Privacy = () => {
    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '800px', textAlign: 'left' }}>
                <ReactMarkdown>{privacyContent}</ReactMarkdown>
            </div>
        </div>
    );
};

export default Privacy;
