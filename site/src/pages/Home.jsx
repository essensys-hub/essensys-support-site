import React from 'react';

const Home = () => {
    return (
        <div className="page-content home-page">
            <h1>Essensys Domotique</h1>
            <p className="subtitle">Give a second life to your installation.</p>

            <div className="hero-actions">
                <button onClick={() => window.location.href = '/support'}>Get Started</button>
                <button className="secondary" onClick={() => window.open('https://github.com/essensys-hub', '_blank')}>View on GitHub</button>
            </div>

            <section className="features">
                <div className="feature-card">
                    <h3>Open Source</h3>
                    <p>Full control over your data and hardware.</p>
                </div>
                <div className="feature-card">
                    <h3>Modern Apps</h3>
                    <p>Control from iOS and Android devices.</p>
                </div>
                <div className="feature-card">
                    <h3>Community Driven</h3>
                    <p>Maintained by users, for users.</p>
                </div>
            </section>
        </div>
    );
};

export default Home;
