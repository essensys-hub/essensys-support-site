import React from 'react';

const Home = () => {
    return (
        <div className="page-content home-page">
            <h1>Essensys Domotique</h1>
            <p className="subtitle">Donnez une seconde vie à votre installation.</p>

            <div className="hero-actions">
                <button onClick={() => window.location.href = '/support'}>Commencer</button>
                <button className="secondary" onClick={() => window.open('https://github.com/essensys-hub', '_blank')}>Voir sur GitHub</button>
            </div>

            <section className="features">
                <div className="feature-card">
                    <h3>Open Source</h3>
                    <p>Contrôle total sur vos données et votre matériel.</p>
                </div>
                <div className="feature-card">
                    <h3>Apps Modernes</h3>
                    <p>Contrôlez votre maison depuis iOS et Android.</p>
                </div>
                <div className="feature-card">
                    <h3>Communautaire</h3>
                    <p>Maintenu par les utilisateurs, pour les utilisateurs.</p>
                </div>
            </section>

            <section className="content-section">
                <h2>Historique & Philosophie</h2>
                <div className="history-content">
                    <p>
                        Créée en 2010 par Valentinéa, la solution Essensys visait à proposer un système domotique filaire robuste et simple pour l'habitat individuel.
                        Après l'arrêt de sa commercialisation et la fermeture du site officiel, une communauté de passionnés a repris le flambeau.
                    </p>
                    <p>
                        Grâce à la libération du code source sous licence MIT, l'esprit d'Essensys perdure. Ce projet communautaire assure non seulement la maintenance
                        des installations existantes, mais modernize également l'écosystème avec des technologies actuelles (Raspberry Pi, React, Apps natives).
                    </p>
                </div>
            </section>

            <section className="content-section">
                <h2>L'Écosystème GitHub</h2>
                <div className="ecosystem-content">
                    <p>
                        L'ouverture du code a donné naissance à une vingtaine de dépôts GitHub publics. Cette transparence est la garantie de la pérennité de votre installation :
                    </p>
                    <ul className="benefits-list">
                        <li><strong>Réparabilité</strong> : Accès total au code pour diagnostiquer et corriger les pannes soi-même.</li>
                        <li><strong>Indépendance</strong> : Plus aucune dépendance envers un serveur central propriétaire ("cloud"). Votre maison fonctionne en autonomie.</li>
                        <li><strong>Évolution</strong> : La communauté peut développer de nouveaux connecteurs et fonctionnalités sans attendre un fabricant.</li>
                    </ul>
                    <div className="github-actions">
                        <button className="secondary" onClick={() => window.open('https://github.com/essensys-hub', '_blank')}>Explorer les 20+ Répôts</button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
