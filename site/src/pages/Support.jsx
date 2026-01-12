import React from 'react';

const Support = () => {
    return (
        <div className="page-content">
            <h1>Support & Documentation</h1>
            <p>Vous trouverez ici les guides pour installer et maintenir votre système Essensys.</p>

            <div className="doc-section">
                <h2>Installation</h2>
                <ul>
                    <li><a href="#">Installer le Serveur sur Raspberry Pi</a></li>
                    <li><a href="#">Connecter le Matériel</a></li>
                </ul>
            </div>

            <div className="doc-section">
                <h2>Dépannage</h2>
                <ul>
                    <li><a href="#">Problèmes Courants</a></li>
                    <li><a href="#">Outils de Diagnostic</a></li>
                </ul>
            </div>
        </div>
    );
};

export default Support;
