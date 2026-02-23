import React from 'react';
import iosHome from '../assets/ios-app-home.png';
import iosLighting from '../assets/ios-app-lighting.png';
import android1 from '../assets/app_android_001.png';
import android2 from '../assets/app_android_002.png';

const Home = () => {
    return (
        <div className="page-content home-page">
            <h1>Essensys Domotique</h1>
            <p className="subtitle">Donnez une seconde vie à votre installation.</p>

            <div className="hero-actions">
                <button onClick={() => window.location.href = '/support'}>Commencer</button>
                <button className="secondary" onClick={() => window.open('https://github.com/orgs/essensys-hub/repositories', '_blank')}>Voir sur GitHub</button>
            </div>

            <section className="features">
                <div
                    className="feature-card clickable"
                    onClick={() => document.getElementById('history').scrollIntoView({ behavior: 'smooth' })}
                >
                    <h3>Open Source</h3>
                    <p>Contrôle total sur vos données et votre matériel.</p>
                </div>
                <div
                    className="feature-card clickable"
                    onClick={() => document.getElementById('apps').scrollIntoView({ behavior: 'smooth' })}
                >
                    <h3>Apps Modernes</h3>
                    <p>Contrôlez votre maison depuis iOS et Android.</p>
                </div>
                <div className="feature-card">
                    <h3>Communautaire</h3>
                    <p>Maintenu par les utilisateurs, pour les utilisateurs.</p>
                </div>
            </section>

            <section id="history" className="content-section">
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

            <section id="demos" className="content-section">
                <h2>Démos en Ligne</h2>
                <div className="features">
                    <div
                        className="feature-card clickable"
                        onClick={() => window.open('/demo/server-frontend/', '_blank')}
                    >
                        <h3>Client Web</h3>
                        <p>Découvrez l'interface de contrôle domotique principale. (Mode démo sans backend)</p>
                    </div>
                    <div
                        className="feature-card clickable"
                        onClick={() => window.open('/demo/control-plane/', '_blank')}
                    >
                        <h3>Control Plane</h3>
                        <p>Explorez l'interface d'administration système. (Mode démo sans backend)</p>
                    </div>
                </div>
            </section>

            <section id="apps" className="content-section">
                <h2>Applications Mobiles</h2>
                <div className="apps-showcase">
                    <div className="app-platform">
                        <h3>iOS</h3>
                        <div className="app-images">
                            <img src={iosHome} alt="iOS Home" />
                            <img src={iosLighting} alt="iOS Lighting" />
                        </div>
                        <button className="secondary" onClick={() => window.location.href = '/ios'}>Télécharger pour iOS</button>
                    </div>
                    <div className="app-platform">
                        <h3>Android</h3>
                        <div className="app-images">
                            <img src={android1} alt="Android Home" />
                            <img src={android2} alt="Android Lighting" />
                        </div>
                        <button className="secondary" onClick={() => window.location.href = '/android'}>Télécharger pour Android</button>
                    </div>
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
                        <button className="secondary" onClick={() => window.open('https://github.com/orgs/essensys-hub/repositories', '_blank')}>Explorer les 20+ Répôts</button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
