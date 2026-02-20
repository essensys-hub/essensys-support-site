import React from 'react';
import './Support.css';

const Support = () => {
    return (
        <div className="page-content support-container">
            <div className="support-card">
                <h1 className="support-title">Support & Documentation</h1>
                <p className="support-subtitle">
                    Guides pour installer et maintenir votre système Essensys.
                </p>

                <div className="support-doc-section">
                    <div className="support-doc-header">
                        {/* Wrench Icon */}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00C9FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                        </svg>
                        <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Installation</h2>
                    </div>
                    <ul className="support-doc-list">
                        <li style={{ marginBottom: '10px' }}>
                            <a href="https://essensys-hub.github.io/essensys-raspberry-install/V.1.2.0/installation/" className="support-doc-link">
                                <span style={{ marginRight: '8px', fontSize: '0.8em' }}>▶</span> Installer le Serveur sur Raspberry Pi
                            </a>
                        </li>
                        <li>
                            <a href="https://essensys-hub.github.io/essensys-raspberry-install/V.1.2.0/installation/preparation/" className="support-doc-link">
                                <span style={{ marginRight: '8px', fontSize: '0.8em' }}>▶</span> Connecter le Matériel
                            </a>
                        </li>
                    </ul>
                </div>

                <div className="support-doc-section">
                    <div className="support-doc-header">
                        {/* Lifebuoy Icon */}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00C9FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                            <circle cx="12" cy="12" r="10"></circle>
                            <circle cx="12" cy="12" r="4"></circle>
                            <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line>
                            <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line>
                            <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line>
                            <line x1="14.83" y1="9.17" x2="18.36" y2="5.64"></line>
                            <line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line>
                        </svg>
                        <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Dépannage</h2>
                    </div>
                    <ul className="support-doc-list">
                        <li style={{ marginBottom: '10px' }}>
                            <a href="hhttps://essensys-hub.github.io/essensys-raspberry-install/V.1.2.0/maintenance/" className="support-doc-link">
                                <span style={{ marginRight: '8px', fontSize: '0.8em' }}>▶</span> Problèmes Courants
                            </a>
                        </li>
                        <li>
                            <a href="https://essensys-hub.github.io/essensys-raspberry-install/V.1.2.0/logs/" className="support-doc-link">
                                <span style={{ marginRight: '8px', fontSize: '0.8em' }}>▶</span> Outils de Diagnostic
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Support;
