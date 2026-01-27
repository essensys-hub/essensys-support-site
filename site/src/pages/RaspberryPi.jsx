import React from 'react';
import diagramImage from '../assets/raspberry_pi_diagram.png';
import { Cpu, ArrowRight, BookOpen } from 'lucide-react';
import './RaspberryPi.css';

const RaspberryPi = () => {
    return (
        <div className="page-content raspberry-page">
            <h1 className="raspberry-title">Comment fonctionne Essensys sur un Raspberry Pi ?</h1>
            <p className="raspberry-subtitle">
                Un site web hébergé chez soi, accessible en local et depuis Internet
            </p>

            {/* Main Visual Section - Replaced by Diagram Image */}
            <div style={{
                position: 'relative',
                marginBottom: '60px',
                display: 'flex',
                justifyContent: 'center'
            }}>
                <img
                    className="raspberry-diagram"
                    src={diagramImage}
                    alt="Schéma de fonctionnement Essensys : Utilisateur -> Raspberry Pi -> Site Web"
                />
            </div>

            <p style={{ textAlign: 'center', marginBottom: '60px', color: '#aaa', fontStyle: 'italic' }}>
                <Cpu size={16} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                Tout ce que tu vois ici tourne sur un <strong>seul Raspberry Pi</strong>.
            </p>

            {/* Bottom Cards Grid - Explaining the Steps */}
            <div className="raspberry-grid">
                <div style={gridCardStyle}>
                    <div style={circleNumberStyle('#4A90E2')}>1</div>
                    <h3 style={{ color: '#4A90E2', marginBottom: '10px' }}>L'utilisateur</h3>
                    <p style={{ fontSize: '0.9rem', color: '#ddd' }}>
                        Tu ouvres ton navigateur et tu vas sur <strong>mon.essensys.fr</strong>
                    </p>
                </div>
                <div style={gridCardStyle}>
                    <div style={circleNumberStyle('#2ecc71')}>2</div>
                    <h3 style={{ color: '#2ecc71', marginBottom: '10px' }}>Le Raspberry Pi</h3>
                    <p style={{ fontSize: '0.9rem', color: '#ddd' }}>
                        Ce mini-ordinateur chez toi héberge le site complet et tes données.
                    </p>
                </div>
                <div style={gridCardStyle}>
                    <div style={circleNumberStyle('#F5A623')}>3</div>
                    <h3 style={{ color: '#F5A623', marginBottom: '10px' }}>Le site web</h3>
                    <p style={{ fontSize: '0.9rem', color: '#ddd' }}>
                        Il affiche les pages react et l'API gère la domotique.
                    </p>
                </div>
                <div style={gridCardStyle}>
                    <div style={circleNumberStyle('#F5A623')}>4</div>
                    <h3 style={{ color: '#F5A623', marginBottom: '10px' }}>Accès Internet</h3>
                    <p style={{ fontSize: '0.9rem', color: '#ddd' }}>
                        Avec une connexion sécurisée (HTTPS), tu peux aussi y accéder à distance.
                    </p>
                </div>
            </div>

            {/* Installation Section */}
            <div className="raspberry-install-card">
                <h2 style={{ marginTop: 0 }}>Prêt à installer ?</h2>
                <div className="raspberry-install-command">
                    sudo curl -sL https://raw.githubusercontent.com/essensys-hub/essensys-raspberry-install/refs/heads/V.1.1.0/install.sh | sudo bash
                </div>

                <div style={{ marginTop: '20px' }}>
                    <a
                        href="https://essensys-hub.github.io/essensys-raspberry-install/installation/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: '#333',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontSize: '0.9em',
                            border: '1px solid #555',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.borderColor = '#00C9FF'}
                        onMouseOut={(e) => e.currentTarget.style.borderColor = '#555'}
                    >
                        <BookOpen size={16} />
                        Voir le guide d'installation complet
                    </a>
                </div>
            </div>
        </div>
    );
};

// Styles
const gridCardStyle = {
    background: '#1a1a1a',
    padding: '25px',
    borderRadius: '12px',
    textAlign: 'left',
    position: 'relative',
    border: '1px solid #333'
};

const circleNumberStyle = (color) => ({
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: color,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    marginBottom: '10px'
});

export default RaspberryPi;
