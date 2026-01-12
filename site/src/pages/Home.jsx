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
        </div>
    );
};

export default Home;
