import React from 'react';
import diagramImage from '../assets/raspberry_pi_diagram.png';
import { Cpu, ArrowRight } from 'lucide-react';

const RaspberryPi = () => {
    return (
        <div className="page-content" style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', color: 'white' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Comment fonctionne Essensys sur un Raspberry Pi ?</h1>
            <p style={{ fontSize: '1.2rem', color: '#ccc', marginBottom: '40px' }}>
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
                    src={diagramImage}
                    alt="Schéma de fonctionnement Essensys : Utilisateur -> Raspberry Pi -> Site Web"
                    style={{
                        width: '100%',
                        maxWidth: '1000px',
                        borderRadius: '24px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                />
            </div>

            <p style={{ textAlign: 'center', marginBottom: '60px', color: '#aaa', fontStyle: 'italic' }}>
                <Cpu size={16} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                Tout ce que tu vois ici tourne sur un <strong>seul Raspberry Pi</strong>.
            </p>

            {/* Bottom Cards Grid - Explaining the Steps */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '60px' }}>
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
            <div style={{ background: '#111', padding: '30px', borderRadius: '16px', border: '1px solid #333' }}>
                <h2 style={{ marginTop: 0 }}>Prêt à installer ?</h2>
                <div style={{
                    background: '#000',
                    padding: '15px',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '1.1em',
                    color: '#00C9FF',
                    overflowX: 'auto',
                    border: '1px solid #444',
                    margin: '20px 0',
                    display: 'inline-block'
                }}>
                    curl -sL https://essensys.fr/install.sh | bash
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
