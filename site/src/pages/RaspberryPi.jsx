import React from 'react';
import raspberryPiImage from '../assets/raspberry_pi_server.png';
import { User, Cpu, Layout, Lock, Globe, Smartphone, ArrowRight } from 'lucide-react';

const RaspberryPi = () => {
    return (
        <div className="page-content" style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', color: 'white' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Comment fonctionne Essensys sur un Raspberry Pi ?</h1>
            <p style={{ fontSize: '1.2rem', color: '#ccc', marginBottom: '60px' }}>
                Un site web hébergé chez soi, accessible en local et depuis Internet
            </p>

            {/* Main Visual Section */}
            <div style={{
                position: 'relative',
                background: 'linear-gradient(135deg, rgba(20,20,30,0.8), rgba(40,40,50,0.8))',
                borderRadius: '24px',
                padding: '60px 20px',
                marginBottom: '60px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '40px'
            }}>
                {/* Step 1: User */}
                <div style={floatingCardStyle}>
                    <div style={stepBadgeStyle('#4A90E2')}>1 L'utilisateur</div>
                    <User size={48} color="#4A90E2" style={{ marginBottom: '15px' }} />
                    <p style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                        Tu ouvres ton <strong>navigateur</strong> et tu vas sur <br />
                        <span style={{ color: '#4A90E2', fontWeight: 'bold' }}>mon.essensys.fr</span>
                    </p>
                </div>

                <ArrowRight size={32} color="#666" className="flow-arrow" />

                {/* Step 2: Raspberry Pi (Center) */}
                <div style={centerCardStyle}>
                    <div style={stepBadgeStyle('#2ecc71')}>2 Le Raspberry Pi</div>
                    <img
                        src={raspberryPiImage}
                        alt="Raspberry Pi"
                        style={{ width: '150px', borderRadius: '10px', boxShadow: '0 0 15px rgba(46, 204, 113, 0.4)', margin: '15px 0' }}
                    />
                    <p style={{ fontSize: '0.9rem' }}>
                        Ce <strong>mini-ordinateur</strong> chez toi héberge le site
                    </p>
                </div>

                <ArrowRight size={32} color="#666" className="flow-arrow" />

                {/* Step 3: Website */}
                <div style={floatingCardStyle}>
                    <div style={stepBadgeStyle('#F5A623')}>3 Le site web</div>
                    <Layout size={48} color="#F5A623" style={{ marginBottom: '15px' }} />
                    <p style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                        Il <strong>affiche les pages</strong> et exécute les actions en arrière-plan
                    </p>
                </div>

                {/* Secure Access Indicator */}
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(0,0,0,0.4)',
                    padding: '8px 15px',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <Lock size={16} color="#92FE9D" />
                    <Smartphone size={16} color="#ccc" />
                    <span style={{ fontSize: '0.8rem', color: '#ccc' }}>Accès sécurisé</span>
                </div>
            </div>

            <p style={{ textAlign: 'center', marginBottom: '60px', color: '#aaa', fontStyle: 'italic' }}>
                <Cpu size={16} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                Tout ce que tu vois ici tourne sur un <strong>seul Raspberry Pi</strong>.
            </p>

            {/* Bottom Cards Grid */}
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
                    <div style={circleNumberStyle('#9b59b6')}>3</div>
                    <h3 style={{ color: '#9b59b6', marginBottom: '10px' }}>Le site web</h3>
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
const floatingCardStyle = {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '20px',
    width: '250px',
    minHeight: '200px',
    border: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative'
};

const centerCardStyle = {
    ...floatingCardStyle,
    transform: 'scale(1.1)',
    borderColor: 'rgba(46, 204, 113, 0.3)',
    background: 'rgba(46, 204, 113, 0.05)'
};

const gridCardStyle = {
    background: '#1a1a1a',
    padding: '25px',
    borderRadius: '12px',
    textAlign: 'left',
    position: 'relative',
    border: '1px solid #333'
};

const stepBadgeStyle = (color) => ({
    background: color,
    color: 'white',
    padding: '5px 15px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    marginBottom: '15px',
    boxShadow: `0 4px 10px ${color}40`
});

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
