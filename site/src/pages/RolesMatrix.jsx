import React from 'react';

const RolesMatrix = () => {
    return (
        <div className="page-content">
            <h1>Matrice des Rôles et Permissions</h1>
            <p>Voici le détail des accès et responsabilités pour chaque rôle sur la plateforme Essensys.</p>

            <div style={{ overflowX: 'auto', marginTop: '30px' }}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Fonctionnalité</th>
                            <th style={styles.th}>Admin Global</th>
                            <th style={styles.th}>Admin Local</th>
                            <th style={styles.th}>Utilisateur (User)</th>
                            <th style={styles.th}>Invité (Guest Local)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={styles.tr}>
                            <td style={styles.featureTd}><strong>Vue Dashboard Global</strong><br /><small>Stats globales, Carte de toutes les machines</small></td>
                            <td style={styles.okTd}>✅ Accès Total</td>
                            <td style={styles.partialTd}>⚠️ Limité (Seulement sa machine)</td>
                            <td style={styles.noTd}>❌</td>
                            <td style={styles.noTd}>❌</td>
                        </tr>
                        <tr style={styles.tr}>
                            <td style={styles.featureTd}><strong>Gestion des Utilisateurs</strong><br /><small>Voir la liste, Modifier les rôles</small></td>
                            <td style={styles.okTd}>✅ Tous les utilisateurs</td>
                            <td style={styles.partialTd}>⚠️ Seulement liés à sa machine</td>
                            <td style={styles.noTd}>❌</td>
                            <td style={styles.noTd}>❌</td>
                        </tr>
                        <tr style={styles.tr}>
                            <td style={styles.featureTd}><strong>Attribution de Rôle</strong><br /><small>Promouvoir/Rétrograder</small></td>
                            <td style={styles.okTd}>✅ Tout rôle</td>
                            <td style={styles.partialTd}>⚠️ User &lt;-&gt; Guest uniquement</td>
                            <td style={styles.noTd}>❌</td>
                            <td style={styles.noTd}>❌</td>
                        </tr>
                        <tr style={styles.tr}>
                            <td style={styles.featureTd}><strong>Lier des Appareils</strong><br /><small>Associer un User à une Machine/Gateway</small></td>
                            <td style={styles.okTd}>✅ Oui</td>
                            <td style={styles.noTd}>❌</td>
                            <td style={styles.noTd}>❌</td>
                            <td style={styles.noTd}>❌</td>
                        </tr>
                        <tr style={styles.tr}>
                            <td style={styles.featureTd}><strong>Contrôle Domotique</strong><br /><small>Pilotage via l'application</small></td>
                            <td style={styles.okTd}>✅ Oui</td>
                            <td style={styles.okTd}>✅ Oui</td>
                            <td style={styles.okTd}>✅ Oui</td>
                            <td style={styles.partialTd}>⚠️ Lecture Seule (ex: État)</td>
                        </tr>
                        <tr style={styles.tr}>
                            <td style={styles.featureTd}><strong>Newsletters</strong><br /><small>Envoyer des emails aux abonnés</small></td>
                            <td style={styles.okTd}>✅ Oui</td>
                            <td style={styles.noTd}>❌</td>
                            <td style={styles.noTd}>❌</td>
                            <td style={styles.noTd}>❌</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '40px', background: '#222', padding: '20px', borderRadius: '8px' }}>
                <h3>Définitions</h3>
                <ul style={{ lineHeight: '1.6' }}>
                    <li><strong>Admin Global</strong> : Super-administrateur technique (Support Essensys). A accès à tout.</li>
                    <li><strong>Admin Local</strong> : Propriétaire ou gestionnaire d'une installation (ex: Chef de famille, Gestionnaire de bâtiment). Il gère les utilisateurs de son site.</li>
                    <li><strong>User</strong> : Utilisateur standard approuvé par un Admin Local. Peut piloter la domotique.</li>
                    <li><strong>Guest Local</strong> : Rôle par défaut à l'inscription. Accès lecture seule, doit être approuvé pour devenir User.</li>
                </ul>
            </div>
        </div>
    );
};

const styles = {
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        background: '#1a1a1a',
        borderRadius: '8px',
        overflow: 'hidden',
    },
    th: {
        background: '#333',
        color: '#fff',
        padding: '15px',
        textAlign: 'left',
        borderBottom: '2px solid #555',
    },
    tr: {
        borderBottom: '1px solid #333',
    },
    featureTd: {
        padding: '15px',
        color: '#fff',
        borderRight: '1px solid #333',
    },
    okTd: {
        padding: '15px',
        color: '#92FE9D', // Green
        background: 'rgba(146, 254, 157, 0.05)',
    },
    partialTd: {
        padding: '15px',
        color: '#FFD700', // Gold
        background: 'rgba(255, 215, 0, 0.05)',
    },
    noTd: {
        padding: '15px',
        color: '#ff4444', // Red
        opacity: 0.7,
    }
};

export default RolesMatrix;
